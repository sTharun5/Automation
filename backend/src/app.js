const express = require("express");
const cors = require("cors");
const authRoutes = require("./modules/auth/auth.routes");

const app = express();

app.use(cors());
app.use(express.json());


app.use("/api/auth", authRoutes);

const studentRoutes = require("./modules/students/student.routes");
app.use("/api/students", studentRoutes);


module.exports = app;
