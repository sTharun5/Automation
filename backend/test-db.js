const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function main() {
  const students = await prisma.student.findMany({
    include: { mentor: true, offers: true },
    take: 5
  });
  students.forEach(s => {
    console.log(`Student: ${s.email}`);
    console.log(`  Mentor:`, s.mentor ? s.mentor.name : "none");
    console.log(`  Offers:`, s.offers.length > 0 ? s.offers.map(o => o.lpa) : "none");
  });
}
main().catch(console.error).finally(() => prisma.$disconnect());
