const db = require("../config/database");

const registerDevice = db.prepare(`
  INSERT INTO devices (device_id, computer_name, os_name, version, status, last_seen)
  VALUES (?, ?, ?, ?, 'online', CURRENT_TIMESTAMP)
  ON CONFLICT(device_id) DO UPDATE SET
    computer_name = excluded.computer_name,
    os_name = excluded.os_name,
    version = excluded.version,
    status = 'online',
    last_seen = CURRENT_TIMESTAMP
`);

const heartbeatDevice = db.prepare(`
  UPDATE devices
  SET status = 'online', last_seen = CURRENT_TIMESTAMP
  WHERE device_id = ?
`);

const listDevices = db.prepare(`
  SELECT device_id, computer_name, version
  FROM devices
  ORDER BY last_seen DESC
`);

const insertLog = db.prepare(`
  INSERT INTO logs (device_id, action, created_at)
  VALUES (?, ?, CURRENT_TIMESTAMP)
`);

function register(req, res) {
  const { device_id, computer_name, version, os } = req.body;

  if (!device_id) {
    return res.status(400).json({ error: "device_id is required" });
  }

  registerDevice.run(device_id, computer_name || null, os || null, version || null);
  insertLog.run(device_id, "register");

  return res.status(201).json({ success: true });
}

function heartbeat(req, res) {
  const { device_id } = req.body;

  if (!device_id) {
    return res.status(400).json({ error: "device_id is required" });
  }

  const result = heartbeatDevice.run(device_id);

  if (result.changes === 0) {
    return res.status(404).json({ error: "device not found" });
  }

  insertLog.run(device_id, "heartbeat");

  return res.json({ success: true });
}

function list(req, res) {
  return res.json(listDevices.all());
}

module.exports = {
  register,
  heartbeat,
  list
};
