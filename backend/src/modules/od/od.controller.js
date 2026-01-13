const { createOD } = require("./od.service");

exports.createODRequest = async (req, res) => {
  try {
    const studentId = req.user.id;   // JWT student

    const {
      startDate,
      endDate,
      proofFile
    } = req.body;

    const od = await createOD({
      studentId,
      type: "INTERNSHIP",    // 👈 REQUIRED by Prisma
      startDate,
      endDate,
      proofFile,
      eventId: null
    });

    return res.json({
      message: "OD created successfully",
      trackerId: od.trackerId,
      status: od.status
    });

  } catch (error) {
    return res.status(400).json({
      message: error.message
    });
  }
};
