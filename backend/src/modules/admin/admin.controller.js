const prisma = require("../../config/db");
const companyService = require("./company.service");
const notificationService = require("../notification/notification.service");

/* =====================================================
   ADD FACULTY (ADMIN ONLY)
===================================================== */
exports.addFaculty = async (req, res) => {
  try {
    const { facultyId, name, email, department } = req.body;

    if (!facultyId || !name || !email) {
      return res.status(400).json({
        message: "Faculty ID, Name and Email are required"
      });
    }

    // Check duplicate facultyId or email
    const existing = await prisma.faculty.findFirst({
      where: {
        OR: [
          { facultyId },
          { email }
        ]
      }
    });

    if (existing) {
      return res.status(409).json({
        message: "Faculty already exists"
      });
    }

    const faculty = await prisma.faculty.create({
      data: {
        facultyId,
        name,
        email,
        department
      }
    });

    res.status(201).json({
      message: "Faculty added successfully",
      faculty
    });

  } catch (error) {
    console.error("ADD FACULTY ERROR:", error);
    res.status(500).json({
      message: "Failed to add faculty"
    });
  }
};

/* =====================================================
   ADD STUDENT (ADMIN ONLY)
===================================================== */
exports.addStudent = async (req, res) => {
  try {
    const { rollNo, name, email, department, semester, parentPhone } = req.body;

    if (!rollNo || !name || !email || !parentPhone) {
      return res.status(400).json({
        message: "Roll No, Name, Email, and Parent Phone are strictly required"
      });
    }

    // Check duplicate rollNo or email
    const existing = await prisma.student.findFirst({
      where: {
        OR: [
          { rollNo },
          { email }
        ]
      }
    });

    if (existing) {
      return res.status(409).json({
        message: "Student already exists (Roll No or Email match)"
      });
    }

    const student = await prisma.student.create({
      data: {
        rollNo,
        name,
        email,
        department: department || "CS", // Default fallback
        semester: semester ? Number(semester) : 1,
        parentPhone
      }
    });

    res.status(201).json({
      message: "Student added successfully",
      student
    });

  } catch (error) {
    console.error("ADD STUDENT ERROR:", error);
    res.status(500).json({
      message: "Failed to add student"
    });
  }
};

/* =====================================================
   UPDATE STUDENT (ADMIN ONLY)
===================================================== */
exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, rollNo, email, department, semester, parentPhone } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Student ID missing" });
    }

    if (!parentPhone) {
      return res.status(400).json({ message: "Parent Phone is strictly required" });
    }

    // Check duplicate rollNo or email if they are changed
    const existing = await prisma.student.findFirst({
      where: {
        id: { not: Number(id) },
        OR: [
          { rollNo },
          { email }
        ]
      }
    });

    if (existing) {
      return res.status(409).json({ message: "Roll No or Email is already taken by another student" });
    }

    const updatedStudent = await prisma.student.update({
      where: { id: Number(id) },
      data: {
        name,
        rollNo,
        email,
        department,
        semester: Number(semester),
        parentPhone
      }
    });

    res.json({
      message: "Student updated successfully",
      student: updatedStudent
    });

  } catch (error) {
    console.error("UPDATE STUDENT ERROR:", error);
    res.status(500).json({ message: "Failed to update student details" });
  }
};

