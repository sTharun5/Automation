const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
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
    const { rollNo, name, email, department, semester } = req.body;

    if (!rollNo || !name || !email) {
      return res.status(400).json({
        message: "Roll No, Name and Email are required"
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
        semester: semester ? Number(semester) : 1
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
   SEARCH FACULTY (ADMIN ONLY)
===================================================== */
exports.searchFaculty = async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.json([]);

    const faculty = await prisma.faculty.findMany({
      where: {
        OR: [
          { facultyId: { contains: query } },
          { name: { contains: query } },
          { email: { contains: query } }
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
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Company name is required" });

    const company = await companyService.getOrCreateCompany(name);
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
