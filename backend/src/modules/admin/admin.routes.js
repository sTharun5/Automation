const router = require("express").Router();
const { addFaculty, addStudent, searchFaculty, assignMentor, removeMentor, getAllFaculty, getAllStudents, listCompanies, createCompany, toggleCompanyApproval, deleteCompany, updateStudentStatus, deleteFaculty } = require("./admin.controller");
const { verifyToken } = require("../../middlewares/auth.middleware");
const { isAdmin } = require("../../middlewares/isAdmin.middleware");

/* =========================
   ADMIN: ADD USER (FACULTY/STUDENT)
========================================= */
router.post(
  "/add-faculty",
  verifyToken,
  isAdmin,
  addFaculty
);

router.post(
  "/add-student",
  verifyToken,
  isAdmin,
  addStudent
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

router.delete(
  "/faculty/:id",
  verifyToken,
  isAdmin,
  deleteFaculty
);

router.get("/all-faculty", verifyToken, isAdmin, getAllFaculty);
router.get("/all-students", verifyToken, isAdmin, getAllStudents);
router.put("/update-student-status", verifyToken, updateStudentStatus);

/* =========================
   ADMIN / FACULTY: COMPANY MGMT
========================= */
router.get("/companies", verifyToken, listCompanies);
router.post("/companies", verifyToken, createCompany);
router.post("/toggle-company-approval", verifyToken, isAdmin, toggleCompanyApproval);
router.delete("/companies/:id", verifyToken, isAdmin, deleteCompany);

module.exports = router;
