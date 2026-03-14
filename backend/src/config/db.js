const { PrismaClient } = require("@prisma/client");

// Global singleton to prevent multiple connection pools
// This is critical in production to avoid MaxClientsInSessionMode errors
const globalForPrisma = global;

const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["error"] : ["error"],
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

module.exports = prisma;
