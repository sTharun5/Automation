const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    try {
        // Find students who actually have ODs
        const students = await prisma.student.findMany({
            where: {
                ods: {
                    some: {} // Check if has at least one OD
                }
            },
            include: {
                ods: true
            }
        });

        if (students.length === 0) {
            console.log("No students with ODs found.");
            return;
        }

        students.forEach(student => {
            console.log(`\nChecking ODs for Student: ${student.name} (${student.email})`);
            console.log("---------------------------------------------------");

            let totalDuration = 0;

            student.ods.forEach(od => {
                const start = new Date(od.startDate);
                const end = new Date(od.endDate);
                const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;

                const isCounted = ["APPROVED", "MENTOR_APPROVED"].includes(od.status);

                console.log(`ID: ${od.id} | Status: ${od.status.padEnd(15)} | Duration (DB): ${od.duration} | Duration (Calc): ${diffDays} | Counted: ${isCounted}`);

                if (isCounted) {
                    totalDuration += od.duration;
                }
            });

            console.log("---------------------------------------------------");
            console.log(`Total Used Days: ${totalDuration}`);
            console.log(`Remaining Days (60 - Used): ${60 - totalDuration}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
