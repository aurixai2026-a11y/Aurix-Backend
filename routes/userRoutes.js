const router = require("express").Router();
const userController = require("../controllers/userController");

// Public: get user details by id
router.get("/:id", userController.getUser);

module.exports = router;
