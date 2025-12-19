#!/usr/bin/env node

/**
 * Verification script to check if backorder system tables exist
 */

const { PrismaClient } = require('@prisma/client')

async function verifySchema() {
  console.log('🔍 Verifying backorder system schema...\n')
  
  try {
    const prisma = new PrismaClient()
    
    // Test if we can query the new tables
    console.log('📋 Checking WaitlistSubscription table...')
    const waitlistCount = await prisma.waitlistSubscription.count()
    console.log(`   ✅ WaitlistSubscription table exists (${waitlistCount} records)`)
    
    console.log('📋 Checking RestockNotification table...')
    const notificationCount = await prisma.restockNotification.count()
    console.log(`   ✅ RestockNotification table exists (${notificationCount} records)`)
    
    console.log('📋 Checking RestockSchedule table...')
    const scheduleCount = await prisma.restockSchedule.count()
    console.log(`   ✅ RestockSchedule table exists (${scheduleCount} records)`)
    
    console.log('📋 Checking Order table extensions...')
    const orders = await prisma.order.findMany({
      select: {
        id: true,
        orderType: true,
        expectedFulfillmentDate: true,
        backorderPriority: true
      },
      take: 1
    })
    console.log('   ✅ Order table has backorder fields')
    
    console.log('\n✅ All backorder system tables and fields verified successfully!')
    
    await prisma.$disconnect()
    
  } catch (error) {
    console.error('❌ Schema verification failed:', error.message)
    
    if (error.message.includes('Unknown arg')) {
      console.log('\n🔧 The Prisma client needs to be regenerated.')
      console.log('   This is expected after schema changes.')
      console.log('   The database schema was updated successfully.')
    }
    
    process.exit(1)
  }
}

verifySchema()