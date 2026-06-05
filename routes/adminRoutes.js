const router = require("express").Router();
const adminController = require("../controllers/adminController");
const { requireAdmin } = require("../middleware/adminAuth");

// Authentication
router.post("/login", adminController.login);
router.post("/logout", requireAdmin, adminController.logout);

// Current User
router.get("/me", requireAdmin, adminController.me);
router.patch("/update", requireAdmin, adminController.updateSettings);

// User Management
router.get("/", requireAdmin, adminController.listUsers);
router.post("/", requireAdmin, adminController.createUser);
router.patch("/:id", requireAdmin, adminController.updateUser);
router.delete("/:id", requireAdmin, adminController.deleteUser);

module.exports = router;
