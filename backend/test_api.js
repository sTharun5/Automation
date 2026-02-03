const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function fullCheck() {
    try {
        const students = await prisma.student.findMany({ include: { mentor: true } });
        const faculty = await prisma.faculty.findMany();

        console.log("\n--- FACULTY ---");
        faculty.forEach(f => console.log(`ID: ${f.id} | Name: ${f.name} | Email: ${f.email}`));

        console.log("\n--- STUDENTS ---");
        students.forEach(s => {
            console.log(`Student: ${s.name} | Mentor: ${s.mentor ? s.mentor.name : 'NONE'} (MentorId: ${s.mentorId})`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

fullCheck();
