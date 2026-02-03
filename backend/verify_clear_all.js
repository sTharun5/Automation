const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3000/api';

async function getStudentToken(email) {
    const otp = "999999";
    await prisma.emailotp.deleteMany({ where: { email } });
    await prisma.emailotp.create({
        data: {
            email,
            otp,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000)
        }
    });

    const res = await fetch(`${BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
    });

    if (!res.ok) throw new Error(`Login Failed: ${res.status}`);
    const data = await res.json();
    return data.token;
}

async function run() {
    console.log("🚀 Starting verification (Clear All Notifications)...");

    try {
        const student = await prisma.student.findFirst();
        if (!student) {
            console.log("❌ No student found");
            process.exit(1);
        }

        console.log(`ℹ️ Student: ${student.email}`);

        // 1. Create dummy notifications
        console.log("ℹ️ Creating dummy notifications...");
        await prisma.notification.createMany({
            data: [
                { email: student.email, title: "Test 1", message: "Msg 1", type: "INFO" },
                { email: student.email, title: "Test 2", message: "Msg 2", type: "INFO" }
            ]
        });

        // 2. Login
        const token = await getStudentToken(student.email);
        console.log("✅ Student Logged In");

        // 3. Call DELETE /api/notifications
        console.log("ℹ️ Calling DELETE /api/notifications...");
        const res = await fetch(`${BASE_URL}/notifications`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error(`API Failed: ${res.status}`);
        console.log("✅ API Success");

        // 4. Verify DB
        const count = await prisma.notification.count({ where: { email: student.email } });
        if (count === 0) {
            console.log("✅ DB Verified: 0 notifications found.");
            console.log("\n✨ SUCCESS: Clear All verified!");
            process.exit(0);
        } else {
            console.error(`❌ DB Verification Failed: Found ${count} notifications.`);
            process.exit(1);
        }

    } catch (e) {
        console.error("❌ Error:", e.message);
        process.exit(1);
    }
}

run();