/* =====================================================
   SEARCH FACULTY (ADMIN ONLY)
===================================================== */
exports.searchFaculty = async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.json([]);

    const faculty = await prisma.faculty.findMany({
      where: {
        OR: [
          { facultyId: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: 10
    });

    res.json(faculty);
  } catch (error) {
    console.error("SEARCH FACULTY ERROR:", error);
    res.status(500).json({ message: "Search failed" });
  }
};

/* =====================================================
   SEARCH STUDENTS (ADMIN ONLY)
   Used for searchable assignment selectors
===================================================== */
exports.searchStudents = async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.json([]);

    const students = await prisma.student.findMany({
      where: {
        OR: [
          { rollNo: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: 10
    });

    res.json(students);
  } catch (error) {
    console.error("SEARCH STUDENTS ERROR:", error);
    res.status(500).json({ message: "Search failed" });
  }
};

/* =====================================================
   ASSIGN MENTOR TO STUDENTS (ADMIN ONLY)
===================================================== */
exports.assignMentor = async (req, res) => {
  try {
    const { mentorId, studentIds } = req.body;

    if (!mentorId || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: "Mentor and student list are required" });
    }

    // Update all students to have this mentorId
    await prisma.student.updateMany({
      where: {
        id: { in: studentIds.map(id => Number(id)) }
      },
      data: {
        mentorId: Number(mentorId)
      }
    });

    // Navigate to find details for notifications
    const mentor = await prisma.faculty.findUnique({ where: { id: Number(mentorId) } });
    const students = await prisma.student.findMany({ where: { id: { in: studentIds.map(id => Number(id)) } } });

    // Notify Mentor
    if (mentor) {
      await notificationService.createNotification(
        mentor.email,
        "New Mentees Assigned",
        `You have been assigned ${students.length} new students.`,
        "INFO"
      );
    }

    // Notify Students
    for (const student of students) {
      await notificationService.createNotification(
        student.email,
        "Mentor Assigned",
        `You have been assigned a new mentor: ${mentor?.name}.`,
        "INFO"
      );
    }

    res.json({ message: "Mentor assigned successfully to students" });
  } catch (error) {
    console.error("ASSIGN MENTOR ERROR:", error);
    res.status(500).json({ message: "Failed to assign mentor" });
  }
};
/* =====================================================
   REMOVE MENTOR FROM STUDENT (ADMIN ONLY)
===================================================== */
exports.removeMentor = async (req, res) => {
  try {
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({ message: "Student ID is required" });
    }

    await prisma.student.update({
      where: { id: Number(studentId) },
      data: { mentorId: null }
    });

    res.json({ message: "Mentor removed successfully" });
  } catch (error) {
    console.error("REMOVE MENTOR ERROR:", error);
    res.status(500).json({ message: "Failed to remove mentor" });
  }
};

/* =====================================================
   GET ALL FACULTY (ADMIN ONLY)
===================================================== */
exports.getAllFaculty = async (req, res) => {
  try {
    const faculty = await prisma.faculty.findMany({
      include: {
        students: {
          select: { id: true }
        }
      },
      orderBy: { name: "asc" }
    });

    const result = faculty.map(f => ({
      ...f,
      menteeCount: f.students.length
    }));

    res.json(result);
  } catch (error) {
    console.error("GET ALL FACULTY ERROR:", error);
    res.status(500).json({ message: "Failed to fetch faculty" });
  }
};

/* =====================================================
   GET ALL STUDENTS (ADMIN ONLY)
===================================================== */
exports.getAllStudents = async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      include: {
        mentor: {
          select: { id: true, name: true, facultyId: true }
        },
        offers: {
          include: { company: true }
        }
      },
      orderBy: { rollNo: "asc" }
    });



    // Check for unassigned students and notify admin
    await notificationService.checkAndNotifyUnassignedStudents();

    res.json(students);
  } catch (error) {
    console.error("GET ALL STUDENTS ERROR:", error);
    res.status(500).json({ message: "Failed to fetch students" });
  }
};
/* =====================================================
   LIST ALL COMPANIES (ADMIN ONLY)
===================================================== */
exports.listCompanies = async (req, res) => {
  try {
    const { approvedOnly } = req.query;
    const filter = approvedOnly === "true" ? { isApproved: true } : {};

    const companies = await companyService.listCompanies(filter);
    res.json(companies);
  } catch (error) {
    console.error("LIST COMPANIES ERROR:", error);
    res.status(500).json({
      message: "Failed to fetch companies",
      error: error.message
    });
  }
};

/* =====================================================
   CREATE COMPANY (ADMIN ONLY)
===================================================== */
exports.createCompany = async (req, res) => {
  try {
    const { name, location } = req.body;
    if (!name) return res.status(400).json({ message: "Company name is required" });

    const company = await companyService.getOrCreateCompany(name, location);
    res.status(201).json(company);
  } catch (error) {
    console.error("CREATE COMPANY ERROR:", error);
    res.status(500).json({ message: "Failed to create company" });
  }
};

/* =====================================================
   TOGGLE COMPANY APPROVAL (ADMIN ONLY)
===================================================== */
exports.toggleCompanyApproval = async (req, res) => {
  try {
    const { id, isApproved } = req.body;
    if (!id) return res.status(400).json({ message: "Company ID is required" });

    const company = await companyService.toggleCompanyApproval(id, isApproved);
    res.json({ message: "Company approval toggled", company });
  } catch (error) {
    console.error("TOGGLE COMPANY ERROR:", error);
    res.status(500).json({ message: "Failed to toggle company approval" });
  }
};

