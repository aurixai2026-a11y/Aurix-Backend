const { getDB } = require("../config/mongodb");
const { ObjectId } = require("mongodb");

async function registerDevice(device_id, computer_name, os_name, version) {
  const db = getDB();
  const devicesCol = db.collection("devices");
  const logsCol = db.collection("logs");

  const result = await devicesCol.updateOne(
    { device_id },
    {
      $set: {
        device_id,
        computer_name: computer_name || null,
        os_name: os_name || null,
        version: version || null,
        is_online: true,
        last_seen: new Date()
      }
    },
    { upsert: true }
  );

  // Log the event
  await logsCol.insertOne({
    device_id,
    action: "register",
    created_at: new Date()
  });

  return result;
}

async function heartbeatDevice(device_id) {
  const db = getDB();
  const devicesCol = db.collection("devices");
  const heartbeatsCol = db.collection("heartbeats");

  const result = await devicesCol.updateOne(
    { device_id },
    {
      $set: {
        is_online: true,
        last_seen: new Date()
      }
    }
  );

  if (result.matchedCount === 0) {
    throw new Error("Device not found");
  }

  // Log the heartbeat
  await heartbeatsCol.insertOne({
    device_id,
    action: "heartbeat",
    created_at: new Date()
  });

  return result;
}

async function listDevices() {
  const db = getDB();
  const devicesCol = db.collection("devices");

  const devices = await devicesCol
    .find()
    .sort({ last_seen: -1 })
    .toArray();

  // Add is_online based on last_seen
  return devices.map((device) => ({
    ...device,
    is_online:
      device.last_seen && new Date() - device.last_seen < 60000 ? true : false,
    last_seen: device.last_seen ? device.last_seen.toISOString() : null
  }));
}

async function getDeviceById(deviceId) {
  const db = getDB();
  const devicesCol = db.collection("devices");

  const device = await devicesCol.findOne({ _id: new ObjectId(deviceId) });

  if (!device) {
    return null;
  }

  return {
    ...device,
    is_online:
      device.last_seen && new Date() - device.last_seen < 60000 ? true : false,
    last_seen: device.last_seen ? device.last_seen.toISOString() : null
  };
}

async function deleteDevice(deviceId) {
  const db = getDB();
  const devicesCol = db.collection("devices");

  const result = await devicesCol.deleteOne({ _id: new ObjectId(deviceId) });

  if (result.deletedCount === 0) {
    throw new Error("Device not found");
  }

  return true;
}

module.exports = {
  registerDevice,
  heartbeatDevice,
  listDevices,
  getDeviceById,
  deleteDevice
};
