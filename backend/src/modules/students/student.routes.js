const express = require("express");
const router = express.Router();
const { searchStudents } = require("./student.controller");

router.get("/search", searchStudents);

module.exports = router;
