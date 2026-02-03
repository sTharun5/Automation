const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function login(email, password) {
    try {
        const res = await axios.post(`${BASE_URL}/auth/login`, { email, password });
        return res.data.token;
    } catch (error) {
        console.error(`Login failed for ${email}:`, error.response?.data || error.message);
        return null;
    }
}

async function verifyNotifications() {
    console.log("🚀 Starting Notification Verification...");

    // 1. Login as Admin
    const adminToken = await login('admin@bit.com', 'admin123');
    if (!adminToken) return;
    console.log("✅ Admin Logged In");

    // 2. Fetch a student and faculty to link
    try {
        const studentsRes = await axios.get(`${BASE_URL}/admin/students`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        const facultyRes = await axios.get(`${BASE_URL}/admin/faculty`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });

        const student = studentsRes.data[0];
        const faculty = facultyRes.data[0];

        if (!student || !faculty) {
            console.error("❌ Need at least one student and one faculty.");
            return;
        }

        console.log(`ℹ️ Assigning Mentor ${faculty.name} to Student ${student.name}...`);

        // 3. Assign Mentor (Triggers Notification)
        await axios.post(`${BASE_URL}/admin/assign-mentor`, {
            mentorId: faculty.id,
            studentIds: [student.id]
        }, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log("✅ Mentor Assigned");

        // 4. Verify Student Notification
        // We assume we can login as student. If password unknown, we can't test this easily without resetting.
        // Assuming default password '123456' for students as per typical seed data, or we just rely on logs.
        // Let's try logging in as the student.
        // Note: If you don't know the password, this step might fail.
        // But usually seed data has consistent passwords.
        // Let's assume '123456' or similar. If it fails, we'll skip.

        // For this environment, I'll attempt using the student's email and a common password or just check if I can 'peek' at DB.
        // Since I can't peek easily at DB without prism client script, I'll write a script that uses Prisma directly instead of API for verification if login fails.

        // Actually, using Prisma directly is safer for verification script here.

    } catch (error) {
        console.error("❌ Flow failed:", error.response?.data || error.message);
    }
}

verifyNotifications();
