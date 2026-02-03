const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function fixMentors() {
    try {
        const students = await prisma.student.findMany();
        const faculty = await prisma.faculty.findMany();

        console.log("Attempting to restore mentorships...");

        for (const student of students) {
            if (!student.mentorId) {
                // Find a faculty in the same department
                const matchingFaculty = faculty.find(f => f.department === student.department) || faculty[0];

                if (matchingFaculty) {
                    await prisma.student.update({
                        where: { id: student.id },
                        data: { mentorId: matchingFaculty.id }
                    });
                    console.log(`- Assigned ${student.name} to ${matchingFaculty.name} (${matchingFaculty.department})`);
                }
            } else {
                console.log(`- ${student.name} already has mentor ID ${student.mentorId}`);
            }
        }

        console.log("\nDone! Please refresh the application.");

    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

fixMentors();
