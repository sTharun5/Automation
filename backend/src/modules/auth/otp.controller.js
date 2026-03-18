const prisma = require("../../config/db");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { UAParser } = require("ua-parser-js");
const sendEmail = require("../../utils/sendEmail");

/* =========================
   OTP EMAIL TEMPLATE
========================= */
const OTP_EMAIL_HTML = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial">
  <table width="100%" style="padding:30px 0">
    <tr>
      <td align="center">
        <table width="520" style="background:#fff;border-radius:14px;overflow:hidden">
          <tr>
            <td style="background:#1e3a8a;padding:24px;text-align:center;color:white">
              <h2>BIP OD PORTAL</h2>
              <p>Bannari Amman Institute of Technology</p>
            </td>
          </tr>

          <tr>
            <td style="padding:30px">
              <h3>Login Verification</h3>
              <p>Your OTP is:</p>

              <div style="margin:25px 0;text-align:center">
                <span style="
                  font-size:32px;
                  letter-spacing:8px;
                  padding:14px 24px;
                  background:#ecfdf5;
                  color:#15803d;
                  border-radius:10px;
                  font-weight:bold;">
                  {{OTP}}
                </span>
              </div>

              <p><b>Valid for 5 minutes.</b></p>
              <p style="color:#6b7280;font-size:14px">
                Do not share this OTP with anyone.
              </p>
            </td>
          </tr>

          <tr>
            <td style="background:#f8fafc;padding:16px;text-align:center;font-size:12px;color:#64748b">
              © 2026 SMART OD Automation System
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

