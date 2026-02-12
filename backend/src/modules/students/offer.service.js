const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Add a new offer to a student
 */
exports.addOffer = async (data) => {
    const { studentId, companyId, lpa, offerLetter, placedDate } = data;

    return prisma.offer.create({
        data: {
            studentId: Number(studentId),
            companyId: Number(companyId),
            lpa: String(lpa),
            offerLetter,
            placedDate: new Date(placedDate)
        },
        include: {
            company: true
        }
    });
};

/**
 * Get all offers for a student
 */
exports.getStudentOffers = async (studentId) => {
    return prisma.offer.findMany({
        where: { studentId: Number(studentId) },
        include: {
            company: true
        },
        orderBy: { placedDate: "desc" }
    });
};

/**
 * Get offer by ID
 */
exports.getOfferById = async (id) => {
    return prisma.offer.findUnique({
        where: { id: Number(id) },
        include: {
            company: true
        }
    });
};
