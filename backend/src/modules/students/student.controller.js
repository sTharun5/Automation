const prisma = require("../../config/db");
const offerService = require("./offer.service");
const notificationService = require("../notification/notification.service");
const sendEmail = require("../../utils/sendEmail");

exports.searchStudents = async (req, res) => {
  try {
    const query = req.query.q;

    if (!query) {
      return res.json([]);
    }

    const students = await prisma.student.findMany({
      where: {
        OR: [
          { rollNo: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        rollNo: true,
        name: true,
        email: true,
        department: true,
        semester: true,
        placement_status: true,
        offers: {
          include: { company: true }
        },
        _count: { select: { ods: true } }, // ✅ count only, no full OD rows loaded
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

    // Calculate stats using aggregated counts from DB
    const studentsWithStats = await Promise.all(
      students.map(async (student) => {
        // Aggregate approved OD duration in one DB call instead of loading all ODs
        const agg = await prisma.od.aggregate({
          where: {
            studentId: student.id,
            status: { in: ["APPROVED", "MENTOR_APPROVED"] }
          },
          _sum: { duration: true }
        });
        const usedDays = agg._sum.duration ?? 0;
        const { _count, ...rest } = student;
        return {
          ...rest,
          odStats: { usedDays, remainingDays: 60 - usedDays }
        };
      })
    );

    return res.json(studentsWithStats);
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
    return await fetchStudentDashboardData(email, res);
  } catch (err) {
    console.error("DASHBOARD ERROR:", err);
    res.status(500).json({ message: "Failed to fetch dashboard data" });
  }
};

// ✅ ADMIN VIEW: FULL STUDENT DETAILS
exports.getStudentFullDetails = async (req, res) => {
  try {
    const { id } = req.params;
    // Check permissions
    if (req.user.role === "STUDENT") {
      return res.status(403).json({ message: "Access denied" });
    }

    const student = await prisma.student.findUnique({ where: { id: Number(id) } });
    if (!student) return res.status(404).json({ message: "Student not found" });

    return await fetchStudentDashboardData(student.email, res);

  } catch (err) {
    console.error("ADMIN STUDENT DETAILS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch student details" });
  }
};


// Helper function to reuse logic
async function fetchStudentDashboardData(email, res) {
  const student = await prisma.student.findUnique({
    where: { email },
    include: {
      offers: {
        include: { company: true }
      },
      ods: {
        include: { report: true, event: true }
      },
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
    companyName: latestOffer?.company.name || null,
    lpa: latestOffer?.lpa || null
  };

  // 2. Calculate OD Days (Approved only)
  const approvedODs = student.ods.filter((od) => ["APPROVED", "MENTOR_APPROVED"].includes(od.status));
  const totalOdDays = approvedODs.reduce((sum, od) => sum + od.duration, 0);

  // Initialize variables
  const rightNow = new Date();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  let activeOD = null;

  // 2.5 Identify Pending Reports
  const pendingReports = student.ods.filter((od) =>
    od.status === "APPROVED" &&
    new Date(od.endDate) < rightNow &&
    (!od.report || od.report.status !== "APPROVED")
  ).map((od) => ({
    id: od.id,
    trackerId: od.trackerId,
    endDate: od.endDate,
    offer: od.offer
  }));

  // 3. Current Active OD Logic
  // A. Ongoing Approved
  activeOD = student.ods.find(od =>
    od.status === "APPROVED" &&
    new Date(od.startDate) <= todayStart &&
    new Date(od.endDate) >= todayStart
  );

  // B. Pending/Processing
  if (!activeOD) {
    activeOD = student.ods.find(od =>
      ["PENDING", "DOCS_VERIFIED", "MENTOR_APPROVED"].includes(od.status)
    );
  }

  // C. Upcoming Approved
  if (!activeOD) {
    activeOD = student.ods.find(od =>
      od.status === "APPROVED" &&
      new Date(od.startDate) > todayStart
    );
  }

  return res.json({
    student: {
      id: student.id, // ✅ Added ID
      name: student.name,
      email: student.email, // ✅ Added Email
      rollNo: student.rollNo,
      department: student.department,
      semester: student.semester, // ✅ Added Semester
      mentor: student.mentor
    },
    placement,
    odStats: {
      totalDaysLimit: 60,
      usedDays: totalOdDays,
      remainingDays: 60 - totalOdDays,
      pendingReports: pendingReports,
      activeOD: activeOD ? {
        id: activeOD.id,
        type: activeOD.type,
        status: activeOD.status,
        startDate: activeOD.startDate,
        endDate: activeOD.endDate,
        duration: activeOD.duration,
        allocatedHours: activeOD.event?.allocatedHours || 0
      } : null
    },
    history: student.ods
  });
}
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
    let cachedStudent = null;

    // Link check for faculty — cache student here so we can reuse it below
    if (req.user.role !== "ADMIN") {
      const faculty = await prisma.faculty.findUnique({ where: { email: req.user.email } });
      if (!faculty) return res.status(403).json({ message: "Access denied" });

      cachedStudent = await prisma.student.findUnique({ where: { id: Number(req.body.studentId) } });
      if (!cachedStudent) return res.status(404).json({ message: "Student not found" });

      if (cachedStudent.mentorId !== faculty.id) {
        return res.status(403).json({ message: "Unauthorized: You are not the mentor of this student" });
      }
    }

    const offer = await offerService.addOffer(req.body);

    // Update student placement_status to PLACED
    await prisma.student.update({
      where: { id: Number(req.body.studentId) },
      data: { placement_status: "PLACED" }
    });

    // Reuse cached student (Faculty path) or fetch once (Admin path) — no duplicate DB call
    const notifyStudent = cachedStudent ?? await prisma.student.findUnique({ where: { id: Number(req.body.studentId) } });

    if (notifyStudent) {
      await notificationService.createNotification(
        notifyStudent.email,
        `Congratulations! Offer from ${offer.company.name} 🎉`,
        `We are thrilled to inform you that you have secured an offer from ${offer.company.name} with a package of ${offer.lpa} LPA! 🚀`,
        "SUCCESS"
      );
      sendEmail(
        notifyStudent.email,
        `🎉 Congratulations! Offer from ${offer.company.name}`,
        `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:linear-gradient(135deg,#f0fdf4,#ecfdf5);border-radius:12px;border-left:4px solid #22c55e">
          <h2 style="color:#16a34a">🎉 Offer Received!</h2>
          <p>Hello <strong>${notifyStudent.name}</strong>,</p>
          <p>Congratulations! You have secured a placement offer. Here are your offer details:</p>
          <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0">
            <p style="margin:0 0 8px"><strong>Company:</strong> ${offer.company.name}</p>
            <p style="margin:0 0 8px"><strong>Package:</strong> ${offer.lpa} LPA</p>
            ${offer.role ? `<p style="margin:0 0 8px"><strong>Role:</strong> ${offer.role}</p>` : ''}
            ${offer.offerDate ? `<p style="margin:0"><strong>Offer Date:</strong> ${new Date(offer.offerDate).toLocaleDateString('en-IN')}</p>` : ''}
          </div>
          <p>Wishing you a successful career ahead! 🚀</p>
          <p style="color:#94a3b8;font-size:12px">— SMART OD System</p>
        </div>`
      ).catch(e => console.error("Email Error (offer added):", e));
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
