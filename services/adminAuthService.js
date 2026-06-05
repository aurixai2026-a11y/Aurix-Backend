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
    const existingAdmin = await UserModel.getAdminUser();
    if (!existingAdmin) {
      console.log("ℹ️  No admin found. Creating default admin...");
      const hashed = hashPassword("admin123");
      console.log("ℹ️  Password hash created");
      await UserModel.createAdminUser("admin", hashed);
      console.log("✓ Default admin created (username: admin, password: admin123)");
    } else {
      console.log("✓ Default admin already exists:", existingAdmin.username);
    }
  } catch (error) {
    console.error("❌ Error ensuring default admin:", error.message);
    console.error(error);
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
  const admin = await UserModel.getAdminUser();

  if (!admin || admin.username !== username || !verifyPassword(password, admin.password_hash)) {
    return null;
  }

  return admin;
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
