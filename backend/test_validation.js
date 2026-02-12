const student = { rollNo: "7376222AD218" };
const file = { originalname: "7376222AD218-ITI-30.1.2026", fieldname: "aimFile" };
const expectedType = "ITI";
const startDate = "2026-01-30"; // Matches 30.01.2026

try {
    const originalName = file.originalname;
    // Logic from od.controller.js
    const nameWithoutExt = originalName.toLowerCase().endsWith(".pdf")
        ? originalName.slice(0, -4)
        : originalName;

    console.log(`[DEBUG] Validating File: ${originalName} -> ${nameWithoutExt}`);

    const regex = /^[A-Z0-9]+-(ITO|ITI)-\d{1,2}\.\d{1,2}\.\d{4}$/;

    if (!regex.test(nameWithoutExt)) {
        console.log(`[DEBUG] Regex Mismatch for ${nameWithoutExt}`);
        throw new Error("Regex failed");
    }

    const parts = nameWithoutExt.split("-");
    const fileRollNo = parts[0];
    const fileType = parts[1];
    const fileDate = parts[2];

    if (fileRollNo !== student.rollNo) {
        console.log(`[DEBUG] RollNo Mismatch: ${fileRollNo} != ${student.rollNo}`);
        throw new Error("RollNo failed");
    }

    if (fileType !== expectedType) {
        console.log(`[DEBUG] Type Mismatch: ${fileType} != ${expectedType}`);
        throw new Error("Type failed");
    }

    const today = new Date();
    const formatDate = (date) => {
        const d = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const y = date.getFullYear();
        return `${d}.${m}.${y}`;
    };

    const todayString = formatDate(today);
    const startString = formatDate(new Date(startDate));

    const normalizeDateString = (str) => {
        const [d, m, y] = str.split(".");
        return `${d.padStart(2, '0')}.${m.padStart(2, '0')}.${y}`;
    };

    const normalizedFileDate = normalizeDateString(fileDate);
    console.log(`[DEBUG] Date Check: File=${normalizedFileDate}, Today=${todayString}, Start=${startString}`);

    if (normalizedFileDate !== todayString && normalizedFileDate !== startString) {
        throw new Error("Date failed");
    }

    console.log("SUCCESS: Validation Passed!");

} catch (e) {
    console.error("FAILURE:", e.message);
}
