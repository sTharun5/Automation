const express = require("express");
const router = express.Router();
const calendarController = require("./calendar.controller");
const { verifyToken } = require("../../middlewares/auth.middleware");

// Public (or authenticated) access to view
router.get("/", verifyToken, calendarController.getEvents);

// Admin only to modify
router.post("/", verifyToken, calendarController.createEvent);
router.delete("/:id", verifyToken, calendarController.deleteEvent);

module.exports = router;
