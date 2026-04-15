const fs = require("fs");
const pdf = require("pdf-parse");
const prisma = require("../../config/db");
const notificationService = require("../notification/notification.service");
const sendEmail = require("../../utils/sendEmail");
const { syncAttendanceToErp } = require("../erp/erp.service");
const { authenticator } = require('otplib'); // Add this for QR Verification

authenticator.options = { step: 30 };

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
/* =====================================================
   HELPER: BUILD DATE VARIANTS FOR MATCHING
   Generates multiple string representations of a date
   to robustly search inside PDF text.
===================================================== */
function buildDateVariants(date) {
  const d = String(date.getDate()).padStart(2, "0");
  const dNoZero = String(date.getDate());
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear().toString();
  const monthLong = date.toLocaleString("default", { month: "long" }).toLowerCase();
  const monthShort = date.toLocaleString("default", { month: "short" }).toLowerCase();

  return [
    `${d}/${m}/${y}`,           // 25/03/2026
    `${d}-${m}-${y}`,           // 25-03-2026
    `${d}.${m}.${y}`,           // 25.03.2026
    `${dNoZero}/${m}/${y}`,     // 5/03/2026
    `${dNoZero}-${m}-${y}`,     // 5-03-2026
    `${dNoZero}.${m}.${y}`,     // 5.03.2026
    `${d} ${monthLong} ${y}`,   // 25 march 2026
    `${dNoZero} ${monthLong} ${y}`, // 5 march 2026
    `${monthLong} ${d}, ${y}`,  // march 25, 2026
    `${monthLong} ${dNoZero}, ${y}`, // march 5, 2026
    `${d} ${monthShort} ${y}`,  // 25 mar 2026
    `${dNoZero} ${monthShort} ${y}`, // 5 mar 2026
    `${monthShort} ${d}, ${y}`, // mar 25, 2026
    `${monthShort} ${dNoZero}, ${y}`, // mar 5, 2026
  ];
}

