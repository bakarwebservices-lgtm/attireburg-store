#!/usr/bin/env node

/**
 * Database Setup Script
 * 
 * This script helps set up the database for development:
 * 1. Generates Prisma client
 * 2. Pushes schema to database
 * 3. Seeds with sample data
 */

const { execSync } = require('child_process')
const path = require('path')

console.log('🚀 Setting up Attireburg database...\n')

try {
  // Change to project root
  process.chdir(path.join(__dirname, '..'))
  
  console.log('📦 Generating Prisma client...')
  execSync('npx prisma generate', { stdio: 'inherit' })
  
  console.log('\n🗄️  Pushing schema to database...')
  execSync('npx prisma db push', { stdio: 'inherit' })
  
  console.log('\n🌱 Seeding database with sample data...')
  
  // Check if we can reach the API (development server should be running)
  try {
    const response = await fetch('http://localhost:3000/api/seed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ type: 'all' })
    })
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅', result.message)
    } else {
      console.log('⚠️  Could not seed via API. Please run the development server and visit /api/seed')
    }
  } catch (error) {
    console.log('⚠️  Could not seed via API. Please run the development server and visit /api/seed')
  }
  
  console.log('\n✅ Database setup complete!')
  console.log('\n📋 Next steps:')
  console.log('   1. Start the development server: npm run dev')
  console.log('   2. Visit http://localhost:3000/api/seed to seed data (if not done automatically)')
  console.log('   3. Visit http://localhost:3000/admin to access the admin panel')
  console.log('   4. Login with: admin@attireburg.de / admin123')
  
} catch (error) {
  console.error('❌ Setup failed:', error.message)
  process.exit(1)
}