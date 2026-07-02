/**
 * Sliding-window in-memory rate limiter.
 *
 * Each key (typically a client IP) tracks the timestamps of recent requests.
 * Requests older than `windowMs` are pruned on each call.
 *
 * Note: This is per-process. On Vercel each serverless function instance has
 * its own memory, so the effective limit is per-instance. For a single-region
 * deployment this is fine. To share state across instances, swap the Map for
 * an Upstash Redis client — the interface stays identical.
 */

interface RateLimitOptions {
  /** Time window in milliseconds (default 15 minutes) */
  windowMs?: number
  /** Maximum requests allowed within the window (default 10) */
  max?: number
}

interface RateLimitResult {
  allowed: boolean
  /** How many ms until the oldest request falls outside the window */
  retryAfterMs: number
  /** Requests remaining in the current window */
  remaining: number
}

// Global store — persists across requests within the same serverless instance
const store = new Map<string, number[]>()

// Prune entries older than 1 hour to prevent unbounded memory growth
setInterval(() => {
  const cutoff = Date.now() - 60 * 60 * 1000
  for (const [key, timestamps] of store.entries()) {
    const fresh = timestamps.filter(t => t > cutoff)
    if (fresh.length === 0) {
      store.delete(key)
    } else {
      store.set(key, fresh)
    }
  }
}, 5 * 60 * 1000) // run every 5 minutes

export function rateLimit(
  key: string,
  { windowMs = 15 * 60 * 1000, max = 10 }: RateLimitOptions = {}
): RateLimitResult {
  const now = Date.now()
  const windowStart = now - windowMs

  // Get existing timestamps and prune stale ones
  const timestamps = (store.get(key) ?? []).filter(t => t > windowStart)

  if (timestamps.length >= max) {
    // Oldest request in window — once it expires the user can retry
    const oldest = timestamps[0]
    return {
      allowed: false,
      retryAfterMs: oldest + windowMs - now,
      remaining: 0,
    }
  }

  // Record this request
  timestamps.push(now)
  store.set(key, timestamps)

  return {
    allowed: true,
    retryAfterMs: 0,
    remaining: max - timestamps.length,
  }
}

/**
 * Extract the real client IP from a Next.js request.
 * Handles Vercel's forwarding headers.
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  )
}
