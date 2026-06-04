const express = require("express");
const deviceController = require("./controllers/deviceController");
const app = express();

app.use(express.json());

app.use("/api/device", require("./routes/deviceRoutes"));
app.get("/api/devices", deviceController.list);
app.use("/api/user", require("./routes/userRoutes"));

app.listen(3000, () => {
  console.log("Aurix Backend Running");
});
