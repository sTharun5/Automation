const { createOD } = require("./od.service");

exports.createODRequest = async (req, res) => {
  try {
    const od = await createOD(req.body);

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
