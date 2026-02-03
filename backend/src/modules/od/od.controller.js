const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const pdf = require("pdf-parse");
const prisma = new PrismaClient();
const notificationService = require("../notification/notification.service");

const generateTrackerId = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const generateActivityId = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "ACT-";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/* =====================================================
   HELPER: VERIFY PDF CONTENT (OCR)
===================================================== */
async function verifyDocumentContent(filePath, studentName, companyName, startDateStr, endDateStr) {
  try {
    const { PDFParse } = pdf;
    const dataBuffer = fs.readFileSync(filePath);
    const parser = new PDFParse({ data: dataBuffer });
    const data = await parser.getText();
    const text = data.text.toLowerCase().replace(/\s+/g, " ");

    // Initialize detailed results
    const verificationDetails = {
      name: {
        searched: studentName,
        found: false,
        matchedParts: [],
        totalParts: 0,
        requiredParts: 0
      },
      company: {
        searched: companyName,
        found: false
      },
      dates: {
        period: `${startDateStr} to ${endDateStr}`,
        found: false,
        yearMatched: false,
        monthMatched: false,
        yearsSearched: [],
        monthsSearched: [],
        yearsFound: [],
        monthsFound: []
      }
    };

    // 1. Verify Student Name
    const nameParts = studentName.toLowerCase().split(" ").filter(p => p.length > 2);
    verificationDetails.name.totalParts = nameParts.length;
    verificationDetails.name.requiredParts = Math.min(nameParts.length, 2);

    const matchedParts = nameParts.filter(part => text.includes(part));
    verificationDetails.name.matchedParts = matchedParts;
    verificationDetails.name.found = matchedParts.length >= Math.min(nameParts.length, 2);

    // 2. Verify Company Name
    verificationDetails.company.found = text.includes(companyName.toLowerCase());

    // 3. Verify Dates
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);

    const years = [start.getFullYear().toString(), end.getFullYear().toString()];
    const months = [
      start.toLocaleString("default", { month: "long" }).toLowerCase(),
      start.toLocaleString("default", { month: "short" }).toLowerCase(),
      end.toLocaleString("default", { month: "long" }).toLowerCase(),
      end.toLocaleString("default", { month: "short" }).toLowerCase()
    ];

    verificationDetails.dates.yearsSearched = [...new Set(years)];
    verificationDetails.dates.monthsSearched = [...new Set(months)];

    // Check which years and months were found
    verificationDetails.dates.yearsFound = years.filter(y => text.includes(y));
    verificationDetails.dates.monthsFound = months.filter(m => text.includes(m));

    verificationDetails.dates.yearMatched = verificationDetails.dates.yearsFound.length > 0;
    verificationDetails.dates.monthMatched = verificationDetails.dates.monthsFound.length > 0;
    verificationDetails.dates.found = verificationDetails.dates.yearMatched && verificationDetails.dates.monthMatched;

    // Determine overall success
    const allPassed = verificationDetails.name.found &&
      verificationDetails.company.found &&
      verificationDetails.dates.found;

    // Build summary message
    let summary = [];
    summary.push(verificationDetails.name.found ? "✅ Name: Found" : "❌ Name: Not Found");
    summary.push(verificationDetails.company.found ? "✅ Company: Found" : "❌ Company: Not Found");
    summary.push(verificationDetails.dates.found ? "✅ Joining Date: Found" : "❌ Joining Date: Not Found");

    return {
      success: allPassed,
      verificationDetails,
      summary: summary.join(" | "),
      message: allPassed ? "All verifications passed" : "Document verification incomplete - Please check the details below"
    };

  } catch (error) {
    console.error("OCR ERROR:", error);
    return {
      success: false,
      verificationDetails: null,
      message: "Internal verification error - Could not process PDF",
      error: error.message
    };
  }
}

