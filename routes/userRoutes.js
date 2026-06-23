const router = require("express").Router();
const userController = require("../controllers/userController");

// Search user by ID or email (public - no auth required for subscription lookup)
router.get("/search", userController.searchUser);

// Get user details by ID (public)
router.get("/:id", userController.getUserDetails);

// Update user subscription by ID (public - will add auth check in frontend)
router.put("/:id/subscription", userController.updateSubscription);

module.exports = router;
