const router = require("express").Router();
const { chat } = require("./ai.controller");
const { verifyToken } = require("../../middlewares/auth.middleware");

/* =====================================================
   AI CHAT ROUTE
===================================================== */
router.post("/chat", verifyToken, chat);

module.exports = router;
