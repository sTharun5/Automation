// src/modules/placementStatus/placementStatus.routes.js
const router = require("express").Router();
const {
  setPlacementStatus,
  getPlacementStatus
} = require("./placementStatus.controller");

const { verifyToken } = require("../../middlewares/auth.middleware");

/* ===============================
   FACULTY / ADMIN
================================ */
router.post(
  "/set",
  verifyToken,
  setPlacementStatus
);

/* ===============================
   STUDENT / SYSTEM
================================ */
router.get(
  "/:rollNo",
  verifyToken,
  getPlacementStatus
);

module.exports = router;
