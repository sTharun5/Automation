const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.searchStudents = async (req, res) => {
  try {
    const query = req.query.q;

    if (!query) {
      return res.json([]);
    }

    const students = await prisma.student.findMany({
      where: {
        OR: [
          { rollNo: { contains: query } },
          { name: { contains: query } },
          { email: { contains: query } }
        ]
      },
      select: {
        id: true,
        rollNo: true,
        name: true,
        email: true,
        department: true,
        semester: true,
        mentor: {
          select: {
            id: true,
            name: true,
            facultyId: true
          }
        }
      },
      take: 10
    });

    return res.json(students);
  } catch (error) {
    console.error("SEARCH ERROR:", error);
    return res.status(500).json({ message: "Search failed" });
  }
};

// ✅ NEW FUNCTION (for Apply OD dropdown)
exports.listStudents = async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      select: {
        id: true,
        rollNo: true,
        name: true,
        department: true
      },
      orderBy: {
        name: "asc"
      }
    });

    res.json(students);
  } catch (err) {
    console.error("LIST STUDENTS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch students" });
  }
};

// ✅ DASHBOARD DATA
exports.getDashboardData = async (req, res) => {
  try {
    const email = req.user.email;
    const student = await prisma.student.findUnique({
      where: { email },
      include: {
        placement_status: true,
        ods: true
      }
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // 1. Placement Status
    const placement = student.placement_status
      ? {
        status: student.placement_status.status,
        companyName: student.placement_status.companyName,
        lpa: student.placement_status.lpa,
        placedDate: student.placement_status.placedDate
      }
      : { status: "YET_TO_BE_PLACED" };

    // 2. Calculate OD Days (Approved only)
    const approvedODs = student.ods.filter((od) => od.status === "APPROVED");
    const totalOdDays = approvedODs.reduce((sum, od) => sum + od.duration, 0);

    // 3. Current Active OD
    const today = new Date();
    // Normalize today to start of day for comparison if needed, but timestamps usually fine if range includes time.
    // Logic: Today is between startDate and endDate
    const activeOD = approvedODs.find(
      (od) => new Date(od.startDate) <= today && new Date(od.endDate) >= today
    );

    return res.json({
      student: {
        name: student.name,
        rollNo: student.rollNo,
        department: student.department
      },
      placement,
      odStats: {
        totalDaysLimit: 60,
        usedDays: totalOdDays,
        remainingDays: 60 - totalOdDays,
        activeOD: activeOD ? {
          id: activeOD.id,
          type: activeOD.type,
          startDate: activeOD.startDate,
          endDate: activeOD.endDate
        } : null
      }
    });

  } catch (err) {
    console.error("DASHBOARD ERROR:", err);
    res.status(500).json({ message: "Failed to fetch dashboard data" });
  }
};
