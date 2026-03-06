const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const SibApiV3Sdk = require("sib-api-v3-sdk");
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

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

        // 1. Prepare Email Content
        const senderRole = user.role;
        const senderId = user.rollNo || user.facultyId || user.email;
        const senderName = user.name || "Unknown User";

        const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
        sendSmtpEmail.subject = `[SUPPORT] ${senderRole}: ${subject}`;
        sendSmtpEmail.htmlContent = `
            <h3>New Support Query</h3>
            <p><strong>From:</strong> ${senderName} (${senderId})</p>
            <p><strong>Role:</strong> ${senderRole}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <hr />
            <h4>Subject: ${subject}</h4>
            <p>${description}</p>
            <hr />
            <p><em>This query was submitted via the Smart OD Portal.</em></p>
        `;
        sendSmtpEmail.sender = { name: "SMART OD", email: process.env.MAIL_USER };
        sendSmtpEmail.to = [{ email: process.env.ADMIN_EMAIL || "stharun612@gmail.com" }];
        sendSmtpEmail.attachments = [];

        if (file) {
            const fs = require('fs');
            const data = fs.readFileSync(file.path);
            sendSmtpEmail.attachments.push({
                name: file.originalname,
                content: data.toString('base64')
            });
        }

        try {
            const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
            console.log("BREVO SUPPORT SUCCESS:", data.messageId);
        } catch (emailErr) {
            console.error("BREVO SUPPORT ERROR:", emailErr.response?.body || emailErr.message);
        }

        // 4. Create Dashboard Notification for Admin
        // We assume there's a generic way to notify admins or we drop it into the 'notification' table 
        // targeted at all admins or a specific admin email.
        // For now, let's find all admins and notify them (or just the main one)

        // Fetch all admins
        const admins = await prisma.admin.findMany(); // Assuming admin model exists

        if (admins.length > 0) {
            const notifications = admins.map(admin => ({
                email: admin.email, // Targeted at admin email
                title: `New Support Query: ${subject}`,
                message: `From ${senderName} (${senderRole}): ${description.substring(0, 50)}...`,
                type: "ALERT",
                read: false,
                createdAt: new Date()
            }));

            await prisma.notification.createMany({
                data: notifications
            });
        }

        return res.status(200).json({ message: "Query submitted successfully. Admin has been notified." });

    } catch (error) {
        console.error("SUBMIT QUERY ERROR:", error);
        return res.status(500).json({ message: "Failed to submit query" });
    }
};
