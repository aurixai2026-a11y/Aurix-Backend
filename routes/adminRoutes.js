const router = require("express").Router();
const adminController = require("../controllers/adminController");
const { requireAdmin } = require("../middleware/adminAuth");

router.post("/login", adminController.login);
router.get("/me", requireAdmin, adminController.me);
router.patch("/settings", requireAdmin, adminController.updateSettings);
router.post("/logout", requireAdmin, adminController.logout);

module.exports = router;
