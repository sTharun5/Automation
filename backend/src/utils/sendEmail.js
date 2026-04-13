const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

/**
 * Send an email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - Email body (HTML)
 */
const sendEmail = async (to, subject, html) => {
    try {
        const info = await transporter.sendMail({
            from: `SMART OD <${process.env.MAIL_USER}>`,
            to,
            subject,
            html
        });
        console.log("Email sent: " + info.response);
        return info;
    } catch (error) {
        console.error("Error sending email:", error);
        // Don't throw, just log, so it doesn't break the main flow
        return null;
    }
};

module.exports = sendEmail;
