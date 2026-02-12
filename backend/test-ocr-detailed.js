const fs = require("fs");
const pdf = require("pdf-parse");

/**
 * This script demonstrates the OCR verification process
 * used in the OD application
 */

async function verifyDocumentContent(filePath, studentName, companyName, startDateStr, endDateStr) {
    try {
        console.log("\n🔍 OCR VERIFICATION PROCESS");
        console.log("=".repeat(70));
        console.log("📄 File:", filePath);
        console.log("👤 Expected Student:", studentName);
        console.log("🏢 Expected Company:", companyName);
        console.log("📅 Expected Period:", startDateStr, "to", endDateStr);
        console.log("=".repeat(70));

        // Read PDF using PDFParse class
        const { PDFParse } = pdf;
        const dataBuffer = fs.readFileSync(filePath);
        const parser = new PDFParse({ data: dataBuffer });
        const data = await parser.getText();
        const text = data.text.toLowerCase().replace(/\s+/g, " ");

        console.log("\n📊 PDF Statistics:");
        console.log("  Pages:", data.numpages);
        console.log("  Characters:", data.text.length);
        console.log("\n📝 Full Extracted Text:");
        console.log("-".repeat(70));
        console.log(data.text);
        console.log("-".repeat(70));

        const results = {
            nameMatched: false,
            companyMatched: false,
            datesMatched: false,
            message: ""
        };

        // 1. Verify Student Name
        console.log("\n1️⃣ CHECKING STUDENT NAME");
        console.log("  Looking for:", studentName);
        const nameParts = studentName.toLowerCase().split(" ").filter(p => p.length > 2);
        console.log("  Name parts to check:", nameParts);

        const matchedParts = nameParts.filter(part => {
            const found = text.includes(part);
            console.log(`    - "${part}": ${found ? "✅ FOUND" : "❌ NOT FOUND"}`);
            return found;
        });

        results.nameMatched = matchedParts.length >= Math.min(nameParts.length, 2);
        console.log(`  Result: ${results.nameMatched ? "✅ PASS" : "❌ FAIL"}`);
        console.log(`  Matched ${matchedParts.length}/${nameParts.length} parts (need ${Math.min(nameParts.length, 2)})`);

        if (!results.nameMatched) {
            results.message = `Verification failed: Could not find student name "${studentName}" in the document.`;
            return results;
        }

        // 2. Verify Company Name
        console.log("\n2️⃣ CHECKING COMPANY NAME");
        console.log("  Looking for:", companyName);
        if (text.includes(companyName.toLowerCase())) {
            results.companyMatched = true;
            console.log("  Result: ✅ FOUND");
        } else {
            results.message = `Verification failed: Could not find company name "${companyName}" in the document.`;
            console.log("  Result: ❌ NOT FOUND");
            return results;
        }

        // 3. Verify Dates
        console.log("\n3️⃣ CHECKING DATES");
        const start = new Date(startDateStr);
        const end = new Date(endDateStr);

        const years = [start.getFullYear().toString(), end.getFullYear().toString()];
        const months = [
            start.toLocaleString("default", { month: "long" }).toLowerCase(),
            start.toLocaleString("default", { month: "short" }).toLowerCase(),
            end.toLocaleString("default", { month: "long" }).toLowerCase(),
            end.toLocaleString("default", { month: "short" }).toLowerCase()
        ];

        console.log("  Years to check:", years);
        const yearMatch = years.some(y => {
            const found = text.includes(y);
            console.log(`    - ${y}: ${found ? "✅ FOUND" : "❌ NOT FOUND"}`);
            return found;
        });

        console.log("  Months to check:", months);
        const monthMatch = months.some(m => {
            const found = text.includes(m);
            console.log(`    - ${m}: ${found ? "✅ FOUND" : "❌ NOT FOUND"}`);
            return found;
        });

        if (yearMatch && monthMatch) {
            results.datesMatched = true;
            console.log("  Result: ✅ PASS");
        } else {
            results.message = `Verification failed: Could not find matching dates/period in the document.`;
            console.log("  Result: ❌ FAIL");
            return results;
        }

        console.log("\n" + "=".repeat(70));
        console.log("🎉 FINAL RESULT: ✅ ALL CHECKS PASSED!");
        console.log("=".repeat(70));

        return results;

    } catch (error) {
        console.error("\n❌ OCR ERROR:", error.message);
        return {
            nameMatched: false,
            companyMatched: false,
            datesMatched: false,
            message: "Internal verification error."
        };
    }
}

// Test with a real file if it exists
async function runTest() {
    console.log("\n🧪 OCR VERIFICATION TEST SUITE");
    console.log("=".repeat(70));

    // Check if test PDF exists
    const testFile = process.argv[2] || "./uploads/offer-letter/sample.pdf";

    if (!fs.existsSync(testFile)) {
        console.log("\n⚠️  No PDF file found for testing.");
        console.log("\n📝 To test with a real PDF:");
        console.log("   node test-ocr-detailed.js <path-to-pdf>");
        console.log("\nExample:");
        console.log("   node test-ocr-detailed.js ./uploads/offer-letter/7376222AD218-ITO-30.1.2026.pdf");
        console.log("\n💡 Or place a PDF at:", testFile);
        console.log("\n" + "=".repeat(70));
        console.log("\n📚 OCR VERIFICATION LOGIC EXPLANATION:");
        console.log("=".repeat(70));
        console.log(`
The OCR verification process checks three things:

1. STUDENT NAME VERIFICATION
   - Splits the name into parts (ignoring words with ≤2 chars)
   - Checks if at least 2 parts (or all parts if < 2) are in the document
   - Example: "John Michael Smith" → checks "john", "michael", "smith"
   - Needs at least 2 of these to match

2. COMPANY NAME VERIFICATION
   - Looks for exact company name (case-insensitive)
   - Must be present in the document text

3. DATE/PERIOD VERIFICATION
   - Extracts year from start and end dates
   - Extracts month names (both long and short forms)
   - Checks if at least one year AND one month are mentioned
   - Example: "January 2026" or "Jan 2026" would match

All three checks must pass for the document to be accepted.
    `);
        console.log("=".repeat(70));
        return;
    }

    // Run actual verification
    const studentName = process.argv[3] || "Tharun AD";
    const companyName = process.argv[4] || "Test Company";
    const startDate = process.argv[5] || "2026-01-30";
    const endDate = process.argv[6] || "2026-05-30";

    const result = await verifyDocumentContent(
        testFile,
        studentName,
        companyName,
        startDate,
        endDate
    );

    console.log("\n📊 VERIFICATION RESULT OBJECT:");
    console.log(JSON.stringify(result, null, 2));
}

runTest();