/* =====================================================
   APPLY OD
===================================================== */
exports.applyOD = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      duration,
      offerId // ✅ New
    } = req.body;

    /* ===== BASIC VALIDATION ===== */
    if (
      !studentId ||
      !industry ||
      !campusType ||
      !startDate ||
      !endDate ||
      !duration ||
      !offerId
    ) {
      return res.status(400).json({
        message: "All required fields (including offer) must be filled"
      });
    }

    if (!req.files?.aimFile || !req.files?.offerFile) {
      return res.status(400).json({
        message: "Both documents are required"
      });
    }

    /* ===== VERIFY STUDENT EXISTS ===== */
    const student = await prisma.student.findUnique({
      where: { id: Number(studentId) }
    });

    if (!student) {
      return res.status(404).json({
        message: "Student not found"
      });
    }

    /* ===== VERIFY OFFER & COMPANY APPROVAL ===== */
    const offer = await prisma.offer.findUnique({
      where: { id: Number(offerId) },
      include: { company: true }
    });

    if (!offer || offer.studentId !== student.id) {
      return res.status(400).json({ message: "Invalid offer selection" });
    }

    if (!offer.company.isApproved) {
      return res.status(400).json({
        message: `OD cannot be approved for ${offer.company.name}. This company is not on the approved list.`
      });
    }

    // Use company name from the offer for OCR instead of the generic 'industry' dropdown
    const companyNameForOCR = offer.company.name;

    /* ===== VALIDATE FILENAMES ===== */
    const validateDocument = (file, expectedType) => {
      const originalName = file.originalname;
      const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf(".")) || originalName;

      // Regex: <ROLL_NO>-<OD_TYPE>-<D.M.YYYY> or <DD.MM.YYYY>
      const regex = /^[A-Z0-9]+-(ITO|ITI)-\d{1,2}\.\d{1,2}\.\d{4}$/;

      if (!regex.test(nameWithoutExt)) {
        throw new Error(
          `Invalid filename format for ${file.fieldname}. Expected format: <ROLL_NO>-${expectedType}-<DD.MM.YYYY> (e.g. ${student.rollNo}-${expectedType}-01.02.2024)`
        );
      }

      const parts = nameWithoutExt.split("-");
      const fileRollNo = parts[0];
      const fileType = parts[1];
      const fileDate = parts[2]; // This is what matched the \d.\d.\d regex

      // 1. Verify Roll No
      if (fileRollNo !== student.rollNo) {
        throw new Error(
          `Roll number in ${file.fieldname} filename (${fileRollNo}) does not match student roll number (${student.rollNo})`
        );
      }

      // 2. Verify OD Type
      if (fileType !== expectedType) {
        throw new Error(
          `Invalid OD Type in ${file.fieldname}. Expected ${expectedType}, found ${fileType}`
        );
      }

      // 3. Verify Date (Today OR Start Date)
      const today = new Date();
      const formatDate = (date) => {
        const d = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const y = date.getFullYear();
        return `${d}.${m}.${y}`;
      };

      const todayString = formatDate(today);
      const startString = formatDate(new Date(startDate));

      // Also handle case where user didn't use leading zeros in filename but we pad them in our strings
      // We can normalize the fileDate by splitting and re-joining with padding
      const normalizeDateString = (str) => {
        const [d, m, y] = str.split(".");
        return `${d.padStart(2, '0')}.${m.padStart(2, '0')}.${y}`;
      };

      const normalizedFileDate = normalizeDateString(fileDate);

      if (normalizedFileDate !== todayString && normalizedFileDate !== startString) {
        throw new Error(
          `Date in ${file.fieldname} filename (${fileDate}) must be either today's date (${todayString}) or the OD start date (${startString})`
        );
      }
    };

    try {
      validateDocument(req.files.aimFile[0], "ITI"); // Aim/Objective -> ITI
      validateDocument(req.files.offerFile[0], "ITO"); // Offer Letter -> ITO
    } catch (validationError) {
      return res.status(400).json({
        message: validationError.message
      });
    }

    /* ===== OVERLAP CHECK ===== */
    const start = new Date(startDate);
    const end = new Date(endDate);

    const overlapping = await prisma.od.findFirst({
      where: {
        studentId: Number(studentId),
        status: { in: ["PENDING", "APPROVED"] },
        OR: [
          {
            // New Overlaps Existing
            AND: [
              { startDate: { lte: end } },
              { endDate: { gte: start } }
            ]
          }
        ]
      }
    });

    if (overlapping) {
      return res.status(400).json({
        message: "You already have a Pending or Approved OD overlapping with these dates."
      });
    }

    /* ===== 60 DAY RULE (USING studentId) ===== */
    const used = await prisma.od.aggregate({
      where: {
        studentId: Number(studentId),
        status: "APPROVED"
      },
      _sum: {
        duration: true
      }
    });

    const usedDays = used._sum.duration || 0;

    if (usedDays + Number(duration) > 60) {
      return res.status(400).json({
        message: "OD limit exceeded. Maximum allowed is 60 days."
      });
    }

    /* ===== FILE PATHS ===== */
    const aimFilePath = req.files.aimFile[0].path;
    const offerFilePath = req.files.offerFile[0].path;

    /* ===== SMART OCR VERIFICATION ===== */
    const ocrResult = await verifyDocumentContent(
      offerFilePath,
      student.name,
      companyNameForOCR, // ✅ Use specific company
      startDate,
      endDate
    );

    if (!ocrResult.success) {
      // Delete uploaded files if verification fails to clean up
      try {
        fs.unlinkSync(aimFilePath);
        fs.unlinkSync(offerFilePath);
      } catch (e) {
        console.error("Failed to delete invalid files:", e);
      }

      return res.status(400).json({
        message: ocrResult.message || "Document verification failed. Please ensure you uploaded the correct offer letter.",
        verificationDetails: ocrResult.verificationDetails,
        summary: ocrResult.summary
      });
    }

    /* ===== SAVE OD ===== */
    const timeline = [
      {
        status: "PENDING",
        label: "Applied",
        time: new Date(),
        description: "OD application submitted by student."
      },
      {
        status: "DOCS_VERIFIED",
        label: "Documents Verified",
        time: new Date(),
        description: "AI Verification passed successfully. Activity ID generated."
      }
    ];

    const od = await prisma.od.create({
      data: {
        trackerId: generateTrackerId(),
        activityId: generateActivityId(),
        studentId: Number(studentId),
        offerId: Number(offerId), // ✅ Link to offer
        type: "INTERNSHIP",
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        duration: Number(duration),
        proofFile: aimFilePath,
        offerFile: offerFilePath,
        status: "DOCS_VERIFIED", // Skip PENDING if OCR passed
        verificationDetails: ocrResult.verificationDetails,
        timeline: timeline
      }
    });

    // Notify Student and Mentor
    await notificationService.createNotification(
      student.email,
      "OD Documents Verified",
      `Your OD request (${od.trackerId}) has passed AI verification. Activity ID: ${od.activityId}. Pending Mentor Approval.`,
      "SUCCESS"
    );

    if (student.mentorId) {
      const mentor = await prisma.faculty.findUnique({ where: { id: student.mentorId } });
      if (mentor) {
        await notificationService.createNotification(
          mentor.email,
          "New OD Approval Pending",
          `Student ${student.name} (${student.rollNo}) has applied for OD. Review required.`,
          "INFO"
        );
      }
    }

    return res.status(201).json({
      message: "OD applied successfully",
      od
    });

  } catch (error) {
    console.error("OD APPLY ERROR:", error);
    return res.status(500).json({
      message: "Failed to apply OD"
    });
  }
};

