require("dotenv").config();
const Groq = require("groq-sdk");

async function testGroq() {
    console.log("🧪 Testing Groq AI Integration...\n");

    // Check API key
    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === "YOUR_API_KEY_HERE") {
        console.error("❌ GROQ_API_KEY not set in .env file");
        process.exit(1);
    }

    console.log("✅ API key loaded");

    try {
        const groq = new Groq({
            apiKey: process.env.GROQ_API_KEY
        });

        console.log("✅ Groq client initialized");
        console.log("\n📤 Sending test message to Disha 2.0...\n");

        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: "You are Disha 2.0, an AI assistant for the Smart OD Portal at Bannari Amman Institute of Technology."
                },
                {
                    role: "user",
                    content: "Hi, who are you?"
                }
            ],
            temperature: 0.7,
            max_tokens: 200
        });

        const response = completion.choices[0]?.message?.content;

        console.log("📥 Response from Disha 2.0:");
        console.log("─".repeat(60));
        console.log(response);
        console.log("─".repeat(60));
        console.log("\n✅ Groq AI integration is working!");
        console.log(`⚡ Model: ${completion.model}`);
        console.log(`📊 Tokens used: ${completion.usage.total_tokens}`);

    } catch (error) {
        console.error("\n❌ Test failed:");
        console.error(error.message);
        if (error.status) {
            console.error(`Status: ${error.status}`);
        }
        process.exit(1);
    }
}

testGroq();
