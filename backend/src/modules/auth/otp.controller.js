const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const nodemailer = require("nodemailer");

exports.sendOTP = async (req, res) => {
  const { email } = req.body;

  if (!email || !email.endsWith("@bitsathy.ac.in")) {
    return res.status(401).json({ message: "Only college email allowed" });
  }

  const student = await prisma.student.findUnique({ where: { email } });
  if (!student) {
    return res.status(401).json({ message: "Email not in college database" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 5 * 60 * 1000);

  await prisma.emailOTP.create({
    data: { email, otp, expiresAt: expires }
  });

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    }
  });

  await transporter.sendMail({
    from: "BIP OD Portal",
    to: email,
    subject: "Your BIP Login OTP",
    text: `Your OTP is ${otp}. Valid for 5 minutes.`
  });

  res.json({ message: "OTP sent to your email" });
};

exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  const record = await prisma.emailOTP.findFirst({
    where: { email, otp },
    orderBy: { createdAt: "desc" }
  });

  if (!record || record.expiresAt < new Date()) {
    return res.status(401).json({ message: "Invalid or expired OTP" });
  }

  const student = await prisma.student.findUnique({ where: { email } });

  const jwt = require("jsonwebtoken");
  const token = jwt.sign(
    { id: student.id, email: student.email },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.json({ token, student });
};
