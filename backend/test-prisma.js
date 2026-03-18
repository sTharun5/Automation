require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_DATABASE_URL
    }
  }
});

async function test() {
  try {
    console.log("Testing emailotp fetch with DIRECT_DATABASE_URL...");
    const otps = await prisma.emailotp.findMany({ take: 1 });
    console.log("Success fetch:", otps);
    
    console.log("Testing emailotp insert...");
    const res = await prisma.emailotp.create({
      data: {
        email: 'test-insert@example.com',
        otp: '000000',
        expiresAt: new Date(Date.now() + 50000)
      }
    });
    console.log("Success insert:", res.id);
    await prisma.emailotp.delete({ where: { id: res.id } });
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}
test();
