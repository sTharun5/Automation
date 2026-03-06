const express = require("express");
const router = express.Router();

const odController = require("./od.controller");
const { verifyToken } = require("../../middlewares/auth.middleware");

const multer = require("multer");

/* ================= MULTER STORAGE ================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "aimFile") {
      cb(null, "uploads/aim-objective");
    } else if (file.fieldname === "offerFile") {
      cb(null, "uploads/offer-letter");
    }
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files allowed"), false);
    }
  }
});

/* ================= ROUTES ================= */

router.post(
  "/apply",
  verifyToken,
  upload.fields([
    { name: "aimFile", maxCount: 1 },
    { name: "offerFile", maxCount: 1 }
  ]),
  odController.applyOD
);

// Subject Teacher verifies a student's Digital Gate Pass to authorize them leaving class
router.post('/verify-gate-pass', verifyToken, odController.verifyGatePass);

router.post('/scan-internal', verifyToken, odController.scanInternalOD);

router.get("/my-ods", verifyToken, odController.getMyODs); // ✅ New Route
router.get("/:id", verifyToken, odController.getOdById);

router.put("/update-status/:id", verifyToken, odController.updateOdStatus);
router.post("/:id/sync-erp", verifyToken, odController.manualErpSync);

// 👮‍♂️ Admin / Faculty routes
router.get("/mentor/pending", verifyToken, odController.getMentorODs);
router.get("/admin/student/:studentId", verifyToken, odController.getStudentODs);
router.get("/admin/all", verifyToken, odController.getAllODs); // ✅ New Admin Search Route
router.get("/admin/company-stats", verifyToken, odController.getCompanyStats); // ✅ Company Stats Route
router.get("/admin/company-placed", verifyToken, odController.getCompanyPlacedStudents); // ✅ Company Placed Students Route


module.exports = router;
