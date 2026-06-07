const { getDB } = require("../config/mongodb");

async function createHeartbeat(device_id, data = {}) {
  const db = getDB();
  const heartbeatsCol = db.collection("heartbeats");

  const entry = {
    device_id,
    data: Object.keys(data).length ? data : null,
    created_at: new Date(),
    timestamp: Date.now()
  };

  const result = await heartbeatsCol.insertOne(entry);
  return { _id: result.insertedId, ...entry };
}

async function getDeviceHeartbeats(device_id, limit = 100, skip = 0) {
  const db = getDB();
  const heartbeatsCol = db.collection("heartbeats");

  const heartbeats = await heartbeatsCol
    .find({ device_id })
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();

  const total = await heartbeatsCol.countDocuments({ device_id });

  return {
    heartbeats,
    total,
    limit,
    skip,
    hasMore: skip + heartbeats.length < total
  };
}

async function deleteOldHeartbeats(days = 30) {
  const db = getDB();
  const heartbeatsCol = db.collection("heartbeats");

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const result = await heartbeatsCol.deleteMany({
    created_at: { $lt: cutoffDate }
  });

  return result;
}

module.exports = {
  createHeartbeat,
  getDeviceHeartbeats,
  deleteOldHeartbeats
};
