const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { isStudentPlaced } = require("../placements/placement.service");
const { v4: uuidv4 } = require("uuid");
const { validateInternshipFile } = require("../../utils/fileValidator");

/**
 * Create OD / Internship
 */
exports.createOD = async (data) => {
  const {
    studentId,
    type,
    startDate,
    endDate,
    eventId,
    proofFile
  } = data;

  // 1️⃣ CHECK PLACEMENT
  const placed = await isStudentPlaced(studentId);
  if (!placed) {
    throw new Error("OD allowed only for placed students");
  }

  // 2️⃣ PARSE DATES
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start) || isNaN(end)) {
    throw new Error("Invalid date format");
  }

  // 3️⃣ START DATE SHOULD NOT BE IN THE PAST
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (start < today) {
    throw new Error("OD start date cannot be in the past");
  }

  // 4️⃣ END DATE VALIDATION
  if (end < start) {
    throw new Error("End date cannot be before start date");
  }

  // 5️⃣ DURATION CALCULATION (IN DAYS)
  const duration =
    Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

  if (duration > 60) {
    throw new Error("OD duration cannot exceed 60 days");
  }

  // 6️⃣ INTERNSHIP FILE VALIDATION
  if (type === "INTERNSHIP") {
    if (!proofFile) {
      throw new Error("Internship proof file is required");
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { rollNo: true }
    });

    validateInternshipFile(proofFile, student.rollNo);
  }

  // 7️⃣ TRACKER ID GENERATION
  const trackerId = "OD-" + uuidv4().slice(0, 8).toUpperCase();

  // 8️⃣ CREATE OD (FINAL)
  return prisma.oD.create({
    data: {
      trackerId,
      type,
      startDate: start,
      endDate: end,
      duration,
      proofFile,
      studentId,
      eventId: type === "INTERNAL" ? eventId : null,
      status: "APPROVED"
    }
  });
};
