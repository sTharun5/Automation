const router = require("express").Router();
const otp = require("./otp.controller");
const { getMe, logout } = require("./auth.controller");
const { verifyToken } = require("../../middlewares/auth.middleware");

const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100, // Relaxed for live debugging
    message: { message: "Too many login attempts, please try again later." }
});

router.post("/send-otp", authLimiter, otp.sendOTP);
router.post("/verify-otp", authLimiter, otp.verifyOTP);
router.get("/me", verifyToken, getMe);
router.post("/logout", verifyToken, logout);

module.exports = router;
