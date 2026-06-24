const UserModel = require("../models/UserModel");
const { getDB } = require("../config/mongodb");
const { ObjectId } = require("mongodb");

async function searchUser(req, res) {
  try {
    const { id, email } = req.query;

    if (!id && !email) {
      return res.status(400).json({ error: "Provide either 'id' or 'email' query parameter" });
    }

    let user = null;
    const db = getDB();

    if (id) {
      // Try to find by user ID (MongoDB ObjectId)
      // Handle invalid ObjectId format gracefully
      try {
        user = await UserModel.getUserById(id);
      } catch (err) {
        // Invalid ObjectId format, fall through to other searches
        user = null;
      }

      // If not found by user ID, try searching by device_id
      if (!user) {
        const devicesCol = db.collection("devices");
        const device = await devicesCol.findOne({ device_id: id });
        
        if (device) {
          // Map device data to user format
          user = {
            _id: device._id,
            username: device.username || "Device User",
            email: device.email || null,
            device_id: device.device_id,
            subscription: device.subscriptions && device.subscriptions[0] 
              ? {
                  plan: device.subscriptions[0].plan || "Free",
                  status: "active",
                  // Normalize renewal field names that may differ between collections
                  renewalDate: device.subscriptions[0].renew || device.subscriptions[0].renewalDate || null
                }
              : { plan: "Free", status: "active", renewalDate: null },
            createdAt: device.last_seen || new Date()
          };
        }
      }
    }

    if (!user && email) {
      // Try to find by email in users collection
      user = await UserModel.getUserByEmail(email);
      
      // If not found in users, try devices collection
      if (!user) {
        const devicesCol = db.collection("devices");
        const device = await devicesCol.findOne({ email });
        
        if (device) {
          user = {
            _id: device._id,
            username: device.username || "Device User",
            email: device.email || null,
            device_id: device.device_id,
            subscription: device.subscriptions && device.subscriptions[0]
              ? {
                  plan: device.subscriptions[0].plan || "Free",
                  status: "active",
                  renewalDate: device.subscriptions[0].renew || device.subscriptions[0].renewalDate || null
                }
              : { plan: "Free", status: "active", renewalDate: null },
            createdAt: device.last_seen || new Date()
          };
        }
      }
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        device_id: user.device_id || null,
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

    const validPlans = ["Aurix Free", "Aurix Pro", "Aurix Ultimate", "Aurix Pro Plus", "Aurix Ultimate Plus"];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({ error: `Invalid plan. Allowed: ${validPlans.join(", ")}` });
    }

    let updatedUser = null;
    const db = getDB();

    // Try to update in users collection first
    try {
      updatedUser = await UserModel.updateUserSubscription(
        id,
        plan,
        renewalDate ? new Date(renewalDate) : null
      );
    } catch (err) {
      // If user not found, try updating in devices collection
      const devicesCol = db.collection("devices");

      try {
        const deviceObjectId = new ObjectId(id);
        const result = await devicesCol.findOneAndUpdate(
          { _id: deviceObjectId },
          {
            $set: {
              subscriptions: [
                {
                  plan: plan,
                  renew: renewalDate ? new Date(renewalDate).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                }
              ]
            }
          },
          { returnDocument: 'after' }
        );

        if (!result.value) {
          throw new Error("User not found");
        }

        // Map device response back to user format
        updatedUser = {
          _id: result.value._id,
          username: result.value.username,
          email: result.value.email,
          device_id: result.value.device_id,
          subscription: {
            plan: plan,
            status: "active",
            renewalDate: renewalDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            updatedAt: new Date()
          }
        };
      } catch (innerErr) {
        throw new Error("User not found");
      }
    }

    return res.json({
      success: true,
      user: {
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        device_id: updatedUser.device_id || null,
        subscription: updatedUser.subscription,
        updatedAt: updatedUser.updatedAt || new Date()
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
