const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addAdmin() {
  try {
    const newAdmin = await prisma.admin.create({
      data: {
        email: 'nandhinisrinivas27@gmail.com',
        name: 'Nandhini Srinivas',
      },
    });
    console.log('✅ Admin successfully added to the Supabase database:');
    console.log(newAdmin);
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('✅ Admin with this email already exists in the database.');
    } else {
      console.error('❌ Error creating admin:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

addAdmin();
