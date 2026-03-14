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

/* =====================================================
   LOGOUT (Invalidate current session)
===================================================== */
exports.logout = async (req, res) => {
  try {
    const { id: userId, role } = req.user;

    await prisma.activesession.delete({
      where: {
        userId_role: {
          userId,
          role
        }
      }
    }).catch(() => {});

    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict"
    });

    res.json({ message: "Logged out" });
  } catch (err) {
    res.status(500).json({ message: "Logout failed" });
  }
};

