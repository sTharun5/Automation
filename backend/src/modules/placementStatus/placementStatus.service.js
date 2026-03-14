// src/modules/placementStatus/placementStatus.service.js
const prisma = require("../../config/db");

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
