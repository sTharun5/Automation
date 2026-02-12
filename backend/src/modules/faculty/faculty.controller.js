const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/* =====================================================
   GET MENTEES (FACULTY ONLY)
===================================================== */
exports.getMentees = async (req, res) => {
    try {
        const email = req.user.email;
        const faculty = await prisma.faculty.findUnique({
            where: { email }
        });

        if (!faculty) {
            return res.status(404).json({ message: "Faculty record not found" });
        }

        const mentees = await prisma.student.findMany({
            where: { mentorId: faculty.id },
            select: {
                id: true,
                rollNo: true,
                name: true,
                department: true,
                email: true,
                placement_status: true,
                offers: {
                    include: { company: true }
                }
            },
            orderBy: { rollNo: "asc" }
        });

        res.json(mentees);
    } catch (error) {
        console.error("GET MENTEES ERROR:", error);
        res.status(500).json({ message: "Failed to fetch mentees" });
    }
};

/* =====================================================
   GET MENTEE DETAILS (FACULTY ONLY)
===================================================== */
exports.getMenteeDetails = async (req, res) => {
    try {
        const { studentId } = req.params;
        const email = req.user.email;
        const faculty = await prisma.faculty.findUnique({
            where: { email }
        });

        if (!faculty) {
            return res.status(404).json({ message: "Faculty record not found" });
        }

        const student = await prisma.student.findUnique({
            where: { id: Number(studentId) },
            include: {
                offers: {
                    include: { company: true }
                },
                ods: {
                    orderBy: { createdAt: "desc" }
                }
            }
        });

        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        // Security: Check if this faculty is the student's mentor
        if (student.mentorId !== faculty.id) {
            return res.status(403).json({ message: "You are not the mentor of this student" });
        }

        res.json(student);
    } catch (error) {
        console.error("GET MENTEE DETAILS ERROR:", error);
        res.status(500).json({ message: "Failed to fetch student details" });
    }
};
