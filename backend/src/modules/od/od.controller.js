const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const generateTrackerId = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/* =====================================================
   APPLY OD
===================================================== */
exports.applyOD = async (req, res) => {
  try {
    const {
      studentId,
      industry,
      campusType,
      startDate,
      endDate,
      duration
    } = req.body;

    /* ===== BASIC VALIDATION ===== */
    if (
      !studentId ||
      !industry ||
      !campusType ||
      !startDate ||
      !endDate ||
      !duration
    ) {
      return res.status(400).json({
        message: "All required fields must be filled"
      });
    }

    if (!req.files?.aimFile || !req.files?.offerFile) {
      return res.status(400).json({
        message: "Both documents are required"
      });
    }

    /* ===== VERIFY STUDENT EXISTS ===== */
    const student = await prisma.student.findUnique({
      where: { id: Number(studentId) }
    });

    if (!student) {
      return res.status(404).json({
        message: "Student not found"
      });
    }

    /* ===== 60 DAY RULE (USING studentId) ===== */
    const used = await prisma.od.aggregate({
      where: {
        studentId: Number(studentId),
        status: "APPROVED"
      },
      _sum: {
        duration: true
      }
    });

    const usedDays = used._sum.duration || 0;

    if (usedDays + Number(duration) > 60) {
      return res.status(400).json({
        message: "OD limit exceeded. Maximum allowed is 60 days."
      });
    }

    /* ===== FILE PATHS ===== */
    const aimFilePath = req.files.aimFile[0].path;
    const offerFilePath = req.files.offerFile[0].path;

    /* ===== SAVE OD ===== */
    const od = await prisma.od.create({
      data: {
        trackerId: generateTrackerId(),
        studentId: Number(studentId), // ✅ ONLY RELATION
        type: "INTERNSHIP",
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        duration: Number(duration),
        proofFile: aimFilePath,
        offerFile: offerFilePath,
        status: "PENDING"
      }
    });

    return res.status(201).json({
      message: "OD applied successfully",
      od
    });

  } catch (error) {
    console.error("OD APPLY ERROR:", error);
    return res.status(500).json({
      message: "Failed to apply OD"
    });
  }
};

/* =====================================================
   GET OD BY ID
===================================================== */
exports.getOdById = async (req, res) => {
  try {
    const { id } = req.params;

    const od = await prisma.od.findUnique({
      where: { id: Number(id) },
      include: {
        student: true // ✅ gives rollNo, name, email safely
      }
    });

    if (!od) {
      return res.status(404).json({
        message: "OD not found"
      });
    }

    return res.status(200).json(od);

  } catch (error) {
    console.error("GET OD ERROR:", error);
    return res.status(500).json({
      message: "Failed to fetch OD"
    });
  }
};
