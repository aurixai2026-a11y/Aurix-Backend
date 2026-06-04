const express = require("express");
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

app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/device", require("./routes/deviceRoutes"));
app.get("/api/devices", requireAdmin, deviceController.list);
app.use("/api/user", require("./routes/userRoutes"));

app.listen(PORT, () => {
  console.log(`Aurix Backend Running on port ${PORT}`);
});