/* =====================================================
   GET OD BY ID
===================================================== */
exports.getOdById = async (req, res) => {
  try {
    const { id } = req.params;

    const od = await prisma.od.findUnique({
      where: { id: Number(id) },
      include: {
        student: true // ✅ gives rollNo, name, email safely
      }
    });

    if (!od) {
      return res.status(404).json({
        message: "OD not found"
      });
    }

    return res.status(200).json(od);

  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch OD"
    });
  }
};

/* =====================================================
   UPDATE OD STATUS (FACULTY/ADMIN)
===================================================== */
exports.updateOdStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const email = req.user.email;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    // Validate Status
    if (!["APPROVED", "REJECTED", "PENDING"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Check if Faculty or Admin
    const faculty = await prisma.faculty.findUnique({ where: { email } });
    const admin = await prisma.admin.findUnique({ where: { email } });

    if (!faculty && !admin) {
      return res.status(403).json({ message: "Access denied. Faculty or Admin only." });
    }

    // Check if OD exists
    const od = await prisma.od.findUnique({
      where: { id: Number(id) },
      include: { student: true }
    });
    if (!od) {
      return res.status(404).json({ message: "OD not found" });
    }

    // POLICY: If OD is already APPROVED, only ADMIN can change it (Revoke/Update)
    if (od.status === "APPROVED") {
      if (!admin) { // If not admin (i.e., is faculty)
        return res.status(403).json({
          message: "Only Administrators can revoke or modify an already Approved OD."
        });
      }
    }

    // Update Timeline
    const currentTimeline = Array.isArray(od.timeline) ? od.timeline : [];
    const newEvent = {
      status,
      label: status.replace("_", " ").toLowerCase(),
      time: new Date(),
      description: `Status updated to ${status} by ${req.user.role}.`
    };

    // Update OD
    const updatedOd = await prisma.od.update({
      where: { id: Number(id) },
      data: {
        status,
        timeline: [...currentTimeline, newEvent]
      }
    });

    // Notify Student
    if (od.student) {
      await notificationService.createNotification(
        od.student.email,
        "OD Status Updated",
        `Your OD request (${od.trackerId}) has been ${status.replace("_", " ").toLowerCase()}.`,
        status.includes("APPROVED") ? "SUCCESS" : "ERROR"
      );
    }

    return res.status(200).json({
      message: "OD status updated successfully",
      od: updatedOd
    });

  } catch (error) {
    console.error("UPDATE OD STATUS ERROR:", error);
    return res.status(500).json({
      message: "Failed to update OD status"
    });
  }
};

