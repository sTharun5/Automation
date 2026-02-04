const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const offerService = require("./offer.service");
const notificationService = require("../notification/notification.service");

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
        offers: {
          include: { company: true }
        },
        ods: true,
        mentor: {
          select: {
            id: true,
            name: true,
            facultyId: true,
            email: true,
            department: true
          }
        }
      }
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // 1. Placement Status & All Offers (Sorted by LPA Descending)
    const sortedOffers = [...student.offers].sort((a, b) => Number(b.lpa) - Number(a.lpa));
    const latestOffer = sortedOffers.length > 0 ? sortedOffers[0] : null;

    const placement = {
      status: student.placement_status || (sortedOffers.length > 0 ? "PLACED" : "YET_TO_BE_PLACED"),
      totalOffers: sortedOffers.length,
      offers: sortedOffers.map(o => ({
        id: o.id,
        companyName: o.company.name,
        lpa: o.lpa,
        placedDate: o.placedDate
      })),
      // Keep companyName/lpa for backward compatibility if needed in UI
      companyName: latestOffer?.company.name || null,
      lpa: latestOffer?.lpa || null
    };

    // 2. Calculate OD Days (Approved only)
    const approvedODs = student.ods.filter((od) => ["APPROVED", "MENTOR_APPROVED"].includes(od.status));
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
        department: student.department,
        mentor: student.mentor
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
/* =====================================================
   GET STUDENT OFFERS
===================================================== */
exports.getStudentOffers = async (req, res) => {
  try {
    const studentId = req.params.id;
    const offers = await offerService.getStudentOffers(studentId);
    res.json(offers);
  } catch (error) {
    console.error("GET OFFERS ERROR:", error);
    res.status(500).json({ message: "Failed to fetch offers" });
  }
};

/* =====================================================
   ADD OFFER TO STUDENT
===================================================== */
exports.addOffer = async (req, res) => {
  try {
    // Link check for faculty
    if (req.user.role !== "ADMIN") {
      const faculty = await prisma.faculty.findUnique({ where: { email: req.user.email } });
      if (!faculty) return res.status(403).json({ message: "Access denied" });

      const student = await prisma.student.findUnique({ where: { id: Number(req.body.studentId) } });
      if (!student) return res.status(404).json({ message: "Student not found" });

      if (student.mentorId !== faculty.id) {
        return res.status(403).json({ message: "Unauthorized: You are not the mentor of this student" });
      }
    }

    const offer = await offerService.addOffer(req.body);

    // Also update student placement_status if it's their first offer or as requested
    await prisma.student.update({
      where: { id: Number(req.body.studentId) },
      data: { placement_status: "PLACED" }
    });

    // Notify Student
    const student = await prisma.student.findUnique({ where: { id: Number(req.body.studentId) } });
    if (student) {
      await notificationService.createNotification(
        student.email,
        `Congratulations! Offer from ${offer.company.name} 🎉`,
        `We are thrilled to inform you that you have secured an offer from ${offer.company.name} with a package of ${offer.lpa} LPA! 🚀`,
        "SUCCESS"
      );
    }

    res.status(201).json(offer);
  } catch (error) {
    console.error("ADD OFFER ERROR:", error);
    res.status(500).json({ message: "Failed to add offer" });
  }
};

/* =====================================================
   DELETE OFFER
===================================================== */
exports.deleteOffer = async (req, res) => {
  try {
    const { id } = req.params;

    // Link check for faculty
    if (req.user.role !== "ADMIN") {
      const faculty = await prisma.faculty.findUnique({ where: { email: req.user.email } });
      if (!faculty) return res.status(403).json({ message: "Access denied" });

      const offer = await prisma.offer.findUnique({
        where: { id: Number(id) },
        include: { student: true }
      });
      if (!offer) return res.status(404).json({ message: "Offer not found" });

      if (offer.student.mentorId !== faculty.id) {
        return res.status(403).json({ message: "Unauthorized: You are not the mentor of this student" });
      }
    }

    await prisma.offer.delete({
      where: { id: Number(id) }
    });

    res.json({ message: "Offer deleted successfully" });
  } catch (error) {
    console.error("DELETE OFFER ERROR:", error);
    res.status(500).json({ message: "Failed to delete offer" });
  }
};
