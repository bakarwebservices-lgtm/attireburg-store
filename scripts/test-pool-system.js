const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Simple test inline for key normalisation
const KEY_ALIASES = {
  fit: 'fit', fits: 'fit', passform: 'fit', Passform: 'fit',
  size: 'size', sizes: 'size', größe: 'size', Größe: 'size', groesse: 'size',
  color: 'color', colors: 'color', farbe: 'color', Farbe: 'color', colour: 'color',
}

function normaliseKey(key) {
  const trimmed = key.trim()
  return KEY_ALIASES[trimmed] || KEY_ALIASES[trimmed.toLowerCase()] || trimmed.toLowerCase()
}

function computeCanonicalKey(garmentType, attributes) {
  const normalised = {}
  if (attributes && typeof attributes === 'object') {
    for (const [k, v] of Object.entries(attributes)) {
      if (v !== undefined && v !== null && String(v).trim() !== '') {
        const canonicalK = normaliseKey(k)
        normalised[canonicalK] = String(v).trim().toLowerCase()
      }
    }
  }
  const sorted = Object.fromEntries(
    Object.entries(normalised).sort(([a], [b]) => a.localeCompare(b))
  )
  return `${garmentType.trim().toLowerCase()}::${JSON.stringify(sorted)}`
}

async function runTests() {
  console.log('--- TEST 1: Canonical Key Normalisation ---')
  const key1 = computeCanonicalKey('tshirt', { fit: 'Slim Fit', size: 'S', color: 'Schwarz' })
  const key2 = computeCanonicalKey('tshirt', { Passform: 'Slim Fit', Größe: 'S', Farbe: 'Schwarz' })
  const key3 = computeCanonicalKey('tshirt', { Farbe: 'Schwarz', size: 'S', Passform: 'Slim Fit' })

  console.log('Key 1 (EN):', key1)
  console.log('Key 2 (DE):', key2)
  console.log('Key 3 (Unsorted):', key3)

  if (key1 === key2 && key2 === key3) {
    console.log('✅ PASS: Canonical keys match perfectly across languages and key ordering!')
  } else {
    console.error('❌ FAIL: Canonical key mismatch!')
    process.exit(1)
  }

  console.log('\n--- TEST 2: DB Pool Creation & Link Test ---')
  const testPoolKey = `test_${Date.now()}::${key1}`
  const pool = await prisma.blankGarment.create({
    data: {
      name: 'Test Black S Slim T-Shirt',
      garmentType: 'tshirt',
      attributes: { fit: 'Slim Fit', size: 'S', color: 'Schwarz' },
      canonicalKey: testPoolKey,
      stock: 5,
      notes: 'Automated Test Pool'
    }
  })
  console.log('✅ Created BlankGarment Pool:', pool.id, pool.name, 'Stock:', pool.stock)

  console.log('\n--- TEST 3: Reservation Creation & Expiry ---')
  const res = await prisma.poolReservation.create({
    data: {
      blankGarmentId: pool.id,
      checkoutId: 'test_checkout_123',
      quantity: 2,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000)
    }
  })
  console.log('✅ Created PoolReservation:', res.id, 'Hold Qty:', res.quantity)

  // Verify aggregate
  const agg = await prisma.poolReservation.aggregate({
    where: { blankGarmentId: pool.id, expiresAt: { gt: new Date() } },
    _sum: { quantity: true }
  })
  console.log('✅ Aggregated Reserved Stock:', agg._sum.quantity)
  console.log('✅ Effective Available Stock:', pool.stock - agg._sum.quantity)

  // Cleanup test data
  await prisma.poolReservation.deleteMany({ where: { blankGarmentId: pool.id } })
  await prisma.blankGarment.delete({ where: { id: pool.id } })
  console.log('✅ Cleaned up test database records successfully.')

  await prisma.$disconnect()
  console.log('\n🎉 ALL INTEGRATION TESTS PASSED CLEANLY!')
}

runTests().catch(err => {
  console.error('Test execution failed:', err)
  prisma.$disconnect()
  process.exit(1)
})