/* =====================================================
   SEND OTP (ADMIN / FACULTY / STUDENT)
===================================================== */
exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Check if email exists in any of the authorized roles
    const admin = await prisma.admin.findUnique({ where: { email } });
    const faculty = !admin ? await prisma.faculty.findUnique({ where: { email } }) : null;
    const student = (!admin && !faculty) ? await prisma.student.findUnique({ where: { email } }) : null;

    if (!admin && !faculty && !student) {
      return res.status(403).json({ message: "Email not registered in the system." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const result = await sendEmail(
      email,
      "SMART OD Login OTP",
      OTP_EMAIL_HTML.replace("{{OTP}}", otp)
    );

    if (!result) {
      return res.status(500).json({
        message: "Email delivery failed. Please check Render logs."
      });
    }

    console.log("OTP Email Sent via Brevo");

    await prisma.emailotp.deleteMany({ where: { email } });

    await prisma.emailotp.create({
      data: {
        email,
        otp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000)
      }
    });

    res.json({ message: "OTP sent successfully" });

  } catch (err) {
    console.error("SEND OTP ERROR:", err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

/* =====================================================
   VERIFY OTP + ROLE DETECTION
===================================================== */
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const record = await prisma.emailotp.findFirst({
      where: { email },
      orderBy: { createdAt: "desc" }
    });

    if (!record || record.expiresAt < new Date()) {
      return res.status(401).json({ message: "OTP expired or invalid" });
    }

    if (record.otp !== otp) {
      // Increment attempts
      const newAttempts = record.attempts + 1;

      if (newAttempts >= 3) {
        // Max attempts reached, delete the OTP to prevent brute force
        await prisma.emailotp.deleteMany({ where: { email } });
        return res.status(401).json({ message: "Maximum attempts reached. Please request a new OTP." });
      } else {
        // Save the failed attempt count
        await prisma.emailotp.update({
          where: { id: record.id },
          data: { attempts: newAttempts }
        });
        return res.status(401).json({ message: `Incorrect OTP. ${3 - newAttempts} attempts remaining.` });
      }
    }

    // Detect role BEFORE deleting OTP so we can check session conflicts first
    let role = null;
    let user = null;

    /* 🔴 ADMIN (highest priority) */
    const admin = await prisma.admin.findUnique({ where: { email } });
    if (admin) { role = "ADMIN"; user = admin; }

    /* 🟡 FACULTY */
    if (!role) {
      const faculty = await prisma.faculty.findUnique({ where: { email } });
      if (faculty) { role = "FACULTY"; user = faculty; }
    }

    /* 🟢 STUDENT */
    if (!role) {
      const student = await prisma.student.findUnique({ where: { email } });
      if (student) { role = "STUDENT"; user = student; }
    }

    if (!role) {
      return res.status(403).json({ message: "Email not registered in system" });
    }

    // Single-session enforcement: block second login unless forced.
    // IMPORTANT: Do NOT delete OTP yet — if we return SESSION_CONFLICT,
    // the user needs the OTP to still be valid for the force-login retry.
    const { force } = req.body;
    const existingSession = await prisma.activesession.findUnique({
      where: { userId_role: { userId: user.id, role } }
    });

    if (existingSession && !force) {
      return res.status(409).json({
        code: "SESSION_CONFLICT",
        message: "This account is already logged in on another device."
      });
    }

    // All checks passed — now safe to delete the OTP
    await prisma.emailotp.deleteMany({ where: { email } });

    const sessionId = uuidv4();
    await prisma.activesession.upsert({
      where: { userId_role: { userId: user.id, role } },
      create: { userId: user.id, role, sessionId },
      update: { sessionId }
    });
    // --- Record Login History ---
    try {
      const { browserHint, lat, lon } = req.body;
      const ua = req.headers["user-agent"];
      
      const parser = new UAParser(ua);
      const uaResult = parser.getResult();

      // Get location (non-blocking)
      let location = "Unknown";
      try {
        if (lat && lon) {
          // 1. High-accuracy reverse geocoding from coordinates
          const geoRes = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`, {
            headers: { 'User-Agent': 'Automation-App/1.0' }
          });
          
          if (geoRes.data && geoRes.data.address) {
            const addr = geoRes.data.address;
            console.log("[AUTH] Geocode Address Details:", JSON.stringify(addr));
            
            // Be more exhaustive with city fallback
            const city = addr.city || addr.town || addr.village || addr.suburb || 
                         addr.city_district || addr.state_district || addr.county || 
                         addr.state || "Unknown City";
            
            location = `${city}, ${addr.country || "Unknown Country"}`;
          }
        } else {
          // 2. Fallback to IP-based geolocation
          const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.ip || req.connection.remoteAddress;
          const cleanIp = ip.replace(/^.*:/, '');
          
          console.log(`[AUTH] Geolocation Fallback - IP: ${cleanIp}`);

          if (cleanIp && cleanIp !== '1' && cleanIp !== '127.0.0.1') {
            const geoRes = await axios.get(`http://ip-api.com/json/${cleanIp}?fields=status,message,city,regionName,country`);
            if (geoRes.data && geoRes.data.status === 'success') {
              const city = geoRes.data.city || geoRes.data.regionName || "Unknown City";
              location = `${city}, ${geoRes.data.country}`;
            } else {
              console.log("[AUTH] ip-api Error:", geoRes.data.message);
            }
          }
        }
      } catch (geoErr) {
        console.error("GEOLOCATION FAILED:", geoErr.message);
      }

      console.log(`[AUTH] Final Login Record - Hint: ${browserHint}, Location: ${location}, UA: ${ua}`);

      await prisma.loginhistory.create({
        data: {
          email,
          role,
          ip: req.headers["x-forwarded-for"]?.split(",")[0] || req.ip,
          userAgent: ua,
          deviceName: uaResult.device.model || uaResult.device.vendor || "Desktop",
          browser: browserHint || `${uaResult.browser.name || "Unknown"} ${uaResult.browser.version || ""}`.trim(),
          os: `${uaResult.os.name || "Unknown"} ${uaResult.os.version || ""}`.trim(),
          location
        }
      });
    } catch (historyErr) {
      console.error("LOGIN HISTORY RECORDING FAILED:", historyErr);
      // Non-blocking, don't fail login
    }

    const token = jwt.sign(
      { email, role, id: user.id, sid: sessionId },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000
    });

    res.json({ role, user, token });

  } catch (err) {
    console.error("VERIFY OTP ERROR:", err);
    res.status(500).json({ message: "OTP verification failed" });
  }
};
