const router = require("express").Router();
const { addFaculty, searchFaculty, assignMentor, removeMentor, getAllFaculty, getAllStudents } = require("./admin.controller");
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

router.get(
  "/search-faculty",
  verifyToken,
  isAdmin,
  searchFaculty
);

router.put(
  "/assign-mentor",
  verifyToken,
  isAdmin,
  assignMentor
);

router.put(
  "/remove-mentor",
  verifyToken,
  isAdmin,
  removeMentor
);

router.get("/all-faculty", verifyToken, isAdmin, getAllFaculty);
router.get("/all-students", verifyToken, isAdmin, getAllStudents);

module.exports = router;
