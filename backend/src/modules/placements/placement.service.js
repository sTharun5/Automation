const prisma = require("../../config/db");

/**
 * Check whether a student is placed
 */
exports.isStudentPlaced = async (studentId) => {
  const status = await prisma.placement_status.findUnique({
    where: { studentId }
  });

  return status?.status === "PLACED";
};
