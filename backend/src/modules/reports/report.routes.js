const express = require("express");
const router = express.Router();
const reportController = require("./report.controller");
const upload = require("../../middlewares/upload.middleware"); // Assuming this exists or using multer directly
const { verifyToken } = require("../../middlewares/auth.middleware");

// Student Routes
router.post("/upload", verifyToken, upload.single("reportFile"), reportController.uploadReport);
router.get("/pending-ods", verifyToken, reportController.getPendingODs); // ✅ New route

// Mentor Routes
router.put("/:id/status", verifyToken, reportController.updateReportStatus);

module.exports = router;
