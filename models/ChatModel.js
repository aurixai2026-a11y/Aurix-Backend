const { getDB } = require("../config/mongodb");
const { ObjectId } = require("mongodb");

async function createChat(title, messages = []) {
  const db = getDB();
  const chats = db.collection("chats");

  const doc = {
    title: title || "Untitled Chat",
    messages,
    created_at: new Date(),
    updated_at: new Date()
  };

  const result = await chats.insertOne(doc);
  return await chats.findOne({ _id: result.insertedId });
}

async function addMessage(chatId, message) {
  const db = getDB();
  const chats = db.collection("chats");

  const result = await chats.findOneAndUpdate(
    { _id: new ObjectId(chatId) },
    { $push: { messages: message }, $set: { updated_at: new Date() } },
    { returnDocument: 'after' }
  );

  return result.value;
}

async function listChats(limit = 50, skip = 0) {
  const db = getDB();
  const chats = db.collection("chats");

  const items = await chats.find()
    .sort({ updated_at: -1 })
    .skip(parseInt(skip))
    .limit(parseInt(limit))
    .toArray();

  return items;
}

async function getChatById(id) {
  const db = getDB();
  const chats = db.collection("chats");

  return await chats.findOne({ _id: new ObjectId(id) });
}

async function deleteChat(id) {
  const db = getDB();
  const chats = db.collection("chats");

  const result = await chats.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}

module.exports = {
  createChat,
  addMessage,
  listChats,
  getChatById,
  deleteChat
};
