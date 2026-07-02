/**
 * HMAC-signed, time-limited tokens for waitlist unsubscribe links.
 *
 * Token format (URL-safe base64): `<timestamp>.<hmac>`
 *   - timestamp: Unix seconds (issued at)
 *   - hmac: HMAC-SHA256 over "<email>:<productId>:<variantId>:<timestamp>"
 *
 * Tokens are valid for 30 days by default.
 */

import { createHmac } from 'crypto'

const SECRET = process.env.UNSUBSCRIBE_TOKEN_SECRET || process.env.JWT_SECRET || 'fallback-secret'
const TTL_SECONDS = 30 * 24 * 60 * 60 // 30 days

function sign(payload: string): string {
  return createHmac('sha256', SECRET).update(payload).digest('base64url')
}

function makePayload(email: string, productId: string, variantId: string, ts: number): string {
  return `${email}:${productId}:${variantId}:${ts}`
}

/**
 * Create a signed unsubscribe token.
 */
export function createUnsubscribeToken(
  email: string,
  productId: string,
  variantId?: string
): string {
  const ts = Math.floor(Date.now() / 1000)
  const vid = variantId ?? ''
  const payload = makePayload(email, productId, vid, ts)
  const mac = sign(payload)
  return `${ts}.${mac}`
}

/**
 * Verify a signed unsubscribe token.
 * Returns `true` if valid and within TTL, `false` otherwise.
 */
export function verifyUnsubscribeToken(
  token: string,
  email: string,
  productId: string,
  variantId?: string
): boolean {
  try {
    const dotIdx = token.indexOf('.')
    if (dotIdx === -1) return false

    const ts = parseInt(token.slice(0, dotIdx), 10)
    const mac = token.slice(dotIdx + 1)

    if (isNaN(ts)) return false

    // Check TTL
    const nowSeconds = Math.floor(Date.now() / 1000)
    if (nowSeconds - ts > TTL_SECONDS) return false

    // Timing-safe comparison via re-signing
    const vid = variantId ?? ''
    const expectedMac = sign(makePayload(email, productId, vid, ts))

    // Constant-time compare to prevent timing attacks
    if (expectedMac.length !== mac.length) return false
    let diff = 0
    for (let i = 0; i < expectedMac.length; i++) {
      diff |= expectedMac.charCodeAt(i) ^ mac.charCodeAt(i)
    }
    return diff === 0
  } catch {
    return false
  }
}
