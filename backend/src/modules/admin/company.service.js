const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * List all companies
 */
exports.listCompanies = async (filter = {}) => {
    return prisma.company.findMany({
        where: filter,
        orderBy: { name: "asc" }
    });
};

/**
 * Create or get company by name
 */
exports.getOrCreateCompany = async (name) => {
    return prisma.company.upsert({
        where: { name },
        update: {},
        create: { name }
    });
};

/**
 * Toggle company approval status
 */
exports.toggleCompanyApproval = async (id, isApproved) => {
    return prisma.company.update({
        where: { id: Number(id) },
        data: { isApproved }
    });
};

/**
 * Check if company is approved
 */
exports.isCompanyApproved = async (companyId) => {
    const company = await prisma.company.findUnique({
        where: { id: Number(companyId) }
    });
    return company?.isApproved || false;
};
