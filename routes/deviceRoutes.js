const router = require("express").Router();
const deviceController = require("../controllers/deviceController");

router.post("/register", deviceController.register);
router.post("/heartbeat", deviceController.heartbeat);
router.get("/", deviceController.list);

module.exports = router;
