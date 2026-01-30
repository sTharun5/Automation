const express = require("express");
const router = express.Router();

const { applyOD, getOdById } = require("./od.controller");
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
  applyOD
);

router.get("/:id", verifyToken, getOdById);


module.exports = router;
