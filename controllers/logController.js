const LogModel = require("../models/LogModel");

async function createLog(req, res) {
  try {
    const { device_id, command, status, response } = req.body;

    if (!device_id || !command) {
      return res.status(400).json({ error: "device_id and command are required" });
    }

    const log = await LogModel.createLog(device_id, command, status || "success", response);

    return res.status(201).json(log);
  } catch (error) {
    console.error("Create log error:", error);
    return res.status(500).json({ error: "Failed to create log" });
  }
}

async function getDeviceLogs(req, res) {
  try {
    const { device_id } = req.params;
    const { limit = 100, skip = 0 } = req.query;

    if (!device_id) {
      return res.status(400).json({ error: "device_id is required" });
    }

    const result = await LogModel.getDeviceLogs(device_id, parseInt(limit), parseInt(skip));

    return res.json(result);
  } catch (error) {
    console.error("Get device logs error:", error);
    return res.status(500).json({ error: "Failed to retrieve logs" });
  }
}

async function getAllLogs(req, res) {
  try {
    const { limit = 100, skip = 0 } = req.query;

    const result = await LogModel.getAllLogs(parseInt(limit), parseInt(skip));

    return res.json(result);
  } catch (error) {
    console.error("Get all logs error:", error);
    return res.status(500).json({ error: "Failed to retrieve logs" });
  }
}

async function getLogsByDateRange(req, res) {
  try {
    const { startDate, endDate, device_id } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: "startDate and endDate are required" });
    }

    const logs = await LogModel.getLogsByDateRange(startDate, endDate, device_id);

    return res.json({
      logs,
      total: logs.length,
      startDate,
      endDate,
      device_id: device_id || "all"
    });
  } catch (error) {
    console.error("Get logs by date range error:", error);
    return res.status(500).json({ error: "Failed to retrieve logs" });
  }
}

module.exports = {
  createLog,
  getDeviceLogs,
  getAllLogs,
  getLogsByDateRange
};
