const prisma = require("../../config/db");

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
exports.getOrCreateCompany = async (name, location = null) => {
    return prisma.company.upsert({
        where: { name },
        update: location ? { location } : {},
        create: { name, location }
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

/**
 * Update an existing company
 */
exports.updateCompany = async (id, data) => {
    return prisma.company.update({
        where: { id: Number(id) },
        data
    });
};
