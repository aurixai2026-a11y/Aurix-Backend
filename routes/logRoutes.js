const router = require("express").Router();
const logController = require("../controllers/logController");
const { requireAdmin } = require("../middleware/adminAuth");

// Create log from device
router.post("/", logController.createLog);

// Get logs by device (admin only)
router.get("/device/:device_id", requireAdmin, logController.getDeviceLogs);

// Get all logs (admin only)
router.get("/all", requireAdmin, logController.getAllLogs);

// Get logs by date range (admin only)
router.get("/range", requireAdmin, logController.getLogsByDateRange);

module.exports = router;
