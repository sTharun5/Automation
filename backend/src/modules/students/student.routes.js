const express = require("express");
const router = express.Router();

const { searchStudents, listStudents, getDashboardData, getStudentOffers, addOffer, deleteOffer } = require("./student.controller");
const { verifyToken } = require("../../middlewares/auth.middleware");

/* ================= STUDENT ROUTES ================= */

// 🔍 Search students
router.get("/search", verifyToken, searchStudents);

// 📋 List all students (used for OD apply dropdown)
router.get("/list", verifyToken, listStudents);

// 📊 Dashboard Data
router.get("/dashboard", verifyToken, getDashboardData);

// 📄 Offers
router.get("/:id/offers", verifyToken, getStudentOffers);
router.post("/add-offer", verifyToken, addOffer);
router.delete("/offer/:id", verifyToken, deleteOffer);

module.exports = router;
