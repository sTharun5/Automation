const express = require("express");
const router = express.Router();
const notificationController = require("./notification.controller");
const { verifyToken } = require("../../middlewares/auth.middleware");

router.get("/", verifyToken, notificationController.getNotifications);
router.put("/:id/read", verifyToken, notificationController.markAsRead);

module.exports = router;
