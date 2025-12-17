// Reset admin user with hashed password
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetAdmin() {
  try {
    console.log('Deleting old admin user...');
    await prisma.user.deleteMany({
      where: { email: 'admin@attireburg.de' }
    });
    
    console.log('Creating new admin user with hashed password...');
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    await prisma.user.create({
      data: {
        email: 'admin@attireburg.de',
        name: 'Admin User',
        firstName: 'Admin',
        lastName: 'User',
        password: hashedPassword,
        isAdmin: true,
        isActive: true,
        country: 'Germany'
      }
    });
    
    console.log('✅ Admin user reset successfully!');
    console.log('Login with: admin@attireburg.de / admin123');
    
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

resetAdmin();
