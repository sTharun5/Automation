const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function main() {
    console.log("All internal ODs:");
    const ods = await prisma.od.findMany({ where: { type: "INTERNAL" } });
    console.log(ods);
    await prisma.od.deleteMany({ where: { type: "INTERNAL" } });
    console.log("Deleted all internal ODs for clean state.");
}
main().catch(console.error).finally(() => prisma.$disconnect());
