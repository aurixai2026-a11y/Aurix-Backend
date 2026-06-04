const router = require("express").Router();
const deviceController = require("../controllers/deviceController");
const { requireAdmin } = require("../middleware/adminAuth");

router.post("/register", deviceController.register);
router.post("/heartbeat", deviceController.heartbeat);
router.get("/", requireAdmin, deviceController.list);

module.exports = router;
