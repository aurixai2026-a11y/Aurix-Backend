const crypto = require("crypto");
const { getDB } = require("../config/mongodb");
const { ObjectId } = require("mongodb");
const UserModel = require("../models/UserModel");

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const RAZORPAY_API_URL = "https://api.razorpay.com/v1/orders";

function requireRazorpayConfig() {
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay credentials are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
  }
}

async function createOrder(req, res) {
  try {
    requireRazorpayConfig();

    const { amount, currency = "INR", receipt, plan, userId } = req.body;

    if (!amount || typeof amount !== "number" || amount < 100) {
      return res.status(400).json({ error: "Amount must be a number and at least 100 paise." });
    }

    if (!receipt || typeof receipt !== "string") {
      return res.status(400).json({ error: "Receipt identifier is required." });
    }

    if (!plan || typeof plan !== "string") {
      return res.status(400).json({ error: "Subscription plan name is required." });
    }

    if (!userId || typeof userId !== "string") {
      return res.status(400).json({ error: "User ID is required." });
    }

    const payload = {
      amount,
      currency,
      receipt,
      payment_capture: 1,
      notes: {
        plan,
        userId
      }
    };

    const authHeader = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64");

    const response = await fetch(RAZORPAY_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${authHeader}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Razorpay create order failed:", data);
      return res.status(502).json({ error: "Failed to create Razorpay order.", details: data });
    }

    return res.json({
      order_id: data.id,
      amount: data.amount,
      currency: data.currency,
      receipt: data.receipt,
      key_id: RAZORPAY_KEY_ID,
      plan,
      userId
    });
  } catch (error) {
    console.error("Create order error:", error);
    return res.status(500).json({ error: "Failed to create order." });
  }
}

async function verifyPayment(req, res) {
  try {
    requireRazorpayConfig();

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan, userId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Payment verification requires order_id, payment_id and signature." });
    }

    if (!plan || !userId) {
      return res.status(400).json({ error: "Plan and userId are required for subscription update." });
    }

    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto.createHmac("sha256", RAZORPAY_KEY_SECRET).update(payload).digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: "Invalid Razorpay signature." });
    }

    const renewalDate = new Date();
    const isAnnual = plan.toLowerCase().includes("plus");
    renewalDate.setDate(renewalDate.getDate() + (isAnnual ? 365 : 30));

    let updatedUser = null;

    try {
      updatedUser = await UserModel.updateUserSubscription(userId, plan, renewalDate);
    } catch (err) {
      const db = getDB();
      const devicesCol = db.collection("devices");

      try {
        const deviceObjectId = new ObjectId(userId);
        const result = await devicesCol.findOneAndUpdate(
          { _id: deviceObjectId },
          {
            $set: {
              subscriptions: [
                {
                  plan,
                  renew: renewalDate.toISOString()
                }
              ]
            }
          },
          { returnDocument: "after" }
        );

        if (!result.value) {
          throw new Error("User not found");
        }

        updatedUser = {
          _id: result.value._id,
          username: result.value.username,
          email: result.value.email,
          subscription: {
            plan,
            status: "active",
            renewalDate: renewalDate.toISOString(),
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
        subscription: updatedUser.subscription
      }
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    if (String(error.message).includes("User not found")) {
      return res.status(404).json({ error: "User not found." });
    }
    return res.status(500).json({ error: "Failed to verify payment." });
  }
}

module.exports = {
  createOrder,
  verifyPayment
};
