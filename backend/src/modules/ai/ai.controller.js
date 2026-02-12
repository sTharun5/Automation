const Groq = require("groq-sdk");

// Initialize Groq client
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

/* =====================================================
   SYSTEM PROMPT - DISHA 2.0 PERSONALITY
===================================================== */
const SYSTEM_PROMPT = `You are Disha 2.0, an intelligent AI assistant for the Smart OD (On-Duty) Portal at Bannari Amman Institute of Technology.

Your role is to help students with:
- Understanding OD application procedures
- Document requirements and formats
- Eligibility criteria
- Tracking application status
- General queries about the system

KEY RULES:
1. File Formats: Only PDF files are accepted
2. Naming Convention: 
   - Offer Letter: RollNo-ITO-Date.pdf
   - Aim/Objective: RollNo-ITI-Date.pdf
3. Duration Limit: Maximum 60 days per academic year
4. Eligibility: Confirmed placement or valid NIP status required

RESPONSE FORMAT:
- Be concise but informative
- Use markdown formatting for clarity
- For procedural questions, provide step-by-step guidance
- Be friendly and professional

IMPORTANT: You do NOT have the ability to apply for ODs directly. The Smart Apply feature is handled separately by the frontend. If users want to apply, guide them to use the "Apply OD" command with attachments.`;

/* =====================================================
   CHAT ENDPOINT
===================================================== */
exports.chat = async (req, res) => {
    try {
        const { message, conversationHistory = [] } = req.body;

        if (!message || message.trim().length === 0) {
            return res.status(400).json({
                error: "Message is required"
            });
        }

        // Build messages array for Groq
        const messages = [
            { role: "system", content: SYSTEM_PROMPT },
            ...conversationHistory.map(msg => ({
                role: msg.role,
                content: msg.content
            })),
            { role: "user", content: message }
        ];

        // Call Groq API
        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile", // Updated from deprecated llama3-70b-8192
            messages: messages,
            temperature: 0.7,
            max_tokens: 1024,
            top_p: 1,
            stream: false
        });

        const response = completion.choices[0]?.message?.content;

        if (!response) {
            throw new Error("No response from AI");
        }

        res.json({
            response: response,
            model: "llama3-70b-8192"
        });

    } catch (error) {
        console.error("GROQ API ERROR:", error);

        // Handle specific error cases
        if (error.status === 429) {
            return res.status(429).json({
                error: "Rate limit exceeded. Please try again in a moment."
            });
        }

        if (error.status === 401) {
            return res.status(500).json({
                error: "API authentication failed. Please contact administrator."
            });
        }

        res.status(500).json({
            error: "Failed to process your request. Please try again."
        });
    }
};
