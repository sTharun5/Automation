const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/* =====================================
   SET / UPDATE PLACEMENT STATUS
   (FACULTY / ADMIN)
===================================== */
exports.setPlacementStatus = async (req, res) => {
  try {
    const { rollNo, status, companyName, lpa, placedDate } = req.body;

    if (!rollNo || !status) {
      return res.status(400).json({
        message: "rollNo and status are required"
      });
    }

    // Check Permissions
    const email = req.user.email;
    const faculty = await prisma.faculty.findUnique({ where: { email } });
    const admin = await prisma.admin.findUnique({ where: { email } });

    if (!faculty && !admin) {
      return res.status(403).json({ message: "Access denied. Faculty or Admin only." });
    }

    const allowed = ["PLACED", "YET_TO_BE_PLACED", "NIP"];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        message: "Invalid placement status"
      });
    }

    const record = await prisma.placement_status.upsert({
      where: { rollNo },
      update: {
        status,
        companyName: status === "PLACED" ? companyName : null,
        lpa: status === "PLACED" ? lpa : null,
        placedDate:
          status === "PLACED" && placedDate
            ? new Date(placedDate)
            : null,
        updatedAt: new Date()
      },
      create: {
        rollNo,
        status,
        companyName: status === "PLACED" ? companyName : null,
        lpa: status === "PLACED" ? lpa : null,
        placedDate:
          status === "PLACED" && placedDate
            ? new Date(placedDate)
            : null
      }
    });


    return res.json({
      message: "Placement status updated",
      placementStatus: record
    });

  } catch (error) {
    console.error("PLACEMENT STATUS ERROR:", error);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

/* =====================================
   GET PLACEMENT STATUS
   (STUDENT / SYSTEM)
===================================== */
exports.getPlacementStatus = async (req, res) => {
  try {
    const { rollNo } = req.params;

    const record = await prisma.placement_status.findUnique({
      where: { rollNo }
    });

    if (!record) {
      return res.json({
        status: "YET_TO_BE_PLACED"
      });
    }

    return res.json(record);

  } catch (error) {
    console.error("GET PLACEMENT STATUS ERROR:", error);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
};
