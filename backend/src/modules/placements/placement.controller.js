const { isStudentPlaced } = require("./placement.service");

exports.checkPlacement = async (req, res) => {
  try {
    const studentId = Number(req.params.studentId);

    if (!studentId) {
      return res.status(400).json({
        message: "Student ID is required"
      });
    }

    const placed = await isStudentPlaced(studentId);

    if (!placed) {
      return res.status(403).json({
        placed: false,
        message: "OD allowed only for placed students"
      });
    }

    return res.json({
      placed: true,
      message: "Student is placed. OD allowed"
    });

  } catch (err) {
    console.error("CHECK PLACEMENT ERROR:", err);
    res.status(500).json({
      message: "Failed to check placement status"
    });
  }
};
