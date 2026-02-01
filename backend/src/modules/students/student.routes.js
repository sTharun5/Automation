const express = require("express");
const router = express.Router();

const { searchStudents, listStudents, getDashboardData } = require("./student.controller");
const { verifyToken } = require("../../middlewares/auth.middleware");

/* ================= STUDENT ROUTES ================= */

// 🔍 Search students
router.get("/search", verifyToken, searchStudents);

// 📋 List all students (used for OD apply dropdown)
router.get("/list", verifyToken, listStudents);

// 📊 Dashboard Data
router.get("/dashboard", verifyToken, getDashboardData);

module.exports = router;
