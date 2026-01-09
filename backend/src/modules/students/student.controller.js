const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.searchStudents = async (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.json([]);
  }

  const students = await prisma.student.findMany({
    where: {
      OR: [
        { rollNo: { contains: query, mode: "insensitive" } },
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } }
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

  res.json(students);
};
