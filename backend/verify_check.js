const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
    try {
        console.log("🚀 Starting DB Verification...");

        // 1. Get a student and faculty
        const student = await prisma.student.findFirst();
        const faculty = await prisma.faculty.findFirst();

        if (!student || !faculty) {
            console.log("❌ Missing data");
            return;
        }

        // 2. Clear existing notifications for cleanliness
        await prisma.notification.deleteMany({ where: { email: { in: [student.email, faculty.email] } } });

        // 3. Simulate Mentor Assignment (Call the Admin Controller logic essentially, or just trigger the route via unrelated script? No, I want to verify the API trigger.)
        // Since I cannot easily invoke the controller without running the server, I will invoke the API.
        // But to verify the RESULT, I will use Prisma.

        // I will run this script AFTER running the API script or manually triggering.
        // Actually, I can just use the previous API script but inspect DB at the end.

        // Let's stick to the previous API script but modify it to use Prisma for checking results instead of logging in.

    } catch (e) {
        console.error(e);
    }
}
