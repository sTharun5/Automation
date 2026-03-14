const xlsx = require("xlsx");
const prisma = require("../../config/db");

exports.exportODsToExcel = async (req, res) => {
  try {
    const ods = await prisma.od.findMany({
      include: {
        student: true,
        offer: {
          include: { company: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const data = ods.map(od => ({
      "Tracker ID": od.trackerId,
      "Student Name": od.student?.name || "N/A",
      "Roll No": od.student?.rollNo || "N/A",
      "Department": od.student?.department || "N/A",
      "Company": od.offer?.company?.name || "N/A",
      "Start Date": new Date(od.startDate).toLocaleDateString(),
      "End Date": new Date(od.endDate).toLocaleDateString(),
      "Duration (Days)": od.duration,
      "Status": od.status,
      "Applied On": new Date(od.createdAt).toLocaleDateString()
    }));

    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "OD Applications");

    const buffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });

    res.setHeader('Content-Disposition', 'attachment; filename="smart-od-records.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    return res.status(200).send(buffer);

  } catch (error) {
    console.error("EXCEL EXPORT ERROR:", error);
    return res.status(500).json({ message: "Failed to generate Excel file" });
  }
};
