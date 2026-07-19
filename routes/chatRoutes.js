const router = require("express").Router();
const chatController = require("../controllers/chatController");

// Public chat endpoints
router.post("/", chatController.createChat);
router.get("/", chatController.listChats);
router.get("/:id", chatController.getChat);
router.patch("/:id", chatController.updateChat);
router.post("/:id/message", chatController.addMessage);
router.delete("/:id", chatController.deleteChat);

module.exports = router;
