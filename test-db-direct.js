// Direct database connection test
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  console.log('Testing Supabase connection...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
  
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    });
    
    console.log('Connecting to database...');
    const result = await prisma.$queryRaw`SELECT 1 as test, NOW() as time`;
    console.log('✅ SUCCESS! Database connected:', result);
    
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ FAILED:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

testConnection();
