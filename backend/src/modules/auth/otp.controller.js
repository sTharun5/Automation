const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

/* =========================
   EMAIL TRANSPORT
========================= */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

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
   SEND OTP
===================================================== */
exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // 1️⃣ Only BIT email
    if (!email || !email.endsWith("@bitsathy.ac.in")) {
      return res.status(401).json({
        message: "Only @bitsathy.ac.in email allowed"
      });
    }

    // 2️⃣ Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 3️⃣ Send mail (this confirms email is valid)
    await transporter.sendMail({
      from: `SMART OD <${process.env.MAIL_USER}>`,
      to: email,
      subject: "SMART OD Login OTP",
      html: OTP_EMAIL_HTML.replace("{{OTP}}", otp)
    });

    // 4️⃣ Save OTP
    await prisma.emailOTP.deleteMany({ where: { email } });

    await prisma.emailOTP.create({
      data: {
        email,
        otp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000)
      }
    });

    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to send OTP"
    });
  }
};

/* =====================================================
   VERIFY OTP
===================================================== */
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // 1️⃣ Find OTP
    const record = await prisma.emailOTP.findFirst({
      where: { email },
      orderBy: { createdAt: "desc" }
    });

    if (!record || record.otp !== otp) {
      return res.status(401).json({
        message: "Incorrect OTP"
      });
    }

    if (record.expiresAt < new Date()) {
      return res.status(401).json({
        message: "OTP expired"
      });
    }

    // 2️⃣ Remove OTP after use
    await prisma.emailOTP.deleteMany({ where: { email } });

    // 3️⃣ Check student exists in DB
    const student = await prisma.student.findUnique({
      where: { email }
    });

    if (!student) {
      return res.status(403).json({
        message: "You are not registered in the college database"
      });
    }

    // 4️⃣ Generate JWT
    const token = jwt.sign(
      { id: student.id, email: student.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      student
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "OTP verification failed"
    });
  }
};
