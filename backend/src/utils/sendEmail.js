const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // Forces STARTTLS on port 587 to skip Render's 465 outgoing firewall block
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
        console.log("NODEMAILER SUCCESS: " + info.response);
        return info;
    } catch (error) {
        console.error("NODEMAILER ERROR:", error);
        return null; // Don't crash
    }
};

module.exports = sendEmail;
