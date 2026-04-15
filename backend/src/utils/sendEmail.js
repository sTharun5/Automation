const axios = require("axios");

/**
 * Send a transactional email via Brevo REST API (no SDK dependency).
 * Uses axios, which is already installed in the project.
 *
 * @param {string} to      - Recipient email address
 * @param {string} subject - Email subject line
 * @param {string} html    - HTML body content
 */
const sendEmail = async (to, subject, html) => {
    try {
        const response = await axios.post(
            "https://api.brevo.com/v3/smtp/email",
            {
                sender: {
                    name: "SMART OD",
                    email: process.env.MAIL_USER
                },
                to: [{ email: to }],
                subject,
                htmlContent: html
            },
            {
                headers: {
                    "api-key": process.env.BREVO_API_KEY,
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            }
        );
        console.log("BREVO SUCCESS:", response.data?.messageId);
        return response.data;
    } catch (error) {
        console.error(
            "BREVO ERROR:",
            error.response?.data || error.message
        );
        return null;
    }
};

module.exports = sendEmail;
