// src/modules/placementStatus/placementStatus.service.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.upsertPlacementStatus = async ({
  studentId,
  status,
  companyName,
  placedDate
}) => {
  return prisma.placement_status.upsert({
    where: { studentId },
    update: {
      status,
      companyName,
      placedDate
    },
    create: {
      studentId,
      status,
      companyName,
      placedDate
    }
  });
};

exports.getPlacementStatusByStudentId = async (studentId) => {
  return prisma.placement_status.findUnique({
    where: { studentId },
    include: {
      student: true
    }
  });
};
