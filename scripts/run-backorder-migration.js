#!/usr/bin/env node

/**
 * Backorder System Migration Script
 * 
 * This script extends the database schema for the backorder system:
 * 1. Pushes updated Prisma schema to database
 * 2. Generates new Prisma client
 */

const { execSync } = require('child_process')
const path = require('path')

console.log('🚀 Setting up backorder system database schema...\n')

try {
  // Change to project root
  process.chdir(path.join(__dirname, '..'))
  
  console.log('🗄️  Pushing backorder schema to database...')
  execSync('node_modules\\.bin\\prisma.cmd db push --accept-data-loss', { stdio: 'inherit' })
  
  console.log('\n📦 Generating Prisma client...')
  execSync('node_modules\\.bin\\prisma.cmd generate', { stdio: 'inherit' })
  
  console.log('\n✅ Backorder system schema setup complete!')
  console.log('\n📋 Added to database:')
  console.log('   - WaitlistSubscription table')
  console.log('   - RestockNotification table')
  console.log('   - RestockSchedule table')
  console.log('   - Extended Order table with backorder fields')
  console.log('   - All necessary indexes and foreign keys')
  
} catch (error) {
  console.error('❌ Schema setup failed:', error.message)
  console.log('\n🔧 Troubleshooting:')
  console.log('   1. Make sure your DATABASE_URL is set correctly in .env')
  console.log('   2. Ensure your database is accessible')
  console.log('   3. Try running: npm run db:push')
  process.exit(1)
}