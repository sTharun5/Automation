const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkData() {
    try {
        const students = await prisma.student.findMany();
        console.log(`\n--- Students ---`);
        students.forEach(s => {
            console.log(`- ${s.name} (ID: ${s.id}, Email: ${s.email}, MentorId: ${s.mentorId})`);
        });

        const faculty = await prisma.faculty.findMany();
        console.log(`\n--- Faculty ---`);
        faculty.forEach(f => {
            console.log(`- ${f.name} (ID: ${f.id}, Email: ${f.email})`);
        });

    } catch (err) {
        console.error("Error checking data:", err);
    } finally {
        await prisma.$disconnect();
    }
}

checkData();
