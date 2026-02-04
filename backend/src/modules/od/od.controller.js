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
      verificationDetails.company.found;
    // verificationDetails.dates.found; // ⚠️ DISABLED BY ADMIN REQUEST

    // Build summary message
    let summary = [];
    summary.push(verificationDetails.name.found ? "✅ Name: Found" : "❌ Name: Not Found");
    summary.push(verificationDetails.company.found ? "✅ Company: Found" : "❌ Company: Not Found");
    summary.push(verificationDetails.dates.found ? "✅ Joining Date: Found" : "⚠️ Joining Date: Not Found (Ignored)");

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
      studentId,
      industry,
      campusType,
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
    /* ===== VALIDATE FILENAMES & DETAILS ===== */
    const validationSteps = [];

    const addStep = (name, success, error = null) => {
      validationSteps.push({ name, success, error });
    };


    const validateDocument = (file, expectedType) => {
      let originalName = file.originalname.trim();

      // Step 1: Filename Format
      const nameWithoutExt = originalName.toLowerCase().endsWith(".pdf")
        ? originalName.slice(0, -4)
        : originalName;

      const regex = /^[A-Z0-9]+-(ITO|ITI)-\d{1,2}\.\d{1,2}\.\d{4}$/;
      if (!regex.test(nameWithoutExt)) {
        addStep(`${expectedType} Filename Format`, false, `Invalid format. Expected: <ROLL>-${expectedType}-<DATE>`);
        return false;
      }
      addStep(`${expectedType} Filename Format`, true);

      const parts = nameWithoutExt.split("-");
      const fileRollNo = parts[0];
      const fileType = parts[1];
      const fileDate = parts[2];

      // Step 2: Roll Number
      if (fileRollNo !== student.rollNo) {
        addStep(`${expectedType} Roll Number`, false, `Found ${fileRollNo}, expected ${student.rollNo}`);
        return false;
      }
      addStep(`${expectedType} Roll Number`, true);

      // Step 3: Type check
      if (fileType !== expectedType) {
        addStep(`${expectedType} Document Type`, false, `Found ${fileType}, expected ${expectedType}`);
        return false;
      }

      // Step 4: Date Check
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

      if (normalizedFileDate !== todayString && normalizedFileDate !== startString) {
        addStep(`${expectedType} Date Match`, false, `Date ${normalizedFileDate} must be Today (${todayString}) or Start Date (${startString})`);
        return false;
      }
      addStep(`${expectedType} Date Match`, true);

      return true;
    };

    try {
      validateDocument(req.files.aimFile[0], "ITI"); // Aim/Objective -> ITI
      validateDocument(req.files.offerFile[0], "ITO"); // Offer Letter -> ITO
    } catch (validationError) {
      return res.status(400).json({
        message: validationError.message
      });
    }

    /* ===== SINGLE ACTIVE/PENDING OD ENFORCEMENT ===== */
    const pendingStatuses = ["PENDING", "DOCS_VERIFIED", "MENTOR_APPROVED"];

    // Check for any incomplete application
    const existingPendingOD = await prisma.od.findFirst({
      where: {
        studentId: Number(studentId),
        status: { in: pendingStatuses }
      }
    });

    if (existingPendingOD) {
      return res.status(400).json({
        message: "You already have a pending/processing OD application. Please wait until it is finalized."
      });
    }

    // Check for an Active OD (Approved and currently ongoing)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeOD = await prisma.od.findFirst({
      where: {
        studentId: Number(studentId),
        status: "APPROVED",
        endDate: { gte: today } // End Date is in the future or today
      }
    });

    if (activeOD) {
      return res.status(400).json({
        message: "You currently have an Active OD. You cannot apply for a new one until the current one is completed."
      });
    }

    /* ===== OVERLAP CHECK (Double Check) ===== */
    const start = new Date(startDate);
    const end = new Date(endDate);

    const overlapping = await prisma.od.findFirst({
      where: {
        studentId: Number(studentId),
        status: "APPROVED", // Only check against other approved ones (though the check above should catch it)
        OR: [
          {
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
        message: "The selected dates overlap with another Approved OD."
      });
    }

    /* ===== PER OD LIMIT (60 DAYS) ===== */
    // Note: Global 60-day cap removed as per new requirement. 
    // Ensuring single OD duration does not exceed 60 days (handled in service or here).
    if (Number(duration) > 60) {
      return res.status(400).json({
        message: "Single OD duration cannot exceed 60 days."
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
      // Add OCR failure as a step
      const failedReasons = [];
      if (!ocrResult.verificationDetails.name.found) failedReasons.push("Student Name");
      if (!ocrResult.verificationDetails.company.found) failedReasons.push("Company Name");
      if (!ocrResult.verificationDetails.dates.found) failedReasons.push("Joining Date");

      validationSteps.push({
        name: "AI Content Verification",
        success: false,
        error: `Could not verify: ${failedReasons.join(", ")}`
      });

      // Delete uploaded files if verification fails to clean up
      try {
        fs.unlinkSync(aimFilePath);
        fs.unlinkSync(offerFilePath);
      } catch (e) {
        console.error("Failed to delete invalid files:", e);
      }

      return res.status(400).json({
        message: "Document verification incomplete",
        steps: validationSteps,
        verificationDetails: ocrResult.verificationDetails
      });
    }

    // OCR Success Step
    validationSteps.push({ name: "AI Content Verification", success: true });

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
        student: true,
        offer: {
          include: {
            company: true
          }
        }
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
    const validStatuses = ["APPROVED", "REJECTED", "PENDING", "DOCS_VERIFIED", "MENTOR_APPROVED"];
    if (!validStatuses.includes(status)) {
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
