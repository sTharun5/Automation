const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Testing emailotp insert...");
    await prisma.emailotp.deleteMany({ where: { email: 'test@example.com' } });
    const res = await prisma.emailotp.create({
      data: {
        email: 'test@example.com',
        otp: '123456',
        expiresAt: new Date(Date.now() + 5 * 60000)
      }
    });
    console.log("Success:", res);
  } catch (err) {
    console.error("Error connecting to DB or inserting:", err);
  } finally {
    await prisma.$disconnect();
  }
}
main();
