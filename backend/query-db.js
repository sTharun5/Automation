const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function main() {
    console.log("--- ODS ---");
    const ods = await prisma.od.findMany({ include: { event: true }});
    console.log(JSON.stringify(ods, null, 2));
    
    console.log("--- EVENTS ---");
    const events = await prisma.event.findMany();
    console.log(JSON.stringify(events, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