/* =====================================================
   GET ODs FOR MENTOR
===================================================== */
exports.getMentorODs = async (req, res) => {
  try {
    const email = req.user.email;
    const faculty = await prisma.faculty.findUnique({
      where: { email },
      include: {
        students: {
          include: {
            ods: {
              where: { status: { in: ["PENDING", "DOCS_VERIFIED", "MENTOR_APPROVED"] } },
              orderBy: { createdAt: "desc" },
              include: { student: true }
            }
          }
        }
      }
    });

    if (!faculty) {
      return res.status(403).json({ message: "Faculty record not found" });
    }

    // Flatten ODs from all mentored students
    const ods = faculty.students.flatMap(s => s.ods);

    return res.json(ods);

  } catch (error) {
    console.error("GET MENTOR ODs ERROR:", error);
    return res.status(500).json({ message: "Failed to fetch ODs" });
  }
};

/* =====================================================
   GET ODs BY STUDENT (ADMIN ONLY)
===================================================== */
exports.getStudentODs = async (req, res) => {
  try {
    const { studentId } = req.params;
    const email = req.user.email;

    // Verify Admin OR Faculty
    const admin = await prisma.admin.findUnique({ where: { email } });
    const faculty = await prisma.faculty.findUnique({ where: { email } });

    if (!admin && !faculty) {
      return res.status(403).json({ message: "Access denied" });
    }

    const ods = await prisma.od.findMany({
      where: { studentId: Number(studentId) },
      orderBy: { createdAt: "desc" }
    });

    return res.json(ods);

  } catch (error) {
    console.error("GET STUDENT ODs ERROR:", error);
    return res.status(500).json({ message: "Failed to fetch ODs" });
  }
};

/* =====================================================
   GET MY ODs (STUDENT)
 ===================================================== */
/* =====================================================
   GET MY ODs (STUDENT)
 ===================================================== */
exports.getMyODs = async (req, res) => {
  try {
    const email = req.user.email;
    const student = await prisma.student.findUnique({ where: { email } });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const ods = await prisma.od.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: "desc" },
      include: {
        offer: {
          include: { company: true }
        },
        event: true
      }
    });

    // Map to include company name property if relation exists (or event name)
    const mOds = ods.map(o => ({
      ...o,
      company: o.offer?.company?.name || o.event?.name || "Unknown"
    }));

    return res.json(mOds);

  } catch (error) {
    console.error("GET MY ODs ERROR:", error);
    return res.status(500).json({ message: "Failed to fetch ODs" });
  }
};
