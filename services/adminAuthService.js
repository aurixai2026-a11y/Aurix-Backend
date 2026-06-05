const crypto = require("crypto");
const UserModel = require("../models/UserModel");
const { ObjectId } = require("mongodb");

const SESSION_DURATION_MS = 12 * 60 * 60 * 1000;
const sessions = new Map();

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");

  return `scrypt$${salt}$${hash}`;
}

function verifyPassword(password, storedHash) {
  const parts = String(storedHash || "").split("$");

  if (parts.length !== 3 || parts[0] !== "scrypt") {
    return false;
  }

  const [, salt, hash] = parts;
  const expected = Buffer.from(hash, "hex");
  const actual = crypto.scryptSync(password, salt, 64);

  if (expected.length !== actual.length) {
    return false;
  }

  return crypto.timingSafeEqual(expected, actual);
}

async function ensureDefaultAdmin() {
  try {
    console.log("📝 Checking for existing admin user...");
    const existingAdmin = await UserModel.getAdminUser();
    
    if (!existingAdmin) {
      console.log("🔐 No admin found, creating default admin (admin/admin123)...");
      const hashedPassword = hashPassword("admin123");
      console.log("🔐 Password hashed:", hashedPassword.substring(0, 20) + "...");
      
      const newAdmin = await UserModel.createAdminUser("admin", hashedPassword);
      console.log("✓ Default admin created successfully", newAdmin._id);
    } else {
      console.log("✓ Admin user exists:", existingAdmin.username, existingAdmin._id);
    }
  } catch (error) {
    console.error("❌ Error ensuring default admin:", error.message);
    console.error("Stack trace:", error.stack);
    throw error; // Re-throw to let server know initialization failed
  }
}

function createSession(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + SESSION_DURATION_MS;

  sessions.set(token, { userId, expiresAt });

  return token;
}

function deleteSession(token) {
  sessions.delete(token);
}

async function getSessionUser(token) {
  const session = sessions.get(token);

  if (!session) {
    return null;
  }

  if (session.expiresAt <= Date.now()) {
    sessions.delete(token);
    return null;
  }

  const admin = await UserModel.getAdminUser();

  if (!admin || admin._id.toString() !== session.userId.toString()) {
    sessions.delete(token);
    return null;
  }

  return admin;
}

async function authenticateAdmin(username, password) {
  try {
    console.log("🔐 Attempting authentication for username:", username);
    const admin = await UserModel.getAdminUser();
    
    if (!admin) {
      console.log("❌ No admin user found in database");
      return null;
    }
    
    console.log("✓ Found admin user:", admin.username);
    
    if (admin.username !== username) {
      console.log("❌ Username mismatch. Expected:", admin.username, "Got:", username);
      return null;
    }
    
    console.log("✓ Username matches");
    
    const passwordValid = verifyPassword(password, admin.password_hash);
    console.log("✓ Password verification:", passwordValid ? "PASSED" : "FAILED");
    
    if (!passwordValid) {
      return null;
    }
    
    console.log("✓ Authentication successful for:", username);
    return admin;
  } catch (error) {
    console.error("❌ Authentication error:", error.message);
    return null;
  }
}

async function updateAdminSettings(adminId, username, password) {
  const currentAdmin = await UserModel.getAdminUser();

  if (!currentAdmin || currentAdmin._id.toString() !== adminId.toString()) {
    return null;
  }

  const updatedAdmin = await UserModel.updateAdminUser(
    currentAdmin._id,
    username,
    hashPassword(password)
  );

  return updatedAdmin;
}

module.exports = {
  hashPassword,
  verifyPassword,
  authenticateAdmin,
  createSession,
  deleteSession,
  getSessionUser,
  updateAdminSettings,
  ensureDefaultAdmin
};
