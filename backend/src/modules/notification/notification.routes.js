const express = require("express");
const router = express.Router();
const { getNotifications, markAsRead, markAllAsRead, deleteAll } = require("./notification.controller");
const { verifyToken } = require("../../middlewares/auth.middleware");

router.get("/", verifyToken, getNotifications);
router.put("/:id/read", verifyToken, markAsRead);
router.put("/read-all", verifyToken, markAllAsRead);
router.delete("/", verifyToken, deleteAll); // ✅ New route

module.exports = router;
