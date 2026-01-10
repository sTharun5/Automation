const express = require("express");
const router = express.Router();
const { checkPlacement } = require("./placement.controller");
const { verifyToken } = require("../../middlewares/auth.middleware.js");

router.get("/check/:studentId", verifyToken, checkPlacement);

module.exports = router;
