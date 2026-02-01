const express = require("express");
const router = express.Router();
const { getMentees, getMenteeDetails } = require("./faculty.controller");
const { verifyToken } = require("../../middlewares/auth.middleware");

// 👨‍🏫 Faculty Routes
router.get("/mentees", verifyToken, getMentees);
router.get("/mentee/:studentId", verifyToken, getMenteeDetails);

module.exports = router;
