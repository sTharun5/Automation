const express = require("express");
const router = express.Router();
const { verifyToken } = require("../../middlewares/auth.middleware");
const { submitQuery } = require("./support.controller");
const multer = require("multer");
const path = require("path");

/* =====================================================
   FILE UPLOAD CONFIGURATION
 ===================================================== */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = "uploads/support/";
        // Ensure directory exists
        const fs = require('fs');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, '-'));
    },
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error("Only images and videos are allowed!"));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: fileFilter
});

/* =====================================================
   ROUTES
 ===================================================== */
router.post("/submit", verifyToken, upload.single("file"), submitQuery);

module.exports = router;
