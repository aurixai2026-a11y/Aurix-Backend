const express = require("express");
const { connectDB, closeDB } = require("./config/mongodb");
const { ensureDefaultAdmin } = require("./services/adminAuthService");
const deviceController = require("./controllers/deviceController");
const { requireAdmin } = require("./middleware/adminAuth");

const app = express();

const PORT = process.env.PORT || 3000;
const allowedOrigins = new Set([
  "https://aurix-dashboard.netlify.app",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5500"
]);

function corsMiddleware(req, res, next) {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  return next();
}

app.use(corsMiddleware);
app.use(express.json());

// Routes
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/device", require("./routes/deviceRoutes"));
app.use("/api/log", require("./routes/logRoutes"));
app.use("/api/updates", require("./routes/updateRoutes"));
app.get("/api/devices", requireAdmin, deviceController.list);
app.use("/api/user", require("./routes/userRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

// Start server with MongoDB connection
async function startServer() {
  try {
    console.log("🔄 Connecting to MongoDB...");
    // Connect to MongoDB
    await connectDB();
    
    console.log("🔄 Ensuring default admin...");
    // Ensure default admin exists
    await ensureDefaultAdmin();

    app.listen(PORT, () => {
      console.log(`✓ Aurix Backend Running on port ${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || "development"}`);
    });

    // Handle graceful shutdown
    process.on("SIGINT", async () => {
      console.log("\n✓ Shutting down gracefully...");
      await closeDB();
      process.exit(0);
    });
  } catch (error) {
    console.error("✗ Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
