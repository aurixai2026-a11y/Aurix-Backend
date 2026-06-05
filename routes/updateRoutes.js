const router = require("express").Router();
const updateController = require("../controllers/updateController");
const { requireAdmin } = require("../middleware/adminAuth");

router.get("/", requireAdmin, updateController.listUpdates);
router.post("/:id/install", requireAdmin, updateController.installUpdate);

module.exports = router;
