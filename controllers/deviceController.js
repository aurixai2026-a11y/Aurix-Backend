const DeviceModel = require("../models/DeviceModel");

async function register(req, res) {
  try {
    const { device_id, computer_name, version, os } = req.body;

    if (!device_id) {
      return res.status(400).json({ error: "device_id is required" });
    }

    await DeviceModel.registerDevice(device_id, computer_name || null, os || null, version || null);

    return res.status(201).json({ success: true });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ error: "Failed to register device" });
  }
}

async function heartbeat(req, res) {
  try {
    const { device_id } = req.body;

    if (!device_id) {
      return res.status(400).json({ error: "device_id is required" });
    }

    await DeviceModel.heartbeatDevice(device_id);

    return res.json({ success: true });
  } catch (error) {
    if (error.message === "Device not found") {
      return res.status(404).json({ error: "device not found" });
    }
    console.error("Heartbeat error:", error);
    return res.status(500).json({ error: "Failed to update heartbeat" });
  }
}

async function list(req, res) {
  try {
    const devices = await DeviceModel.listDevices();
    return res.json({ devices });
  } catch (error) {
    console.error("List devices error:", error);
    return res.status(500).json({ error: "Failed to list devices" });
  }
}

async function getDevice(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "device ID is required" });
    }

    const device = await DeviceModel.getDeviceById(id);

    if (!device) {
      return res.status(404).json({ error: "Device not found" });
    }

    return res.json(device);
  } catch (error) {
    console.error("Get device error:", error);
    return res.status(500).json({ error: "Failed to get device" });
  }
}

async function deleteDevice(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "device ID is required" });
    }

    await DeviceModel.deleteDevice(id);

    return res.json({ success: true });
  } catch (error) {
    if (error.message === "Device not found") {
      return res.status(404).json({ error: "Device not found" });
    }
    console.error("Delete device error:", error);
    return res.status(500).json({ error: "Failed to delete device" });
  }
}

module.exports = {
  register,
  heartbeat,
  list,
  getDevice,
  deleteDevice
};
