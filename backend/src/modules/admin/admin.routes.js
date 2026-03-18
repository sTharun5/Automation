const router = require("express").Router();
const { addFaculty, addStudent, updateStudent, searchFaculty, searchStudents, assignMentor, removeMentor, getAllFaculty, getAllStudents, listCompanies, createCompany, toggleCompanyApproval, deleteCompany, updateStudentStatus, deleteFaculty, getPlacementMapData, updateCompany, getLoginHistory } = require("./admin.controller");
const { verifyToken } = require("../../middlewares/auth.middleware");
const { isAdmin } = require("../../middlewares/isAdmin.middleware");
const { exportODsToExcel } = require("./export.controller");

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

router.put(
  "/update-student/:id",
  verifyToken,
  isAdmin,
  updateStudent
);

router.get(
  "/search-faculty",
  verifyToken,
  searchFaculty
);

router.get(
  "/search-students",
  verifyToken,
  searchStudents
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
router.get("/export-ods", verifyToken, isAdmin, exportODsToExcel);
router.get("/login-history", verifyToken, isAdmin, getLoginHistory);

/* =========================
   ADMIN / FACULTY: COMPANY MGMT
========================= */
router.get("/companies", verifyToken, listCompanies);
router.post("/companies", verifyToken, createCompany);
router.put("/companies/:id", verifyToken, isAdmin, updateCompany);
router.post("/toggle-company-approval", verifyToken, isAdmin, toggleCompanyApproval);
router.delete("/companies/:id", verifyToken, isAdmin, deleteCompany);
router.get("/placement-map-data", verifyToken, isAdmin, getPlacementMapData);

module.exports = router;
