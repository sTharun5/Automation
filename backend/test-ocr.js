const fs = require("fs");
const pdf = require("pdf-parse");

async function testOCR() {
    try {
        const filePath = "./uploads/offer-letter/7376222AD218-ITO-30.1.2026.pdf";

        console.log("📄 Testing OCR on:", filePath);
        console.log("=".repeat(60));

        // Read the PDF
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);

        console.log("\n✅ PDF Info:");
        console.log("  - Pages:", data.numpages);
        console.log("  - Text Length:", data.text.length, "characters");

        console.log("\n📝 Extracted Text:");
        console.log("=".repeat(60));
        console.log(data.text);
        console.log("=".repeat(60));

        // Now test the verification logic
        const text = data.text.toLowerCase().replace(/\s+/g, " ");

        console.log("\n🔍 Testing Verification Logic:");
        console.log("=".repeat(60));

        // Test student name
        const studentName = "Tharun";  // Update this with actual name
        console.log("\n1️⃣ Student Name Check:");
        console.log("  Looking for:", studentName);
        const nameFound = text.includes(studentName.toLowerCase());
        console.log("  Result:", nameFound ? "✅ FOUND" : "❌ NOT FOUND");

        // Test company name
        const companyName = "example company";  // Update this
        console.log("\n2️⃣ Company Name Check:");
        console.log("  Looking for:", companyName);
        const companyFound = text.includes(companyName.toLowerCase());
        console.log("  Result:", companyFound ? "✅ FOUND" : "❌ NOT FOUND");

        // Test dates
        const startDate = new Date("2026-01-30");
        const endDate = new Date("2026-05-30");

        console.log("\n3️⃣ Date Check:");
        console.log("  Start Date:", startDate.toLocaleDateString());
        console.log("  End Date:", endDate.toLocaleDateString());

        const years = [startDate.getFullYear().toString(), endDate.getFullYear().toString()];
        const months = [
            startDate.toLocaleString("default", { month: "long" }).toLowerCase(),
            startDate.toLocaleString("default", { month: "short" }).toLowerCase(),
            endDate.toLocaleString("default", { month: "long" }).toLowerCase(),
            endDate.toLocaleString("default", { month: "short" }).toLowerCase()
        ];

        const yearMatch = years.some(y => text.includes(y));
        const monthMatch = months.some(m => text.includes(m));

        console.log("  Years to check:", years);
        console.log("  Year found:", yearMatch ? "✅ YES" : "❌ NO");
        console.log("  Months to check:", months);
        console.log("  Month found:", monthMatch ? "✅ YES" : "❌ NO");

        console.log("\n" + "=".repeat(60));
        console.log("🎯 Overall Result:");
        if (nameFound && companyFound && yearMatch && monthMatch) {
            console.log("✅ OCR VERIFICATION WOULD PASS");
        } else {
            console.log("❌ OCR VERIFICATION WOULD FAIL");
            if (!nameFound) console.log("  - Student name not found");
            if (!companyFound) console.log("  - Company name not found");
            if (!yearMatch || !monthMatch) console.log("  - Date/period not found");
        }
        console.log("=".repeat(60));

    } catch (error) {
        console.error("❌ Error:", error.message);
        console.error(error);
    }
}

testOCR();
