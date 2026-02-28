const express = require("express");
const router = express.Router();
const facultyController = require("./faculty.controller");
const { verifyToken } = require("../../middlewares/auth.middleware");

// 👨‍🏫 Faculty Routes
router.get("/mentees", verifyToken, facultyController.getMentees);
router.get("/mentee/:studentId", verifyToken, facultyController.getMenteeDetails);
router.get("/reports/pending", verifyToken, facultyController.getPendingReports); // ✅ New Route

module.exports = router;
