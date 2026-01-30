const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/* =====================================================
   ADD FACULTY (ADMIN ONLY)
===================================================== */
exports.addFaculty = async (req, res) => {
  try {
    const { facultyId, name, email, department } = req.body;

    if (!facultyId || !name || !email) {
      return res.status(400).json({
        message: "Faculty ID, Name and Email are required"
      });
    }

    // Check duplicate facultyId or email
    const existing = await prisma.faculty.findFirst({
      where: {
        OR: [
          { facultyId },
          { email }
        ]
      }
    });

    if (existing) {
      return res.status(409).json({
        message: "Faculty already exists"
      });
    }

    const faculty = await prisma.faculty.create({
      data: {
        facultyId,
        name,
        email,
        department
      }
    });

    res.status(201).json({
      message: "Faculty added successfully",
      faculty
    });

  } catch (error) {
    console.error("ADD FACULTY ERROR:", error);
    res.status(500).json({
      message: "Failed to add faculty"
    });
  }
};
