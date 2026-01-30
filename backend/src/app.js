const express = require("express");
const cors = require("cors");
const authRoutes = require("./modules/auth/auth.routes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));


app.use("/api/auth", authRoutes);

const studentRoutes = require("./modules/students/student.routes");
app.use("/api/students", studentRoutes);

const placementRoutes = require("./modules/placements/placement.routes");
app.use("/api/placements", placementRoutes);

const odRoutes = require("./modules/od/od.routes");
app.use("/api/od", odRoutes);

const adminRoutes = require("./modules/admin/admin.routes");
app.use("/api/admin", adminRoutes);

const placementStatusRoutes = require("./modules/placementStatus/placementStatus.routes");
app.use("/api/placement-status", placementStatusRoutes);

module.exports = app;
