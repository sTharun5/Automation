const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send an email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - Email body (HTML)
 */
const sendEmail = async (to, subject, html) => {
    try {
        const { data, error } = await resend.emails.send({
            from: "SMART OD <onboarding@resend.dev>", // Replace with your domain once verified
            to,
            subject,
            html
        });

        if (error) {
            console.error("Resend Error:", error);
            return null;
        }

        return data;
    } catch (error) {
        console.error("Error sending email:", error);
        return null;
    }
};

module.exports = sendEmail;
