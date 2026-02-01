const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

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
        placement_status: {
          select: { status: true }
        }
      },
      orderBy: { rollNo: "asc" }
    });

    res.json(students);
  } catch (error) {
    console.error("GET ALL STUDENTS ERROR:", error);
    res.status(500).json({ message: "Failed to fetch students" });
  }
};
