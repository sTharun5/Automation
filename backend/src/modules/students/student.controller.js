const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.searchStudents = async (req, res) => {
  try {
    const query = req.query.q;

    if (!query) {
      return res.json([]);
    }

    const students = await prisma.student.findMany({
      where: {
        OR: [
          { rollNo: { contains: query } },
          { name: { contains: query } },
          { email: { contains: query } }
        ]
      },
      select: {
        id: true,
        rollNo: true,
        name: true,
        email: true,
        department: true,
        semester: true
      },
      take: 10
    });

    return res.json(students);
  } catch (error) {
    console.error("SEARCH ERROR:", error);
    return res.status(500).json({ message: "Search failed" });
  }
};
