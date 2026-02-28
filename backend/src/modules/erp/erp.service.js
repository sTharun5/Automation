const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

// Path to the mock ERP Excel file
const ERP_FILE_PATH = path.join(__dirname, '../../../../Mock_College_ERP.xlsx');

/**
 * Ensures the Mock ERP Excel file exists with some basic structure.
 */
const initErpFile = () => {
    if (!fs.existsSync(ERP_FILE_PATH)) {
        // Create a new workbook and worksheet
        const wb = xlsx.utils.book_new();
        // Initial columns: Roll No, Name
        const wsData = [
            ["Roll No", "Name"]
        ];
        const ws = xlsx.utils.aoa_to_sheet(wsData);
        xlsx.utils.book_append_sheet(wb, ws, "Attendance");
        xlsx.writeFile(wb, ERP_FILE_PATH);
        console.log(`[ERP INIT] Created new Mock ERP file at ${ERP_FILE_PATH}`);
    }
};

/**
 * Gets all dates between a start and end date (inclusive)
 */
const getDatesInRange = (startDate, endDate) => {
    const dates = [];
    let current = new Date(startDate);
    const end = new Date(endDate);

    // Reset times to midnight for safe comparison
    current.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    while (current <= end) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }
    return dates;
};

/**
 * Simulates a call to an external ERP API to sync "OD" attendance for a student.
 * Instead of a fake timeout, it physically writes to an Excel file.
 * 
 * @param {string} studentRollNo - The student's roll number (e.g., '21IT001')
 * @param {Date} startDate - Start date of the OD
 * @param {Date} endDate - End date of the OD
 * @param {string} trackerId - The tracker ID of the OD application
 * @returns {Promise<{success: boolean, message: string}>}
 */
exports.syncAttendanceToErp = async (studentRollNo, startDate, endDate, trackerId) => {
    try {
        console.log(`[ERP SYNC] Initiating attendance sync for Roll No: ${studentRollNo}, Tracker ID: ${trackerId}`);

        // 1. Ensure file exists
        initErpFile();

        // 2. Read Workbook
        const wb = xlsx.readFile(ERP_FILE_PATH);
        const sheetName = wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];

        // Convert sheet to array of arrays (AOA) to easily manipulate rows/columns
        let data = xlsx.utils.sheet_to_json(ws, { header: 1 });

        if (data.length === 0) {
            data = [["Roll No", "Name"]]; // Fallback header
        }

        const headers = data[0];

        // 3. Find or Create Student Row
        let studentRowIndex = data.findIndex(row => row[0] === studentRollNo);

        if (studentRowIndex === -1) {
            // Student doesn't exist in ERP yet, create them.
            // Fetch name from DB
            const student = await prisma.student.findUnique({ where: { rollNo: studentRollNo } });
            const newRow = new Array(headers.length).fill("");
            newRow[0] = studentRollNo;
            newRow[1] = student ? student.name : "Unknown Student";
            data.push(newRow);
            studentRowIndex = data.length - 1;
        }

        // 4. Mark "OD" for all dates in the range
        const datesToMark = getDatesInRange(startDate, endDate);

        datesToMark.forEach(dateObj => {
            // Format date as "YYYY-MM-DD"
            const dateStr = dateObj.toISOString().split('T')[0];

            // Ensure column exists
            let colIndex = headers.indexOf(dateStr);
            if (colIndex === -1) {
                headers.push(dateStr);
                colIndex = headers.length - 1;
                // Pad all existing rows to the new length
                data.forEach(row => {
                    while (row.length < headers.length) row.push("");
                });
            }

            // Mark OD!
            data[studentRowIndex][colIndex] = "OD";
        });

        // 5. Write back to file
        const newWs = xlsx.utils.aoa_to_sheet(data);
        wb.Sheets[sheetName] = newWs;
        xlsx.writeFile(wb, ERP_FILE_PATH);

        console.log(`[ERP SYNC] ✅ SUCCESS: Attendance marked as 'OD' in Excel for ${studentRollNo}`);
        return { success: true, message: `Attendance marked as OD in Mock_College_ERP.xlsx` };

    } catch (error) {
        console.error(`[ERP SYNC] ❌ FAILED: Errow writing to Excel - ${error.message}`);
        return { success: false, message: "Failed to update Excel ERP system." };
    }
};
