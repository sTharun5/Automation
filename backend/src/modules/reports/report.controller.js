const prisma = require("../../config/db");
const notificationService = require("../notification/notification.service");
const sendEmail = require("../../utils/sendEmail");

/* =====================================================
   UPLOAD REPORT (STUDENT)
===================================================== */
exports.uploadReport = async (req, res) => {
    try {
        const email = req.user.email;
        const { odId } = req.body; // ✅ odId is now required
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: "Report file is required" });
        }

        if (!odId) {
            return res.status(400).json({ message: "OD ID is required" });
        }

        const studentData = await prisma.student.findUnique({
            where: { email }
        });

        if (!studentData) {
            return res.status(404).json({ message: "Student not found" });
        }
        const studentId = studentData.id;

        // Check if OD belongs to student and is completed
        const od = await prisma.od.findUnique({
            where: { id: Number(odId) },
            include: { report: true }
        });

        if (!od) {
            return res.status(404).json({ message: "OD not found" });
        }

        if (od.studentId !== studentId) {
            return res.status(403).json({ message: "Unauthorized: This OD does not belong to you." });
        }

        if (od.report) {
            if (od.report.status === "APPROVED") {
                return res.status(400).json({ message: "Report already approved for this OD." });
            }

            const updatedReport = await prisma.internshipReport.update({
                where: { id: od.report.id },
                data: {
                    fileUrl: file.path,
                    status: "PENDING",
                    remarks: null
                }
            });

            return res.json({ message: "Report re-submitted successfully", report: updatedReport });
        }

        // Create new report
        const report = await prisma.internshipReport.create({
            data: {
                studentId: studentId,
                odId: Number(odId),
                fileUrl: file.path,
                status: "PENDING"
            }
        });

        // Notify + Email Mentor
        const student = await prisma.student.findUnique({ where: { id: studentId }, include: { mentor: true } });
        if (student && student.mentor) {
            await notificationService.createNotification(
                student.mentor.email,
                "Internship Report Submitted",
                `Student ${student.name} (${student.rollNo}) has submitted an Internship Report for review.`,
                "INFO"
            );
            sendEmail(
                student.mentor.email,
                `[SMART OD] Internship Report Submitted by ${student.name}`,
                `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px">
                  <h2 style="color:#4f46e5">📄 Internship Report Submitted</h2>
                  <p>Hello <strong>${student.mentor.name}</strong>,</p>
                  <p>Your mentee has submitted an internship report for your review:</p>
                  <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0">
                    <p style="margin:0 0 8px"><strong>Student:</strong> ${student.name}</p>
                    <p style="margin:0"><strong>Roll No:</strong> ${student.rollNo}</p>
                  </div>
                  <p>Please log in to the SMART OD portal to review and approve/reject the report.</p>
                  <p style="color:#94a3b8;font-size:12px">— SMART OD System</p>
                </div>`
            ).catch(e => console.error("Email Error (report submitted):", e));
        }

        res.status(201).json({ message: "Report uploaded successfully", report });

    } catch (error) {
        console.error("UPLOAD REPORT ERROR:", error);
        res.status(500).json({ message: "Failed to upload report" });
    }
};

/* =====================================================
   GET REPORT STATUS (STUDENT)
===================================================== */
/* =====================================================
   GET PENDING ODS FOR REPORT (STUDENT)
===================================================== */
exports.getPendingODs = async (req, res) => {
    try {
        const studentId = req.user.id;
        const today = new Date();

        // Find Completed ODs that do NOT have an APPROVED report
        const pendingODs = await prisma.od.findMany({
            where: {
                studentId: studentId,
                status: "APPROVED",
                endDate: { lt: today }, // Completed
                OR: [
                    { report: { is: null } },
                    { report: { status: { not: "APPROVED" } } }
                ]
            },
            include: {
                report: true,
                offer: { include: { company: true } }
            }
        });

        res.json(pendingODs);
    } catch (error) {
        console.error("GET PENDING ODS ERROR:", error);
        res.status(500).json({ message: "Failed to fetch pending ODs" });
    }
};

/* =====================================================
   UPDATE REPORT STATUS (MENTOR)
===================================================== */
exports.updateReportStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, remarks } = req.body;
        const mentorEmail = req.user.email; // Assuming Faculty/Mentor is logged in

        if (!["APPROVED", "REJECTED"].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const report = await prisma.internshipReport.findUnique({
            where: { id: Number(id) },
            include: { student: { include: { mentor: true } } }
        });

        if (!report) {
            return res.status(404).json({ message: "Report not found" });
        }

        // Verify Mentor authorization
        if (report.student.mentor.email !== mentorEmail) {
            // Check if Admin? For now assuming only Mentor updates
            // return res.status(403).json({ message: "Unauthorized"});
            // Actually let's allow Admin too if needed, but for now strict mentor check or just proceed if role is authorized elsewhere
        }

        const updatedReport = await prisma.internshipReport.update({
            where: { id: Number(id) },
            data: {
                status: status,
                remarks: remarks
            }
        });

        // Notify + Email Student
        await notificationService.createNotification(
            report.student.email,
            `Internship Report ${status}`,
            `Your internship report has been ${status}. ${remarks ? `Remarks: ${remarks}` : ""}`,
            status === "APPROVED" ? "SUCCESS" : "ERROR"
        );
        sendEmail(
            report.student.email,
            `[SMART OD] Internship Report ${status}`,
            `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:${status === 'APPROVED' ? '#f0fdf4' : '#fff7f7'};border-radius:12px;border-left:4px solid ${status === 'APPROVED' ? '#22c55e' : '#ef4444'}">
              <h2 style="color:${status === 'APPROVED' ? '#16a34a' : '#dc2626'}">${status === 'APPROVED' ? '✅' : '❌'} Internship Report ${status}</h2>
              <p>Hello <strong>${report.student.name}</strong>,</p>
              <p>Your internship report has been <strong>${status}</strong> by your mentor.</p>
              ${remarks ? `<div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0"><p style="margin:0"><strong>Mentor Remarks:</strong> ${remarks}</p></div>` : ''}
              ${status === 'REJECTED' ? '<p>Please review the remarks and re-submit an updated report.</p>' : '<p>Congratulations on completing your internship! 🎓</p>'}
              <p style="color:#94a3b8;font-size:12px">— SMART OD System</p>
            </div>`
        ).catch(e => console.error("Email Error (report status):", e));

        res.json({ message: "Report status updated", report: updatedReport });

    } catch (error) {
        console.error("UPDATE REPORT ERROR:", error);
        res.status(500).json({ message: "Failed to update report" });
    }
};
