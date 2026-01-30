const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/* =====================================================
   WHO AM I  (After login)
===================================================== */
exports.getMe = async (req, res) => {
  try {
    const email = req.user.email;

    const student = await prisma.student.findUnique({
      where: { email }
    });

    res.json({
      email,
      registered: !!student,
      student
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


