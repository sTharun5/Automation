const router = require("express").Router();
const otp = require("./otp.controller");
const { getMe } = require("./auth.controller");
const { verifyToken } = require("../../middlewares/auth.middleware");

router.post("/send-otp", otp.sendOTP);
router.post("/verify-otp", otp.verifyOTP);
router.get("/me", verifyToken, getMe);

module.exports = router;
