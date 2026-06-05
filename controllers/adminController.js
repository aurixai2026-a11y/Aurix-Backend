const {
  authenticateAdmin,
  createSession,
  deleteSession,
  updateAdminSettings,
  verifyPassword,
  hashPassword
} = require("../services/adminAuthService");
const {
  getAllUsers,
  getUserById,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser
} = require("../models/UserModel");

async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Admin name and password are required" });
    }

    const admin = await authenticateAdmin(String(username).trim(), String(password));

    if (!admin) {
      return res.status(401).json({ error: "Invalid admin name or password" });
    }

    return res.json({
      token: createSession(admin._id),
      username: admin.username
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Login failed" });
  }
}

async function me(req, res) {
  try {
    return res.json({ 
      user: {
        _id: req.admin._id,
        username: req.admin.username,
        email: req.admin.email
      }
    });
  } catch (error) {
    console.error("Me error:", error);
    return res.status(500).json({ error: "Failed to get user info" });
  }
}

async function listUsers(req, res) {
  try {
    const users = await getAllUsers();
    return res.json({ users });
  } catch (error) {
    console.error("List users error:", error);
    return res.status(500).json({ error: "Failed to list users" });
  }
}

async function createUser(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const existingUser = await getUserById(username);
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const password_hash = hashPassword(String(password));
    const newUser = await createAdminUser(String(username).trim(), password_hash);

    return res.status(201).json({ 
      user: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        createdAt: newUser.createdAt
      }
    });
  } catch (error) {
    console.error("Create user error:", error);
    return res.status(500).json({ error: "Failed to create user" });
  }
}

async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { username, password } = req.body;

    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    let password_hash;
    if (password) {
      password_hash = hashPassword(String(password));
    }

    const updatedUser = await updateAdminUser(id, String(username).trim(), password_hash);

    return res.json({ 
      user: {
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        updatedAt: updatedUser.updatedAt
      }
    });
  } catch (error) {
    console.error("Update user error:", error);
    if (error.message.includes("User not found")) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(500).json({ error: "Failed to update user" });
  }
}

async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    if (String(id) === String(req.admin._id)) {
      return res.status(400).json({ error: "Cannot delete yourself" });
    }

    await deleteAdminUser(id);

    return res.json({ success: true });
  } catch (error) {
    console.error("Delete user error:", error);
    if (error.message.includes("User not found")) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(500).json({ error: "Failed to delete user" });
  }
}

async function updateSettings(req, res) {
  try {
    const { username, current_password, new_password } = req.body;
    const nextUsername = String(username || "").trim();
    const nextPassword = String(new_password || "");

    if (!nextUsername) {
      return res.status(400).json({ error: "Admin name is required" });
    }

    if (!current_password) {
      return res.status(400).json({ error: "Current password is required" });
    }

    if (nextPassword.length > 0 && nextPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters" });
    }

    if (!verifyPassword(String(current_password), req.admin.password_hash)) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    const updatedAdmin = await updateAdminUser(
      req.admin._id,
      nextUsername,
      nextPassword ? hashPassword(String(nextPassword)) : null
    );

    if (!updatedAdmin) {
      return res.status(404).json({ error: "Admin user not found" });
    }

    return res.json({ 
      user: {
        username: updatedAdmin.username
      }
    });
  } catch (error) {
    console.error("Update settings error:", error);
    return res.status(500).json({ error: "Failed to update settings" });
  }
}

async function logout(req, res) {
  try {
    deleteSession(req.adminToken);
    return res.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ error: "Logout failed" });
  }
}

module.exports = {
  login,
  me,
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  updateSettings,
  logout
};
