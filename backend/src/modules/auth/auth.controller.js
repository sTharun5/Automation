const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();

exports.login = async (req, res) => {
  // ✅ SAFE READ
  const rawEmail = req.body?.email;

  if (!rawEmail) {
    return res.status(400).json({
      message: "Email is required"
    });
  }

  // ✅ NORMALIZE
  const email = rawEmail.trim().toLowerCase();

  // 1️⃣ allow only college email
  if (!email.endsWith("@bitsathy.ac.in")) {
    return res.status(401).json({
      message: "Only college email (@bitsathy.ac.in) allowed"
    });
  }

  // 2️⃣ check email exists in DB
  const student = await prisma.student.findUnique({
    where: { email }
  });

  if (!student) {
    return res.status(401).json({
      message: "Email not found in college database"
    });
  }

  // 3️⃣ issue JWT
  const token = jwt.sign(
    { id: student.id, email: student.email },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  return res.json({
    message: "Login successful",
    token,
    student: {
      id: student.id,
      rollNo: student.rollNo,
      name: student.name,
      email: student.email,
      department: student.department,
      semester: student.semester
    }
  });
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

  const token = jwt.sign(
    { id: student.id, email: student.email },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.json({ token, student });
};
