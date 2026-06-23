const { getDB } = require("../config/mongodb");
const { ObjectId } = require("mongodb");
const crypto = require("crypto");

async function getAdminUser() {
  const db = getDB();
  const usersCol = db.collection("users");

  const user = await usersCol.findOne({});
  return user;
}

async function getAllUsers() {
  const db = getDB();
  const usersCol = db.collection("users");

  return await usersCol.find({}).toArray();
}

async function getUserById(userId) {
  const db = getDB();
  const usersCol = db.collection("users");

  return await usersCol.findOne({ _id: new ObjectId(userId) });
}

async function createAdminUser(username, password_hash) {
  const db = getDB();
  const usersCol = db.collection("users");

  const result = await usersCol.insertOne({
    username,
    email: null,
    password_hash,
    subscription: {
      plan: "Free",
      status: "active",
      renewalDate: null,
      createdAt: new Date()
    },
    createdAt: new Date(),
    updatedAt: new Date()
  });

  return await usersCol.findOne({ _id: result.insertedId });
}

async function updateAdminUser(user_id, username, password_hash) {
  const db = getDB();
  const usersCol = db.collection("users");

  const updateData = {
    username,
    updatedAt: new Date()
  };

  if (password_hash) {
    updateData.password_hash = password_hash;
  }

  const result = await usersCol.updateOne(
    { _id: new ObjectId(user_id) },
    { $set: updateData }
  );

  if (result.matchedCount === 0) {
    throw new Error("User not found");
  }

  return await usersCol.findOne({ _id: new ObjectId(user_id) });
}

async function deleteAdminUser(user_id) {
  const db = getDB();
  const usersCol = db.collection("users");

  const result = await usersCol.deleteOne({ _id: new ObjectId(user_id) });

  if (result.deletedCount === 0) {
    throw new Error("User not found");
  }

  return true;
}

async function getUserByUsername(username) {
  const db = getDB();
  const usersCol = db.collection("users");

  return await usersCol.findOne({ username });
}

// ===== Subscription Management Functions =====
async function getUserByEmail(email) {
  const db = getDB();
  const usersCol = db.collection("users");

  return await usersCol.findOne({ email });
}

async function getUserById(userId) {
  const db = getDB();
  const usersCol = db.collection("users");

  return await usersCol.findOne({ _id: new ObjectId(userId) });
}

async function updateUserSubscription(userId, planName, renewalDate = null) {
  const db = getDB();
  const usersCol = db.collection("users");

  const result = await usersCol.findOneAndUpdate(
    { _id: new ObjectId(userId) },
    {
      $set: {
        subscription: {
          plan: planName,
          status: "active",
          renewalDate: renewalDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
          updatedAt: new Date()
        },
        updatedAt: new Date()
      }
    },
    { returnDocument: 'after' }
  );

  if (!result.value) {
    throw new Error("User not found");
  }

  return result.value;
}

module.exports = {
  getAdminUser,
  getAllUsers,
  getUserById,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  getUserByUsername,
  getUserByEmail,
  updateUserSubscription
};
