import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const deleted = await prisma.poolReservation.deleteMany({
      where: {
        expiresAt: { lt: new Date() }
      }
    })

    return NextResponse.json({
      success: true,
      cleanedCount: deleted.count,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error running reservation cleanup:', error)
    return NextResponse.json({ error: 'Failed to cleanup expired reservations' }, { status: 500 })
  }
}
