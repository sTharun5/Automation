const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // 🔹 STUDENTS
  await prisma.student.createMany({
    data: [
      {
        rollNo: "7376222AD168",
        name: "Student One",
        email: "student1@bitsathy.ac.in",
        department: "CSE",
        semester: 8
      },
      {
        rollNo: "7376222AD169",
        name: "Student Two",
        email: "student2@bitsathy.ac.in",
        department: "CSE",
        semester: 8
      }
    ],
    skipDuplicates: true
  });

  // 🔹 FACULTY
  await prisma.faculty.createMany({
    data: [
      {
        name: "Prof. Kumar",
        email: "kumar@bitsathy.ac.in",
        department: "CSE"
      },
      {
        name: "Prof. Devi",
        email: "devi@bitsathy.ac.in",
        department: "IT"
      }
    ],
    skipDuplicates: true
  });

  console.log("✅ Seed data inserted");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
