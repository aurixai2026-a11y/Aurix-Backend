const ChatModel = require("../models/ChatModel");

async function createChat(req, res) {
  try {
    const { title, messages, device_id } = req.body;
    const chat = await ChatModel.createChat(title, Array.isArray(messages) ? messages : [], device_id || null);
    return res.status(201).json(chat);
  } catch (error) {
    console.error("Create chat error:", error);
    return res.status(500).json({ error: "Failed to create chat" });
  }
}

async function addMessage(req, res) {
  try {
    const { id } = req.params;
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "message is required" });
    const updated = await ChatModel.addMessage(id, message);
    return res.json(updated);
  } catch (error) {
    console.error("Add message error:", error);
    return res.status(500).json({ error: "Failed to add message" });
  }
}

async function listChats(req, res) {
  try {
    const { limit = 50, skip = 0, device_id = null } = req.query;
    const items = await ChatModel.listChats(limit, skip, device_id);
    return res.json({ chats: items });
  } catch (error) {
    console.error("List chats error:", error);
    return res.status(500).json({ error: "Failed to list chats" });
  }
}

async function getChat(req, res) {
  try {
    const { id } = req.params;
    const chat = await ChatModel.getChatById(id);
    if (!chat) return res.status(404).json({ error: "Chat not found" });
    return res.json(chat);
  } catch (error) {
    console.error("Get chat error:", error);
    return res.status(500).json({ error: "Failed to get chat" });
  }
}

async function updateChat(req, res) {
  try {
    const { id } = req.params;
    const updated = await ChatModel.updateChat(id, req.body || {});
    if (!updated) return res.status(404).json({ error: "Chat not found" });
    return res.json(updated);
  } catch (error) {
    console.error("Update chat error:", error);
    return res.status(500).json({ error: "Failed to update chat" });
  }
}

async function deleteChat(req, res) {
  try {
    const { id } = req.params;
    const ok = await ChatModel.deleteChat(id);
    if (!ok) return res.status(404).json({ error: "Chat not found" });
    return res.json({ success: true });
  } catch (error) {
    console.error("Delete chat error:", error);
    return res.status(500).json({ error: "Failed to delete chat" });
  }
}

module.exports = {
  createChat,
  addMessage,
  listChats,
  getChat,
  updateChat,
  deleteChat
};