/* =====================================================
   UPDATE COMPANY (ADMIN ONLY)
===================================================== */
exports.updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location } = req.body;

    if (!id) return res.status(400).json({ message: "Company ID is required" });
    if (!name) return res.status(400).json({ message: "Company name is required" });

    const company = await companyService.updateCompany(id, { name, location });
    res.json({ message: "Company updated successfully", company });
  } catch (error) {
    if (error.code === 'P2002') { // Prisma unique constraint error
      return res.status(400).json({ message: "A company with this name already exists" });
    }
    console.error("UPDATE COMPANY ERROR:", error);
    res.status(500).json({ message: "Failed to update company" });
  }
};

/* =====================================================
   DELETE COMPANY (ADMIN ONLY)
===================================================== */
exports.deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Company ID is required" });

    // Delete company (Offers will be deleted via cascade if defined)
    await prisma.company.delete({
      where: { id: Number(id) }
    });

    res.json({ message: "Company deleted successfully" });
  } catch (error) {
    console.error("DELETE COMPANY ERROR:", error);
    res.status(500).json({ message: "Failed to delete company" });
  }
};

/* =====================================================
   UPDATE STUDENT PLACEMENT STATUS
===================================================== */
exports.updateStudentStatus = async (req, res) => {
  try {
    const { studentId, placement_status } = req.body;
    if (!studentId) return res.status(400).json({ message: "Student ID is required" });

    // Link check for faculty
    if (req.user.role !== "ADMIN") {
      const faculty = await prisma.faculty.findUnique({ where: { email: req.user.email } });
      if (!faculty) return res.status(403).json({ message: "Access denied" });

      const student = await prisma.student.findUnique({ where: { id: Number(studentId) } });
      if (!student) return res.status(404).json({ message: "Student not found" });

      if (student.mentorId !== faculty.id) {
        return res.status(403).json({ message: "Unauthorized: You are not the mentor of this student" });
      }
    }

    await prisma.student.update({
      where: { id: Number(studentId) },
      data: { placement_status }
    });

    res.json({ message: "Student status updated" });
  } catch (error) {
    console.error("UPDATE STUDENT STATUS ERROR:", error);
    res.status(500).json({ message: "Failed to update student status" });
  }
};
/* =====================================================
   DELETE FACULTY (ADMIN ONLY) - Safe Unlink Strategy
===================================================== */
exports.deleteFaculty = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Faculty ID is required" });

    // 1. Unassign all students linked to this mentor
    await prisma.student.updateMany({
      where: { mentorId: Number(id) },
      data: { mentorId: null }
    });

    // 2. Delete the faculty
    await prisma.faculty.delete({
      where: { id: Number(id) }
    });

    res.json({ message: "Faculty deleted successfully. Students have been unassigned." });
  } catch (error) {
    console.error("DELETE FACULTY ERROR:", error);
    res.status(500).json({ message: "Failed to delete faculty" });
  }
};

/* =====================================================
   GET PLACEMENT MAP DATA (ADMIN ONLY)
===================================================== */
exports.getPlacementMapData = async (req, res) => {
  try {
    // Get all companies with their placement offers
    const companies = await prisma.company.findMany({
      include: {
        offers: true
      }
    });

    const locationCounts = {};

    companies.forEach(company => {
      const loc = company.location;
      if (loc) {
        // Normalize location strictly for consistent grouping
        const normalizedLoc = loc.trim().toLowerCase();
        const displayLoc = loc.trim();

        if (!locationCounts[normalizedLoc]) {
          locationCounts[normalizedLoc] = {
            location: displayLoc,
            students: 0,
            companies: new Set()
          };
        }
        locationCounts[normalizedLoc].students += company.offers ? company.offers.length : 0;
        locationCounts[normalizedLoc].companies.add(company.name);
      }
    });

    // Convert to array of distinct locations with coordinates mapped (handled on frontend or geo-service)
    const mapData = Object.values(locationCounts).map(data => ({
      location: data.location,
      students: data.students,
      companies: Array.from(data.companies)
    }));

    res.json(mapData);
  } catch (error) {
    console.error("GET MAP DATA ERROR:", error);
    res.status(500).json({ message: "Failed to aggregate map data" });
  }
};

exports.getLoginHistory = async (req, res) => {
  try {
    const history = await prisma.loginhistory.findMany({
      orderBy: { createdAt: "desc" },
      take: 500
    });
    res.json(history);
  } catch (error) {
    console.error("GET LOGIN HISTORY CRITICAL ERROR:", error);
    res.status(500).json({ 
      message: "Failed to fetch login history", 
      error: error.message,
      code: error.code
    });
  }
};
