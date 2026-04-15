const prisma = require("../../config/db");
const sendEmail = require("../../utils/sendEmail");

/* =====================================================
   SUBMIT SUPPORT QUERY
 ===================================================== */
exports.submitQuery = async (req, res) => {
    try {
        const { subject, description } = req.body;
        const file = req.file; // Uploaded image/video
        const user = req.user; // Authenticated user

        if (!subject || !description) {
            return res.status(400).json({ message: "Subject and Description are required" });
        }

        const senderRole = user.role;
        const senderId = user.rollNo || user.facultyId || user.email;
        const senderName = user.name || "Unknown User";

        // Build HTML body for admin support email
        const htmlContent = `
            <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px">
                <h2 style="color:#4f46e5">🛠️ New Support Query</h2>
                <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0">
                    <p style="margin:0 0 8px"><strong>From:</strong> ${senderName} (${senderId})</p>
                    <p style="margin:0 0 8px"><strong>Role:</strong> ${senderRole}</p>
                    <p style="margin:0"><strong>Email:</strong> ${user.email}</p>
                </div>
                <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0"/>
                <h4 style="margin:0 0 8px">Subject: ${subject}</h4>
                <p style="margin:0">${description}</p>
                <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0"/>
                <p style="color:#94a3b8;font-size:12px">This query was submitted via the Smart OD Portal.</p>
            </div>
        `;

        // Send email to admin (fire-and-forget, non-blocking)
        sendEmail(
            process.env.ADMIN_EMAIL || "stharun612@gmail.com",
            `[SUPPORT] ${senderRole}: ${subject}`,
            htmlContent
        ).catch(err => console.error("SUPPORT EMAIL ERROR:", err));

        // Note: file attachments cannot be sent via Brevo REST API in this simple form,
        // but the text-based query is sent and admins also get an in-app notification below.

        // Create Dashboard Notification for all Admins
        const admins = await prisma.admin.findMany();
        if (admins.length > 0) {
            const notifications = admins.map(admin => ({
                email: admin.email,
                title: `New Support Query: ${subject}`,
                message: `From ${senderName} (${senderRole}): ${description.substring(0, 50)}...`,
                type: "ALERT",
                read: false,
                createdAt: new Date()
            }));
            await prisma.notification.createMany({ data: notifications });
        }

        return res.status(200).json({ message: "Query submitted successfully. Admin has been notified." });

    } catch (error) {
        console.error("SUBMIT QUERY ERROR:", error);
        return res.status(500).json({ message: "Failed to submit query" });
    }
};
