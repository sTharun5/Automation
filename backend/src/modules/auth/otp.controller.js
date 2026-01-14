const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

/* Gmail */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

/* ================= SEND OTP ================= */
exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.endsWith("@bitsathy.ac.in")) {
      return res.status(401).json({ message: "Only BIT college email allowed" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Try sending mail first (this validates email existence)
    try {
      await transporter.sendMail({
        from: "SMART OD <" + process.env.MAIL_USER + ">",
        to: email,
        subject: "SMART OD Login OTP",
        html: `<h2>Your OTP</h2><h1>${otp}</h1><p>Valid for 5 minutes</p>`
      });
    } catch {
      return res.status(401).json({
        message: "Email does not exist or cannot receive mail"
      });
    }

    // Save OTP only if email delivery succeeded
    await prisma.emailOTP.deleteMany({ where: { email } });

    await prisma.emailOTP.create({
      data: {
        email,
        otp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000)
      }
    });

    res.json({ message: "OTP sent" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= VERIFY OTP ================= */
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const record = await prisma.emailOTP.findFirst({
      where: { email },
      orderBy: { createdAt: "desc" }
    });

    if (!record) {
      return res.status(401).json({ message: "OTP not found" });
    }

    if (record.otp !== otp) {
      return res.status(401).json({ message: "Incorrect OTP" });
    }

    if (record.expiresAt < new Date()) {
      return res.status(401).json({ message: "OTP expired" });
    }

    // OTP used → delete
    await prisma.emailOTP.deleteMany({ where: { email } });

    // Check student registration
    const student = await prisma.student.findUnique({ where: { email } });

    const token = jwt.sign(
      { email, registered: !!student },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      registered: !!student,
      student
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
