const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Check whether a student is placed
 */
exports.isStudentPlaced = async (studentId) => {
  const status = await prisma.placement_status.findUnique({
    where: { studentId }
  });

  return status?.status === "PLACED";
};
