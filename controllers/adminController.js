const {
  authenticateAdmin,
  createSession,
  deleteSession,
  updateAdminSettings,
  verifyPassword
} = require("../services/adminAuthService");

function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Admin name and password are required" });
  }

  const admin = authenticateAdmin(String(username).trim(), String(password));

  if (!admin) {
    return res.status(401).json({ error: "Invalid admin name or password" });
  }

  return res.json({
    token: createSession(admin.id),
    username: admin.username
  });
}

function me(req, res) {
  return res.json({ username: req.admin.username });
}

function updateSettings(req, res) {
  const { username, currentPassword, newPassword } = req.body;
  const nextUsername = String(username || "").trim();
  const nextPassword = String(newPassword || "");

  if (!nextUsername) {
    return res.status(400).json({ error: "Admin name is required" });
  }

  if (!currentPassword) {
    return res.status(400).json({ error: "Current password is required" });
  }

  if (nextPassword.length > 0 && nextPassword.length < 6) {
    return res.status(400).json({ error: "New password must be at least 6 characters" });
  }

  if (!verifyPassword(String(currentPassword), req.admin.password_hash)) {
    return res.status(401).json({ error: "Current password is incorrect" });
  }

  const updatedAdmin = updateAdminSettings(
    req.admin.id,
    nextUsername,
    nextPassword || String(currentPassword)
  );

  if (!updatedAdmin) {
    return res.status(404).json({ error: "Admin user not found" });
  }

  return res.json({ username: updatedAdmin.username });
}

function logout(req, res) {
  deleteSession(req.adminToken);

  return res.json({ success: true });
}

module.exports = {
  login,
  me,
  updateSettings,
  logout
};
