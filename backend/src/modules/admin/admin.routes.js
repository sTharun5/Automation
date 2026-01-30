const router = require("express").Router();
const { addFaculty } = require("./admin.controller");
const { verifyToken } = require("../../middlewares/auth.middleware");
const { isAdmin } = require("../../middlewares/isAdmin.middleware");

/* =========================
   ADMIN: ADD FACULTY
========================= */
router.post(
  "/add-faculty",
  verifyToken,
  isAdmin,
  addFaculty
);

module.exports = router;
