const prisma = require("../../config/db");


/* =====================================================
   LIST ALL STUDENTS (FOR DROPDOWNS / ADMIN / OD APPLY)
===================================================== */
const listStudentsService = async () => {
  return await prisma.student.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      rollNo: true,
      name: true,
      email: true,
      department: true,
      semester: true
    }
  });
};

/* =====================================================
   SEARCH STUDENTS (NAME / ROLLNO / EMAIL)
===================================================== */
const searchStudentsService = async (query) => {
  if (!query || query.trim() === "") return [];

  return await prisma.student.findMany({
    where: {
      OR: [
        { name: { contains: query } },
        { rollNo: { contains: query } },
        { email: { contains: query } }
      ]
    },
    take: 20,
    select: {
      id: true,
      rollNo: true,
      name: true,
      email: true,
      department: true,
      semester: true
    }
  });
};

/* =====================================================
   GET STUDENT BY ID
===================================================== */
const getStudentByIdService = async (id) => {
  return await prisma.student.findUnique({
    where: { id: Number(id) },
    include: {
      offers: {
        include: {
          company: true
        }
      },
      ods: true
    }
  });
};

/* =====================================================
   CREATE STUDENT (ADMIN)
===================================================== */
const createStudentService = async (data) => {
  return await prisma.student.create({
    data: {
      rollNo: data.rollNo,
      name: data.name,
      email: data.email,
      department: data.department,
      semester: Number(data.semester)
    }
  });
};

/* =====================================================
   UPDATE STUDENT
===================================================== */
const updateStudentService = async (id, data) => {
  return await prisma.student.update({
    where: { id: Number(id) },
    data
  });
};

/* =====================================================
   DELETE STUDENT
===================================================== */
const deleteStudentService = async (id) => {
  return await prisma.student.delete({
    where: { id: Number(id) }
  });
};

module.exports = {
  listStudentsService,
  searchStudentsService,
  getStudentByIdService,
  createStudentService,
  updateStudentService,
  deleteStudentService
};
