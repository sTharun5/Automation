const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const API_URL = 'http://localhost:3000/api';
let studentToken, facultyToken, studentId, facultyId, pendingODId;

async function setupData() {
    console.log("Setting up test data...");

    // 1. Create/Get Faculty
    const facultyEmail = "faculty_test@test.com";
    let faculty = await prisma.faculty.findUnique({ where: { email: facultyEmail } });
    if (!faculty) {
        faculty = await prisma.faculty.create({
            data: { name: "Test Faculty", email: facultyEmail, facultyId: "FAC001", department: "CSE" }
        });
    }
    facultyId = faculty.id;

    // 2. Create/Get Student
    const studentEmail = "student_test@test.com";
    let student = await prisma.student.findUnique({ where: { email: studentEmail } });
    if (!student) {
        student = await prisma.student.create({
            data: {
                name: "Test Student",
                email: studentEmail,
                rollNo: "TEST001",
                department: "CSE",
                semester: 6,
                mentorId: faculty.id
            }
        });
    } else {
        await prisma.student.update({ where: { id: student.id }, data: { mentorId: faculty.id } });
    }
    studentId = student.id;

    // 3. Clear existing data
    await prisma.internshipReport.deleteMany({ where: { studentId } });
    await prisma.od.deleteMany({ where: { studentId } });

    // 4. Create ONE Completed OD (Approved & Ended yesterday)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    const od = await prisma.od.create({
        data: {
            trackerId: "OD-TEST-PENDING",
            type: "INTERNSHIP",
            startDate: lastWeek,
            endDate: yesterday, // Completed!
            duration: 7,
            studentId: studentId,
            status: "APPROVED"
        }
    });
    pendingODId = od.id;

    console.log(`Data setup complete. OD ID ${pendingODId} is completed and needs a report.`);
}

async function login() {
    // Mocking tokens - In real app use /auth/login
    // Assuming we can generate tokens if secret is known, or use a helper.
    // For local dev with known secret or no auth in dev mode:
    const jwt = require('jsonwebtoken');
    const secret = process.env.JWT_SECRET || "secret_key";

    studentToken = jwt.sign({ id: studentId, email: "student_test@test.com", role: "STUDENT" }, secret);
    facultyToken = jwt.sign({ id: facultyId, email: "faculty_test@test.com", role: "FACULTY" }, secret);
}

async function testODBlock() {
    console.log("\n--- Testing OD Blockage ---");
    try {
        await axios.post(`${API_URL}/od/apply`, {
            studentId,
            industry: "IT",
            campusType: "On Campus",
            startDate: "2024-06-01",
            endDate: "2024-06-05", // Future OD
            duration: 5,
            offerId: 1
        }, {
            headers: { Authorization: `Bearer ${studentToken}` }
        });
        console.error("❌ Test Failed: OD Application should have been blocked.");
    } catch (err) {
        if (err.response && err.response.status === 403 && err.response.data.message === "Internship Report Required") {
            const pending = err.response.data.pendingODs;
            if (pending && pending.length > 0 && pending[0].id === pendingODId) {
                console.log("✅ OD Blocked correctly with pending OD list.");
            } else {
                console.error("❌ OD Blocked but pending list is missing or incorrect.", pending);
            }
        } else {
            console.error("❌ Unexpected Error:", err.message, err.response?.data);
        }
    }
}

async function testUploadReport() {
    console.log("\n--- Testing Report Upload ---");
    const form = new FormData();
    fs.writeFileSync('dummy_report.pdf', 'dummy content');
    form.append('reportFile', fs.createReadStream('dummy_report.pdf'));
    form.append('odId', pendingODId); // ✅ Send OD ID

    try {
        const res = await axios.post(`${API_URL}/reports/upload`, form, {
            headers: {
                Authorization: `Bearer ${studentToken}`,
                ...form.getHeaders()
            }
        });
        console.log("✅ Report Uploaded:", res.data.message);
        fs.unlinkSync('dummy_report.pdf');
    } catch (err) {
        console.error("❌ Upload Failed:", err.message, err.response?.data);
    }
}

async function testMentorReview() {
    console.log("\n--- Testing Mentor Review ---");
    try {
        const res = await axios.get(`${API_URL}/faculty/reports/pending`, {
            headers: { Authorization: `Bearer ${facultyToken}` }
        });
        const reports = res.data;
        const report = reports.find(r => r.odId === pendingODId); // Check by OD ID

        if (report) {
            console.log("Approving report...");
            await axios.put(`${API_URL}/reports/${report.id}/status`, {
                status: "APPROVED",
                remarks: "Approved via script"
            }, {
                headers: { Authorization: `Bearer ${facultyToken}` }
            });
            console.log("✅ Report Approved.");
        } else {
            console.error("❌ No report found for the pending OD.");
        }
    } catch (err) {
        console.error("❌ Mentor Review Failed:", err.message, err.response?.data);
    }
}

async function testODUnblock() {
    console.log("\n--- Testing OD Unblock ---");
    try {
        await axios.post(`${API_URL}/od/apply`, {
            // Same data
            studentId, industry: "IT", campusType: "On Campus",
            startDate: "2024-06-01", endDate: "2024-06-05", duration: 5, offerId: 1
        }, {
            headers: { Authorization: `Bearer ${studentToken}` }
        });
        // Logic might fail on dummy offerId, but as long as it's not 403 Report Required
        console.log("✅ OD Unblocked (Unexpected success with dummy data, but passed block check)");
    } catch (err) {
        if (err.response && err.response.status === 403 && err.response.data.message === "Internship Report Required") {
            console.error("❌ Test Failed: Still Blocked!");
        } else {
            console.log("✅ OD Unblocked (Expected failure on dummy data): " + err.response?.data?.message);
        }
    }
}

async function run() {
    await setupData();
    require('dotenv').config();
    await login();
    await testODBlock();
    await testUploadReport();
    await testMentorReview();
    await testODUnblock();
    await prisma.$disconnect();
}

run();
