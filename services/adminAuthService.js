const crypto = require("crypto");
const db = require("../config/database");

const SESSION_DURATION_MS = 12 * 60 * 60 * 1000;
const sessions = new Map();

const getAdminUser = db.prepare(`
  SELECT id, username, password_hash
  FROM users
  ORDER BY id
  LIMIT 1
`);

const insertAdminUser = db.prepare(`
  INSERT INTO users (username, email, password_hash)
  VALUES (?, NULL, ?)
`);

const updateAdminUser = db.prepare(`
  UPDATE users
  SET username = ?, password_hash = ?
  WHERE id = ?
`);

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

function ensureDefaultAdmin() {
  const existingAdmin = getAdminUser.get();

  if (!existingAdmin) {
    insertAdminUser.run("admin", hashPassword("admin123"));
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

function getSessionUser(token) {
  const session = sessions.get(token);

  if (!session) {
    return null;
  }

  if (session.expiresAt <= Date.now()) {
    sessions.delete(token);
    return null;
  }

  const admin = getAdminUser.get();

  if (!admin || admin.id !== session.userId) {
    sessions.delete(token);
    return null;
  }

  return admin;
}

function authenticateAdmin(username, password) {
  const admin = getAdminUser.get();

  if (!admin || admin.username !== username || !verifyPassword(password, admin.password_hash)) {
    return null;
  }

  return admin;
}

function updateAdminSettings(adminId, username, password) {
  const currentAdmin = getAdminUser.get();

  if (!currentAdmin || currentAdmin.id !== adminId) {
    return null;
  }

  updateAdminUser.run(username, hashPassword(password), adminId);

  return getAdminUser.get();
}

ensureDefaultAdmin();

module.exports = {
  authenticateAdmin,
  createSession,
  deleteSession,
  getSessionUser,
  updateAdminSettings,
  verifyPassword
};
