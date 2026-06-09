const fs = require("fs");
const path = require("path");

// Make better-sqlite3 optional — some deployment targets don't have
// a compatible native toolchain or matching Node/V8 headers. If the
// module is unavailable, export a stub so the rest of the app can run
// using MongoDB as the primary datastore.
let db = null;
try {
  const Database = require("better-sqlite3");

  const databaseDir = path.join(__dirname, "..", "database");
  const databasePath = path.join(databaseDir, "aurix.db");

  fs.mkdirSync(databaseDir, { recursive: true });

  db = new Database(databasePath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS devices(
      id INTEGER PRIMARY KEY,
      device_id TEXT UNIQUE,
      computer_name TEXT,
      os_name TEXT,
      version TEXT,
      status TEXT,
      last_seen DATETIME
    );

    CREATE TABLE IF NOT EXISTS users(
      id INTEGER PRIMARY KEY,
      username TEXT,
      email TEXT,
      password_hash TEXT
    );

    CREATE TABLE IF NOT EXISTS logs(
      id INTEGER PRIMARY KEY,
      device_id TEXT,
      action TEXT,
      created_at DATETIME
    );
  `);
} catch (err) {
  console.warn("better-sqlite3 not available — skipping local SQLite DB initialization.", err.message);
  // Export null — callers should use MongoDB primary DB instead.
  db = null;
}

module.exports = db;
