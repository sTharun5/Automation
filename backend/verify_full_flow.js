const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BASE_URL = 'http://localhost:3000/api';

async function getAdminToken(email) {
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
    console.log("🚀 Starting Verification (Deep Debug)...");

    try {
        const admin = await prisma.admin.findFirst();
        const student = await prisma.student.findFirst();
        const faculty = await prisma.faculty.findFirst();

        if (!admin || !student || !faculty) {
            console.log("❌ Missing admin/student/faculty data.");
            process.exit(1);
        }

        console.log(`ℹ️ Admin: ${admin.email}`);
        console.log(`ℹ️ Student: ${student.email}`);
        console.log(`ℹ️ Faculty: ${faculty.email}`);

        // 1.5 Verify Notification Table Access
        try {
            // console.log("ℹ️ Testing DB Notification Table Access...");
            await prisma.notification.create({
                data: {
                    email: admin.email,
                    title: "Test Notif",
                    message: "Test Message",
                    type: "INFO"
                }
            });
            console.log("✅ DB Notification Table Access - OK");
        } catch (e) {
            console.error("❌ DB Notification Table Access - FAILED:", e.message);
            console.log("⚠️ This means `npx prisma migrate dev` was not run or server DB is out of sync.");
            process.exit(1);
        }

        // 2. Login as Admin
        const adminToken = await getAdminToken(admin.email);
        console.log("✅ Admin Logged In");

        // 3. Trigger Mentor Assignment via API
        console.log("ℹ️ Triggering Mentor Assignment API (PUT)...");
        const res = await fetch(`${BASE_URL}/admin/assign-mentor`, {
            method: 'PUT', // ✅ Correct method
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                mentorId: faculty.id,
                studentIds: [student.id]
            })
        });

        if (!res.ok) {
            const text = await res.text();
            console.error(`❌ API Error Status: ${res.status} ${res.statusText}`);
            console.error(`❌ API Error Body: \n${text.substring(0, 1000)}...`);
            throw new Error(`API Failed: ${res.status}`);
        }
        console.log("✅ API Success");

        // 4. Check DB for Notifications
        console.log("ℹ️ Checking DB for results...");
        setTimeout(async () => {
            const studentNotif = await prisma.notification.findFirst({
                where: { email: student.email, title: "Mentor Assigned" },
                orderBy: { createdAt: 'desc' }
            });

            if (studentNotif) {
                console.log(`✅ Student Notification Found!`);
                console.log("\n✨ SUCCESS: Real-time notification system verified!");
                process.exit(0);
            } else {
                console.log(`❌ Student Notification NOT Found`);
                process.exit(1);
            }
        }, 2000);

    } catch (e) {
        console.error("❌ Error:", e.message);
        process.exit(1);
    }
}

run();