async function verifyDocumentContent(filePath, studentName, studentRollNo, companyName, startDateStr, endDateStr, options = { checkRollNo: true, checkCompany: true }) {
  try {
    const dataBuffer = await fs.promises.readFile(filePath); // async — no longer blocks event loop
    const data = await pdf(dataBuffer); // pdf-parse exports a function directly, not a class
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
        monthsFound: [],
        // ── NEW: strict per-date matching ──
        startDateMatched: false,
        endDateMatched: false,
        startDateSearched: startDateStr,
        endDateSearched: endDateStr,
        startDateVariantsFound: [],
        endDateVariantsFound: []
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
    if (options.checkCompany) {
      verificationDetails.company.found = text.includes(companyName.toLowerCase());
    } else {
      verificationDetails.company.found = true; // Skip check
    }

    // 2.1 Verify Roll Number & Normalized
    if (options.checkRollNo) {
      const normalizedText = text.replace(/\s+/g, ""); // Remove all spaces
      const normalizedRollNo = studentRollNo.toLowerCase().replace(/\s+/g, "");

      const rollNoFound = normalizedText.includes(normalizedRollNo);

      verificationDetails.rollNo = {
        searched: studentRollNo,
        found: rollNoFound
      };
    } else {
      verificationDetails.rollNo = {
        searched: studentRollNo,
        found: true // Skip check
      };
    }

    // 3. Verify Dates — legacy year/month check (kept for backward compat)
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

    verificationDetails.dates.yearsFound = years.filter(y => text.includes(y));
    verificationDetails.dates.monthsFound = months.filter(m => text.includes(m));

    verificationDetails.dates.yearMatched = verificationDetails.dates.yearsFound.length > 0;
    verificationDetails.dates.monthMatched = verificationDetails.dates.monthsFound.length > 0;
    verificationDetails.dates.found = verificationDetails.dates.yearMatched && verificationDetails.dates.monthMatched;

    // 3.1 ── NEW: Strict Start Date & End Date extraction and matching ──
    // Build all recognisable string forms of the provided dates and search for them
    const startVariants = buildDateVariants(start);
    const endVariants   = buildDateVariants(end);

    const foundStartVariants = startVariants.filter(v => text.includes(v));
    const foundEndVariants   = endVariants.filter(v => text.includes(v));

    verificationDetails.dates.startDateVariantsFound = foundStartVariants;
    verificationDetails.dates.endDateVariantsFound   = foundEndVariants;
    verificationDetails.dates.startDateMatched = foundStartVariants.length > 0;
    verificationDetails.dates.endDateMatched   = foundEndVariants.length > 0;

    // Both dates must be present in the document for a strict date match
    const strictDatesMatched =
      verificationDetails.dates.startDateMatched &&
      verificationDetails.dates.endDateMatched;

    // Determine overall success — dates are now part of the pass criteria
    const allPassed =
      verificationDetails.name.found &&
      verificationDetails.company.found &&
      verificationDetails.rollNo.found &&
      strictDatesMatched; // ✅ Strict date match enforced

    // Build summary message
    let summary = [];
    summary.push(verificationDetails.name.found ? "✅ Name: Found" : "❌ Name: Not Found");
    if (options.checkRollNo) summary.push(verificationDetails.rollNo.found ? "✅ Roll No: Found" : "❌ Roll No: Not Found");
    if (options.checkCompany) summary.push(verificationDetails.company.found ? "✅ Company: Found" : "❌ Company: Not Found");
    summary.push(
      verificationDetails.dates.startDateMatched
        ? `✅ Start Date (${startDateStr}): Found in document`
        : `❌ Start Date (${startDateStr}): NOT found — date mismatch`
    );
    summary.push(
      verificationDetails.dates.endDateMatched
        ? `✅ End Date (${endDateStr}): Found in document`
        : `❌ End Date (${endDateStr}): NOT found — date mismatch`
    );

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
   SCAN INTERNAL OD (QR CODE Auto-Approval)
===================================================== */
exports.scanInternalOD = async (req, res) => {
  try {
    const { studentId, qrPayload, otp } = req.body;

    if (!studentId || (!qrPayload && !otp)) {
      return res.status(400).json({ message: "Student ID and either QR data or OTP required." });
    }

    let event = null;
    let eventId = null;
    let isValidToken = false;

    // --- Path A: QR Payload Provided ---
    if (qrPayload) {
      // Payload Format: SMART_OD_QR::eventId::token
      const parts = qrPayload.split("::");
      if (parts.length !== 3 || parts[0] !== "SMART_OD_QR") {
        return res.status(400).json({ message: "Invalid QR Code format. Please scan a valid Smart OD Internal Event code." });
      }

      eventId = parseInt(parts[1], 10);
      const token = parts[2];

      event = await prisma.event.findUnique({ where: { id: eventId } });
      if (!event || !event.isInternal || event.status !== "ACTIVE") {
        return res.status(404).json({ message: "Active Internal Event not found for this QR." });
      }

      isValidToken = authenticator.verify({ token, secret: event.qrSecretKey });
    }
    // --- Path B: OTP Provided (Sweeping logic) ---
    else if (otp) {
      if (otp.length !== 6) return res.status(400).json({ message: "Invalid OTP format." });

      // Find all active internal events
      const activeEvents = await prisma.event.findMany({
        where: { isInternal: true, status: "ACTIVE" }
      });

      // Test the OTP against each secret until we find the event
      for (const ev of activeEvents) {
        if (authenticator.verify({ token: otp, secret: ev.qrSecretKey })) {
          event = ev;
          eventId = ev.id;
          isValidToken = true;
          break;
        }
      }

      if (!event) {
        return res.status(400).json({ message: "Invalid or expired Venue Code." });
      }
    }

    // Validate Event Dates (ensure it hasn't expired)
    const now = new Date();
    if (now > event.endDate) {
      return res.status(400).json({ message: "This event has already concluded." });
    }

    // Temporal Security constraint check from auth (QR or OTP)
    if (!isValidToken) {
      return res.status(400).json({
        message: "Code expired or invalid. Please scan or enter the live code again."
      });
    }

    // 3. Prevent unauthorized scanning (Enforce PROVISIONAL mapping)
    const existingOD = await prisma.od.findFirst({
      where: {
        studentId: Number(studentId),
        eventId: event.id
      }
    });

    if (!existingOD) {
      return res.status(403).json({
        message: "Unauthorized. You are not on the pre-approved roster for this event. Please contact the coordinator."
      });
    }

    if (existingOD.status === "APPROVED") {
      return res.status(400).json({ message: "You have already registered attendance for this event." });
    }

    if (existingOD.status !== "PROVISIONAL") {
      return res.status(400).json({ message: `Cannot authorize check-in. Current status is ${existingOD.status}.` });
    }

    // 4. Check Internal Hours Limit
    const student = await prisma.student.findUnique({ where: { id: Number(studentId) } });
    if (!student) return res.status(404).json({ message: "Student not found" });

    // Assuming a 40-hour limit per semester for internal events
    const INTERNAL_HOURS_LIMIT = 40;
    if (student.internalHoursUsed + event.allocatedHours > INTERNAL_HOURS_LIMIT) {
      return res.status(400).json({
        message: `Applying would exceed internal OD limit. You have ${INTERNAL_HOURS_LIMIT - student.internalHoursUsed} hours remaining, but this event requires ${event.allocatedHours} hours.`
      });
    }

    // 5. Upgrade PROVISIONAL to APPROVED
    const updatedTimeline = [...(existingOD.timeline || []), {
      status: "APPROVED",
      label: "Venue Verified",
      time: new Date(),
      description: `Student successfully scanned Live QR/OTP at the venue. Deducted ${event.allocatedHours} hours.`
    }];

    const od = await prisma.$transaction(async (tx) => {
      // Deduct hours
      await tx.student.update({
        where: { id: student.id },
        data: { internalHoursUsed: student.internalHoursUsed + event.allocatedHours }
      });

      // Update existing OD record
      return await tx.od.update({
        where: { id: existingOD.id },
        data: {
          status: "APPROVED",
          timeline: updatedTimeline,
          erpSyncStatus: "PENDING",
          remarks: `Attended Internal Event: ${event.name} (Verified Hybrid)`
        }
      });
    });

    // Notify Student
    await notificationService.createNotification(
      student.email,
      "Internal OD Approved",
      `Attendance verified for ${event.name}. OD (${od.trackerId}) auto-approved.`,
      "SUCCESS"
    );

    // Sync to ERP async
    syncAttendanceToErp(student.rollNo, od.startDate, od.endDate, od.trackerId)
      .then(async (result) => {
        if (result.success) await prisma.od.update({ where: { id: od.id }, data: { erpSyncStatus: "SYNCED" } });
      }).catch(e => console.error("ERP sync fail", e));


    return res.status(201).json({
      message: "Attendance verified and OD approved successfully!",
      od
    });

  } catch (error) {
    console.error("SCAN INTERNAL ERROR:", error);
    return res.status(500).json({ message: "Failed to process QR Code scan." });
  }
};

/* =====================================================
   APPLY OD (External Internships)
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

    /* ===== CHECK INTERNSHIP REPORT REQUIREMENT ===== */
    // 1. Find Completed ODs that do NOT have an APPROVED report
    const today = new Date();
    const pendingReports = await prisma.od.findMany({
      where: {
        studentId: Number(studentId),
        status: "APPROVED",
        endDate: { lt: today }, // Completed
        OR: [
          { report: { is: null } },
          { report: { status: { not: "APPROVED" } } }
        ]
      },
      select: {
        id: true,
        trackerId: true,
        endDate: true,
        offer: { select: { company: { select: { name: true } } } }
      }
    });

    if (pendingReports.length > 0) {
      return res.status(403).json({
        message: "Internship Report Required",
        details: "You have completed OD(s) that require an Internship Report. Please submit reports for the following before applying for a new OD.",
        pendingODs: pendingReports // Send list to frontend
      });
    }

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
        message: "All fields are required: studentId, industry, campusType, startDate, endDate, duration, offerId"
      });
    }

    /* ===== CHECK FOR EXAM CONFLICTS (New) ===== */
    const overlapEvents = await prisma.calendarEvent.findMany({
      where: {
        type: "EXAM", // Only block Exams
        OR: [
          {
            startDate: { lte: new Date(endDate) },
            endDate: { gte: new Date(startDate) }
          }
        ]
      }
    });

    if (overlapEvents.length > 0) {
      const conflict = overlapEvents[0];
      return res.status(400).json({
        message: `Evaluation/Exam Conflict: "${conflict.title}". OD cannot be applied during this period.`
      });
    }

    if (!req.files?.aimFile || !req.files?.offerFile) {
      return res.status(400).json({
        message: "Both documents are required"
      });
    }

    /* ===== DATE VALIDATION ===== */
    const validationToday = new Date();
    validationToday.setHours(0, 0, 0, 0);
    const validationStart = new Date(startDate);

    // Allow today, but not yesterday (Backdating prevented)
    if (validationStart < validationToday) {
      return res.status(400).json({
        message: "OD Start Date cannot be in the past. It must be today or a future date."
      });
    }

    // New Check: Start Date cannot be after End Date
    const validationEnd = new Date(endDate);
    if (validationStart > validationEnd) {
      return res.status(400).json({
        message: "OD Start Date cannot be after End Date."
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

    /* ===== VALIDATE FILENAMES & DETAILS ===== */
    const validationSteps = [];


    const validateDocument = (file, expectedType) => {
      let originalName = file.originalname.trim();

      // Step 1: Filename Format
      const nameWithoutExt = originalName.toLowerCase().endsWith(".pdf")
        ? originalName.slice(0, -4)
        : originalName;

      // Strict Format: ROLL-TYPE-DD.MM.YYYY
      const regex = /^[A-Z0-9]+-(ITO|ITI)-\d{1,2}\.\d{1,2}\.\d{4}$/;

      if (!regex.test(nameWithoutExt)) {
        throw new Error(`Invalid filename format: ${originalName}. Expected: ${student.rollNo}-${expectedType}-DD.MM.YYYY.pdf`);
      }

      const parts = nameWithoutExt.split("-");
      const fileRollNo = parts[0];
      const fileType = parts[1];
      let fileDate = parts[2];

      // Normalize date separator to dot
      fileDate = fileDate.replace(/[-/]/g, ".");

      // Step 2: Roll Number
      if (fileRollNo !== student.rollNo) {
        throw new Error(`Filename Roll No mismatch: Found ${fileRollNo}, expected ${student.rollNo}`);
      }

      // Step 3: Type check
      if (fileType !== expectedType) {
        throw new Error(`Filename Type mismatch: Found ${fileType}, expected ${expectedType} (Aim=ITI, Offer=ITO)`);
      }

      // Step 4: Date Check
      const checkToday = new Date();
      checkToday.setHours(0, 0, 0, 0);

      const [day, month, year] = fileDate.split(".").map(Number);
      const parsedFileDate = new Date(year, month - 1, day); // Month is 0-indexed

      if (parsedFileDate.getTime() !== checkToday.getTime()) {
        const formatDate = (date) => {
          const d = String(date.getDate()).padStart(2, '0');
          const m = String(date.getMonth() + 1).padStart(2, '0');
          const y = date.getFullYear();
          return `${d}.${m}.${y}`;
        };
        const todayStr = formatDate(checkToday);

        throw new Error(`Filename date ${fileDate} must be strictly today (${todayStr}).`);
      }

      // Validation Passed
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
    const todayActive = new Date();
    todayActive.setHours(0, 0, 0, 0);

    const activeOD = await prisma.od.findFirst({
      where: {
        studentId: Number(studentId),
        status: "APPROVED",
        endDate: { gte: todayActive } // End Date is in the future or today
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
    // 1. Verify AIM/OBJECTIVE (ITI) -> Strict Roll No Check
    const aimResult = await verifyDocumentContent(
      aimFilePath,
      student.name,
      student.rollNo,
      companyNameForOCR,
      startDate,
      endDate,
      { checkRollNo: true, checkCompany: false, docType: "AIM/ITI" }
    );

    let ocrFailed = false;
    let fallbackReasons = [];

    if (!aimResult.success) {
      ocrFailed = true;
      if (aimResult.verificationDetails) {
        if (!aimResult.verificationDetails.name?.found) fallbackReasons.push("Student Name (in Aim/ITI File)");
        if (!aimResult.verificationDetails.rollNo?.found) fallbackReasons.push("Roll No (in Aim/ITI File)");
        // ✅ NEW: Strict date mismatch reporting for ITI
        if (!aimResult.verificationDetails.dates?.startDateMatched)
          fallbackReasons.push(`Start Date (${startDate}) not found in Aim/ITI File — date mismatch`);
        if (!aimResult.verificationDetails.dates?.endDateMatched)
          fallbackReasons.push(`End Date (${endDate}) not found in Aim/ITI File — date mismatch`);
      } else {
        fallbackReasons.push(aimResult.message || "Aim PDF Parsing Error");
      }
    }

    // 2. Verify OFFER LETTER (ITO) -> Skip Roll No, Strict Company
    const offerResult = await verifyDocumentContent(
      offerFilePath,
      student.name,
      student.rollNo,
      companyNameForOCR,
      startDate,
      endDate,
      { checkRollNo: false, checkCompany: true, docType: "OFFER/ITO" }
    );

    if (!offerResult.success) {
      ocrFailed = true;
      if (offerResult.verificationDetails) {
        if (!offerResult.verificationDetails.name?.found) fallbackReasons.push("Student Name (in Offer/ITO Letter)");
        if (!offerResult.verificationDetails.company?.found) fallbackReasons.push("Company Name (in Offer/ITO Letter)");
        // ✅ NEW: Strict date mismatch reporting for ITO
        if (!offerResult.verificationDetails.dates?.startDateMatched)
          fallbackReasons.push(`Start Date (${startDate}) not found in Offer/ITO Letter — date mismatch`);
        if (!offerResult.verificationDetails.dates?.endDateMatched)
          fallbackReasons.push(`End Date (${endDate}) not found in Offer/ITO Letter — date mismatch`);
      } else {
        fallbackReasons.push(offerResult.message || "Offer PDF Parsing Error");
      }
    }



    /* ===== SAVE OD ===== */
    const timeline = [
      {
        status: "PENDING",
        label: "Applied",
        time: new Date(),
        description: "OD application submitted by student."
      }
    ];

    if (!ocrFailed) {
      timeline.push({
        status: "DOCS_VERIFIED",
        label: "Documents Verified",
        time: new Date(),
        description: "AI Verification passed successfully. Activity ID generated."
      });
    } else {
      timeline.push({
        status: "PENDING",
        label: "AI Verification Incomplete",
        time: new Date(),
        description: `Automated OCR verification failed: ${fallbackReasons.join(", ")}. Forwarded to Mentor for manual review of documents.`
      });
    }

    const odStatus = ocrFailed ? "PENDING" : "DOCS_VERIFIED";

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
        status: odStatus,
        verificationDetails: {
          ...(offerResult.verificationDetails || {}),
          rollNo: aimResult.verificationDetails?.rollNo || null,
          ocrFailed,
          fallbackReasons
        },
        timeline: timeline
      }
    });

    // Notify Student and Mentor
    await notificationService.createNotification(
      student.email,
      ocrFailed ? "OD Application Submitted" : "OD Documents Verified",
      ocrFailed 
        ? `Your OD request (${od.trackerId}) is pending Mentor review due to AI verification failure.` 
        : `Your OD request (${od.trackerId}) has passed AI verification. Activity ID: ${od.activityId}. Pending Mentor Approval.`,
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

        // Send Email Notification to Mentor
        try {
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px;">
              <h2 style="color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px;">New OD Approval Request</h2>
              <p>Dear Faculty,</p>
              <p>Your mentee <strong>${student.name}</strong> (${student.rollNo}) has submitted an OD application that has successfully passed initial Document AI Verification.</p>
              <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #10b981; border-radius: 4px; margin: 20px 0;">
                <p style="margin: 0 0 8px 0;"><strong>Company:</strong> ${companyNameForOCR}</p>
                <p style="margin: 0 0 8px 0;"><strong>Duration:</strong> ${duration} Days</p>
                <p style="margin: 0;"><strong>Activity ID:</strong> ${od.activityId}</p>
              </div>
              <p>Please log in to the SMART OD Portal to review and approve this application.</p>
              <p style="font-size: 12px; color: #64748b; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px;">This is an automated message from the BIP SMART OD Automation System.</p>
            </div>
          `;
          await sendEmail(
            mentor.email,
            "Action Required: New Student OD Application",
            emailHtml
          );
        } catch (emailErr) {
          console.error("Failed to send mentor email:", emailErr);
        }
      }
    }

    return res.status(201).json({
      message: ocrFailed ? "OD applied but AI verification requires manual review" : "OD applied successfully",
      od,
      ocrFailed,
      verificationDetails: od.verificationDetails
    });

  } catch (error) {
    console.error("OD APPLY ERROR:", error);
    return res.status(500).json({
      message: "Failed to apply OD",
      error: error.message,
      stack: error.stack
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
        report: true,
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
   VERIFY DIGITAL GATE PASS (SUBJECT TEACHER SCAN)
===================================================== */
exports.verifyGatePass = async (req, res) => {
  try {
    const { odId } = req.body;
    const facultyEmail = req.user.email; // Scanned by a faculty member

    if (!odId) {
      return res.status(400).json({ message: "Scan Error: Missing OD Payload." });
    }

    // 1. Authenticate Scanner
    const faculty = await prisma.faculty.findUnique({ where: { email: facultyEmail } });
    if (!faculty) {
      return res.status(403).json({ message: "Access Denied: Only Staff can verify Gate Passes." });
    }

    // 2. Fetch the OD
    const od = await prisma.od.findUnique({
      where: { id: parseInt(odId) },
      include: { student: true, event: true }
    });

    if (!od) {
      return res.status(404).json({ message: "OD Record not found from this Pass." });
    }

    // 3. Verify it is actually an Internal Event Gate Pass
    if (od.type !== "INTERNAL" || !od.eventId) {
      return res.status(400).json({ message: "Invalid Pass: Not an Internal Event OD." });
    }

    // 3.5. Expiry Check: Has the event ended?
    const now = new Date();
    if (now > new Date(od.event.endDate)) {
      const timeline = od.timeline || [];
      timeline.push({
        status: "REJECTED",
        label: "Gate Pass Expired",
        time: new Date(),
        description: "Event ended without venue check-in. Pass auto-cancelled."
      });

      // Refund hours & reject the OD
      await prisma.$transaction([
        prisma.od.update({
          where: { id: od.id },
          data: { status: "REJECTED", timeline }
        }),
        prisma.student.update({
          where: { id: od.studentId },
          data: {
            internalHoursUsed: Math.max(0, od.student.internalHoursUsed - od.event.allocatedHours)
          }
        })
      ]);

      return res.status(400).json({
        message: "Pass Expired: The event has already concluded. This Gate Pass is no longer valid."
      });
    }

    // 4. Validate State (Must be PROVISIONAL)
    if (od.status !== "PROVISIONAL") {
      return res.status(400).json({
        message: `Pass Invalid: Current status is ${od.status}. Student is either already checked in or not registered.`
      });
    }

    // 5. Check if already authorized by THIS specific teacher to prevent duplicate scans by same person
    const timeline = od.timeline || [];
    const scannerId = faculty.facultyId;
    const alreadyAuthorizedByMe = timeline.some(t =>
      t.label === "Gate Pass Authorized" &&
      t.description.includes(`(${scannerId})`)
    );

    if (alreadyAuthorizedByMe) {
      return res.status(400).json({ message: `You have already authorized this pass for ${od.student.name}.` });
    }

    // 6. Log the Authorization
    timeline.push({
      status: "PROVISIONAL",
      label: "Gate Pass Authorized",
      time: new Date(),
      description: `Class exit authorized by Prof. ${faculty.name} (${faculty.facultyId})`
    });

    await prisma.od.update({
      where: { id: od.id },
      data: { timeline } // It stays PROVISIONAL until the final venue scan!
    });

    res.status(200).json({
      message: "Gate Pass Verified. Student is authorized to leave for the event.",
      student: { name: od.student.name, rollNo: od.student.rollNo },
      event: { name: od.event.name }
    });

  } catch (error) {
    console.error("Gate Pass Verification Error:", error);
    res.status(500).json({ message: "Failed to verify Digital Gate Pass." });
  }
};

/* =====================================================
   UPDATE OD STATUS (FACULTY/ADMIN)
===================================================== */
exports.updateOdStatus = async (req, res) => {
  try {
    const { id } = req.params;
    let { status, remarks } = req.body; // ✅ Accepted remarks
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

    // SIMPLIFIED WORKFLOW: Mentor Approval = Final Approval
    if (faculty && status === "MENTOR_APPROVED") {
      status = "APPROVED"; // Auto-promote to Final Approved
    }

    // ✅ CONFLICT CHECK FOR APPROVAL (New)
    if (status === "APPROVED") {
      const overlapEvents = await prisma.calendarEvent.findMany({
        where: {
          type: "EXAM",
          OR: [
            {
              startDate: { lte: od.endDate },
              endDate: { gte: od.startDate }
            }
          ]
        }
      });

      if (overlapEvents.length > 0) {
        return res.status(400).json({
          message: `Cannot approve OD. Conflict with Exam: "${overlapEvents[0].title}"`
        });
      }
    }

    // Update Timeline
    const currentTimeline = Array.isArray(od.timeline) ? od.timeline : [];
    const newEvent = {
      status,
      label: status.replace("_", " ").toLowerCase(),
      time: new Date(),
      description: `Status updated to ${status} by ${req.user.role}. ${remarks ? `Remarks: ${remarks}` : ""}`
    };

    // Update OD
    const updatedOd = await prisma.od.update({
      where: { id: Number(id) },
      data: {
        status,
        timeline: [...currentTimeline, newEvent]
      },
      include: { student: true }
    });

    // Handle ERP Sync asynchronously if Approved
    if (status === "APPROVED") {
      // Fire and forget ERP sync attempt
      syncAttendanceToErp(
        updatedOd.student.rollNo,
        updatedOd.startDate,
        updatedOd.endDate,
        updatedOd.trackerId
      ).then(async (result) => {
        try {
          await prisma.od.update({
            where: { id: updatedOd.id },
            data: { erpSyncStatus: result.success ? "SYNCED" : "FAILED" }
          });

        } catch (dbErr) {
          console.error("Failed to update ERP Sync Status in DB:", dbErr);
        }
      });
    }

    // Notify Student (Non-blocking)
    if (od.student) {
      const statusText = status.replace("_", " ");
      const remarksText = remarks ? `. Remarks: ${remarks}` : ".";

      notificationService.createNotification(
        od.student.email,
        "OD Status Updated",
        `Your OD request (${od.trackerId}) has been ${statusText}${remarksText}`,
        status.includes("APPROVED") ? "SUCCESS" : "ERROR"
      ).catch(err => console.error("Notification Error:", err));

      // ✅ Send Email for APPROVED / REJECTED (Non-blocking)
      if (status === "APPROVED" || status === "REJECTED") {
        sendEmail(
          od.student.email,
          `OD Request ${status}: ${od.companyName || "Application"}`,
          `<div style="font-family: Arial, sans-serif; color: #333;">
              <h2>OD Status Update</h2>
              <p>Dear ${od.student.name},</p>
              <p>Your OD request (Tracker: #${od.trackerId}) for <strong>${od.companyName || "Internship"}</strong> has been <strong>${status}</strong>.</p>
              <br/>
              <p><strong>Remarks:</strong> ${remarks || "No remarks provided."}</p>
              <br/>
              <p>System Auto-Generated Email</p>
           </div>`
        ).catch(err => console.error("Email Error:", err));
      }
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
      orderBy: { createdAt: "desc" },
      include: {
        student: true,
        offer: {
          include: { company: true }
        }
      }
    });

    const mappedODs = ods.map(od => ({
      ...od,
      studentName: od.student.name,
      studentRollNo: od.student.rollNo,
      companyName: od.offer?.company?.name || "Unknown"
    }));

    return res.json(mappedODs);

  } catch (error) {
    console.error("GET STUDENT ODs ERROR:", error);
    return res.status(500).json({ message: "Failed to fetch ODs" });
  }
};

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

/* =====================================================
   GET ALL ODs (ADMIN SEARCH & FILTER)
===================================================== */
exports.getAllODs = async (req, res) => {
  try {
    const { company, rollNo, status, studentId } = req.query;
    const email = req.user.email;

    // Verify Admin OR Faculty
    const admin = await prisma.admin.findUnique({ where: { email } });
    const faculty = await prisma.faculty.findUnique({ where: { email } });

    if (!admin && !faculty) {
      return res.status(403).json({ message: "Access denied" });
    }

    const whereClause = {};

    // Filter by Status
    if (status) {
      whereClause.status = status;
    }

    // Filter by Student ID
    if (studentId) {
      whereClause.studentId = Number(studentId);
    }

    // Filter by Student Roll No
    if (rollNo) {
      whereClause.student = {
        rollNo: { contains: rollNo, mode: 'insensitive' }
      };
    }

    // Filter by Company Name
    if (company) {
      whereClause.offer = {
        company: {
          name: { contains: company, mode: 'insensitive' }
        }
      };
    }

    const ods = await prisma.od.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        student: {
          select: { id: true, name: true, rollNo: true, department: true }
        },
        offer: {
          include: { company: { select: { name: true } } }
        }
      }
    });

    const mappedODs = ods.map(od => ({
      id: od.id,
      type: od.type,
      startDate: od.startDate,
      endDate: od.endDate,
      duration: od.duration,
      status: od.status,
      erpSyncStatus: od.erpSyncStatus,
      appliedOn: od.createdAt,
      studentName: od.student.name,
      studentRollNo: od.student.rollNo,
      companyName: od.offer?.company?.name || "Unknown",
      studentId: od.student.id,
      trackerId: od.trackerId
    }));

    return res.json(mappedODs);

  } catch (error) {
    console.error("GET ALL ODs ERROR:", error);
    return res.status(500).json({ message: "Failed to fetch ODs" });
  }
};

/* =====================================================
   GET COMPANY STATS (SEARCH + SUMMARY)
===================================================== */
exports.getCompanyStats = async (req, res) => {
  try {
    const { query } = req.query;
    const email = req.user.email;

    // Verify Admin OR Faculty
    const admin = await prisma.admin.findUnique({ where: { email } });
    const faculty = await prisma.faculty.findUnique({ where: { email } });

    if (!admin && !faculty) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!query) {
      return res.json([]);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const companies = await prisma.company.findMany({
      where: {
        name: { contains: query, mode: 'insensitive' }
      },
      take: 10,
      include: {
        _count: {
          select: { offers: true }
        },
        offers: {
          select: {
            ods: {
              where: {
                status: "APPROVED",
                endDate: { gte: today }
              }
            }
          }
        }
      }
    });

    const stats = companies.map(c => {
      // Calculate active ODs by summing up valid ODs in all offers
      const activeOdCount = c.offers.reduce((acc, offer) => acc + offer.ods.length, 0);

      return {
        id: c.id,
        name: c.name,
        placedCount: c._count.offers,
        activeOdCount: activeOdCount
      };
    });

    return res.json(stats);

  } catch (error) {
    console.error("GET COMPANY STATS ERROR:", error);
    return res.status(500).json({ message: "Failed to fetch company stats" });
  }
};

/* =====================================================
   GET PLACED STUDENTS BY COMPANY
===================================================== */
exports.getCompanyPlacedStudents = async (req, res) => {
  try {
    const { company } = req.query;
    const email = req.user.email;

    // Verify Admin OR Faculty
    const admin = await prisma.admin.findUnique({ where: { email } });
    const faculty = await prisma.faculty.findUnique({ where: { email } });

    if (!admin && !faculty) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!company) {
      return res.status(400).json({ message: "Company name is required" });
    }

    const offers = await prisma.offer.findMany({
      where: {
        company: {
          name: company
        }
      },
      include: {
        student: {
          select: { id: true, name: true, rollNo: true, department: true }
        }
      },
      orderBy: { placedDate: 'desc' }
    });

    const students = offers.map(offer => ({
      id: offer.student.id,
      name: offer.student.name,
      rollNo: offer.student.rollNo,
      department: offer.student.department,
      placedDate: offer.placedDate
    }));

    return res.json(students);

  } catch (error) {
    console.error("GET PLACED STUDENTS ERROR:", error);
    return res.status(500).json({ message: "Failed to fetch placed students" });
  }
};
/* =====================================================
   MANUAL ERP SYNC (ADMIN ONLY)
===================================================== */
exports.manualErpSync = async (req, res) => {
  try {
    const { id } = req.params;
    const email = req.user.email;

    // Verify Admin OR Faculty
    const admin = await prisma.admin.findUnique({ where: { email } });
    const faculty = await prisma.faculty.findUnique({ where: { email } });

    if (!admin && !faculty) {
      return res.status(403).json({ message: "Access denied" });
    }

    const od = await prisma.od.findUnique({
      where: { id: Number(id) },
      include: { student: true }
    });

    if (!od) {
      return res.status(404).json({ message: "OD not found" });
    }

    // "COMPLETED" is not a DB status, it's just APPROVED with a past end date.
    if (od.status !== "APPROVED" && od.status !== "MENTOR_APPROVED") {
      return res.status(400).json({ message: `Only approved ODs can be synced to ERP. Current status is ${od.status}` });
    }

    const result = await syncAttendanceToErp(
      od.student.rollNo,
      od.startDate,
      od.endDate,
      od.trackerId
    );

    const updatedOd = await prisma.od.update({
      where: { id: Number(id) },
      data: { erpSyncStatus: result.success ? "SYNCED" : "FAILED" }
    });

    return res.status(200).json({
      message: result.message,
      erpSyncStatus: updatedOd.erpSyncStatus
    });

  } catch (error) {
    console.error("MANUAL ERP SYNC ERROR:", error);
    return res.status(500).json({ message: "Failed to trigger ERP sync" });
  }
};
