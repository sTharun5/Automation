const { PrismaClient } = require("@prisma/client");

// Global singleton — prevents multiple connection pools on hot-reload
const globalForPrisma = global;

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
  });

// Cache in all environments (not just dev) to guard against accidental re-requires
globalForPrisma.prisma = prisma;

module.exports = prisma;
