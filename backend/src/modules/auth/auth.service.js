const { PrismaClient } = require("@prisma/client");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();

/* Gmail Transporter */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

/* ===============================
   SEND OTP
================================ */
exports.sendOTP = async (email) => {
  if (!email.endsWith("@bitsathy.ac.in")) {
    throw new Error("Only @bitsathy.ac.in emails allowed");
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // remove old OTPs
  await prisma.emailOTP.deleteMany({
    where: { email }
  });

  // store new OTP
  await prisma.emailOTP.create({
    data: {
      email,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 min
    }
  });

  // send email
  await transporter.sendMail({
    from: "SMART OD <" + process.env.MAIL_USER + ">",
    to: email,
    subject: "Your SMART OD Login OTP",
    html: `
      <div style="font-family:Arial">
        <h2>SMART OD Login</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>This OTP is valid for 5 minutes.</p>
      </div>
    `
  });
};

/* ===============================
   VERIFY OTP
================================ */
exports.verifyOTP = async (email, otp) => {
  const record = await prisma.emailOTP.findFirst({
    where: { email, otp }
  });

  if (!record) {
    throw new Error("Invalid OTP");
  }

  if (record.expiresAt < new Date()) {
    throw new Error("OTP expired");
  }

  // delete OTP after use
  await prisma.emailOTP.deleteMany({
    where: { email }
  });

  // generate JWT
  const token = jwt.sign({ email }, process.env.JWT_SECRET, {
    expiresIn: "1d"
  });

  return token;
};
