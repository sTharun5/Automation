const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/* =====================================
   SET / UPDATE PLACEMENT STATUS
   (FACULTY / ADMIN)
===================================== */
exports.setPlacementStatus = async (req, res) => {
  try {
    const { rollNo, status, companyName, placedDate } = req.body;

    if (!rollNo || !status) {
      return res.status(400).json({
        message: "rollNo and status are required"
      });
    }

    const allowed = ["PLACED", "YET_TO_BE_PLACED", "NIP"];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        message: "Invalid placement status"
      });
    }

    const record = await prisma.placement_status.upsert({
      where: { rollNo },          // ✅ UNIQUE
      update: {
        status,
        companyName: status === "PLACED" ? companyName : null,
        placedDate: status === "PLACED" ? placedDate : null,
        updatedAt: new Date()
      },
      create: {
        rollNo,
        status,
        companyName: status === "PLACED" ? companyName : null,
        placedDate: status === "PLACED" ? placedDate : null
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
