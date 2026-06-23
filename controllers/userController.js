const UserModel = require("../models/UserModel");

async function searchUser(req, res) {
  try {
    const { id, email } = req.query;

    if (!id && !email) {
      return res.status(400).json({ error: "Provide either 'id' or 'email' query parameter" });
    }

    let user = null;

    if (id) {
      // Try to find by user ID (MongoDB ObjectId)
      // Handle invalid ObjectId format gracefully
      try {
        user = await UserModel.getUserById(id);
      } catch (err) {
        // Invalid ObjectId format, fall through to email search
        user = null;
      }
    }

    if (!user && email) {
      // Try to find by email
      user = await UserModel.getUserByEmail(email);
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        subscription: user.subscription || { plan: "Free", status: "active" },
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error("Search user error:", error);
    return res.status(500).json({ error: "Failed to search user" });
  }
}

async function getUserDetails(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const user = await UserModel.getUserById(id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        subscription: user.subscription || { plan: "Free", status: "active" },
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error("Get user details error:", error);
    return res.status(500).json({ error: "Failed to get user details" });
  }
}

async function updateSubscription(req, res) {
  try {
    const { id } = req.params;
    const { plan, renewalDate } = req.body;

    if (!id) {
      return res.status(400).json({ error: "User ID is required" });
    }

    if (!plan) {
      return res.status(400).json({ error: "Plan name is required" });
    }

    const validPlans = ["Free", "Pro", "Ultimate", "Pro Plus", "Ultimate Plus"];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({ error: `Invalid plan. Allowed: ${validPlans.join(", ")}` });
    }

    const updatedUser = await UserModel.updateUserSubscription(
      id,
      plan,
      renewalDate ? new Date(renewalDate) : null
    );

    return res.json({
      success: true,
      user: {
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        subscription: updatedUser.subscription,
        updatedAt: updatedUser.updatedAt
      }
    });
  } catch (error) {
    console.error("Update subscription error:", error);
    if (error.message.includes("User not found")) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(500).json({ error: "Failed to update subscription" });
  }
}

module.exports = {
  searchUser,
  getUserDetails,
  updateSubscription
};
