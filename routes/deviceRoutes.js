const router = require("express").Router();
const deviceController = require("../controllers/deviceController");
const { requireAdmin } = require("../middleware/adminAuth");

router.post("/register", deviceController.register);
router.post("/heartbeat", deviceController.heartbeat);
router.get("/", requireAdmin, deviceController.list);
router.get("/:id", requireAdmin, deviceController.getDevice);
router.delete("/:id", requireAdmin, deviceController.deleteDevice);

module.exports = router;
