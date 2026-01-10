const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Check whether a student is placed
 */
exports.isStudentPlaced = async (studentId) => {
  // Step 1: get student roll number
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { rollNo: true }
  });

  if (!student) return false;

  // Step 2: check placement table
  const placement = await prisma.placement.findUnique({
    where: { rollNo: student.rollNo }
  });

  return !!placement;
};
