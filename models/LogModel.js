const { getDB } = require("../config/mongodb");

async function createLog(device_id, command, status = "success", response = null) {
  const db = getDB();
  const logsCol = db.collection("logs");

  const logEntry = {
    device_id,
    command,
    status,
    response: response || null,
    created_at: new Date(),
    timestamp: Date.now()
  };

  const result = await logsCol.insertOne(logEntry);
  return { _id: result.insertedId, ...logEntry };
}

async function getDeviceLogs(device_id, limit = 100, skip = 0) {
  const db = getDB();
  const logsCol = db.collection("logs");

  const logs = await logsCol
    .find({ device_id })
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();

  const total = await logsCol.countDocuments({ device_id });

  return {
    logs,
    total,
    limit,
    skip,
    hasMore: skip + logs.length < total
  };
}

async function getAllLogs(limit = 100, skip = 0) {
  const db = getDB();
  const logsCol = db.collection("logs");

  const logs = await logsCol
    .find()
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();

  const total = await logsCol.countDocuments();

  return {
    logs,
    total,
    limit,
    skip,
    hasMore: skip + logs.length < total
  };
}

async function getLogsByDateRange(startDate, endDate, device_id = null) {
  const db = getDB();
  const logsCol = db.collection("logs");

  const query = {
    created_at: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  };

  if (device_id) {
    query.device_id = device_id;
  }

  const logs = await logsCol
    .find(query)
    .sort({ created_at: -1 })
    .toArray();

  return logs;
}

async function deleteOldLogs(days = 30) {
  const db = getDB();
  const logsCol = db.collection("logs");

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const result = await logsCol.deleteMany({
    created_at: { $lt: cutoffDate }
  });

  return result;
}

module.exports = {
  createLog,
  getDeviceLogs,
  getAllLogs,
  getLogsByDateRange,
  deleteOldLogs
};
