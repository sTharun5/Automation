const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { getDashboardData } = require("./src/modules/students/student.controller.js");

async function main() {
    const req = { user: { email: "tharuns.ad22@bitsathy.ac.in" } };
    const res = {
        status: (code) => ({ json: (data) => console.log("STATUS", code, JSON.stringify(data, null, 2)) }),
        json: (data) => console.log("JSON", JSON.stringify(data, null, 2))
    };
    await getDashboardData(req, res);
}
main().catch(console.error).finally(() => prisma.$disconnect());
