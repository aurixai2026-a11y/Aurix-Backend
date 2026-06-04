const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const databaseDir = path.join(__dirname, "..", "database");
const databasePath = path.join(databaseDir, "aurix.db");

fs.mkdirSync(databaseDir, { recursive: true });

const db = new Database(databasePath);

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

module.exports = db;
