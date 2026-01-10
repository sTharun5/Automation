const express = require("express");
const router = express.Router();
const { searchStudents } = require("./student.controller");
const { verifyToken } = require("../../middlewares/auth.middleware.js");

router.get("/search", verifyToken, searchStudents);

module.exports = router;
