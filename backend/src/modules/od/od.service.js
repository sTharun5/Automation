const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { v4: uuidv4 } = require("uuid");
const { validateInternshipFile } = require("../../utils/fileValidator");
const { getOfferById } = require("../students/offer.service");

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
    proofFile,
    offerId // ✅ New requirement
  } = data;

  // 1️⃣ VALIDATE OFFER & COMPANY APPROVAL
  const offer = await getOfferById(offerId);
  if (!offer) {
    throw new Error("Invalid offer selection");
  }

  if (offer.studentId !== Number(studentId)) {
    throw new Error("This offer does not belong to the student");
  }

  if (!offer.company.isApproved) {
    throw new Error(`OD cannot be approved for ${offer.company.name}. This company is not on the approved list.`);
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
  return prisma.od.create({ // Note: Prisma model name is 'od' not 'oD' in the updated schema
    data: {
      trackerId,
      type,
      startDate: start,
      endDate: end,
      duration,
      proofFile,
      studentId: Number(studentId),
      offerId: Number(offerId),
      eventId: type === "INTERNAL" ? Number(eventId) : null,
      status: "APPROVED"
    }
  });
};
