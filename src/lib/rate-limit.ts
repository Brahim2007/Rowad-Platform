import { logger } from '@/lib/logger'

const requestMap = new Map<string, { count: number; resetAt: number }>()
let warnedInMemoryLimiter = false

function activeRecord(identifier: string) {
  const record = requestMap.get(identifier)
  if (!record) return null
  if (Date.now() > record.resetAt) {
    requestMap.delete(identifier)
    return null
  }
  return record
}

export function rateLimit(
  identifier: string,
  maxRequests = 10,
  windowMs = 60000
): { success: boolean; remaining: number; resetAt: number; retryAfter: number } {
  if (process.env.NODE_ENV === 'production' && !warnedInMemoryLimiter) {
    warnedInMemoryLimiter = true
    logger.warn('[rate-limit] Using in-memory limiter. Configure a shared store before running multiple instances.')
  }

  const now = Date.now()
  const record = activeRecord(identifier)

  if (!record || now > record.resetAt) {
    const resetAt = now + windowMs
    requestMap.set(identifier, { count: 1, resetAt })
    return { success: true, remaining: maxRequests - 1, resetAt, retryAfter: 0 }
  }

  if (record.count >= maxRequests) {
    return { success: false, remaining: 0, resetAt: record.resetAt, retryAfter: Math.ceil((record.resetAt - now) / 1000) }
  }

  record.count++
  return { success: true, remaining: maxRequests - record.count, resetAt: record.resetAt, retryAfter: 0 }
}

/** Check an explicit block without consuming another attempt. */
export function isRateLimited(identifier: string): boolean {
  return activeRecord(identifier) !== null
}

/** Create an explicit temporary block. */
export function blockRateLimit(identifier: string, windowMs: number): void {
  requestMap.set(identifier, { count: 1, resetAt: Date.now() + windowMs })
}

/** Clear attempts after successful authentication or an administrative reset. */
export function clearRateLimit(identifier: string): void {
  requestMap.delete(identifier)
}

export function clientIp(request: Request): string {
  const headers = request.headers
  if (process.env.VERCEL) {
    return headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  }
  if (process.env.TRUST_CLOUDFLARE_IP === 'true') {
    return headers.get('cf-connecting-ip')?.trim() || 'unknown'
  }
  if (process.env.TRUST_PROXY_IP_HEADERS === 'true') {
    return headers.get('x-real-ip')?.trim()
      || headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || 'unknown'
  }
  return 'unknown'
}

export function rateLimitResponse(message = 'طلبات كثيرة — حاول لاحقاً', retryAfter = 60): Response {
  return Response.json(
    { success: false, message },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
      },
    },
  )
}

// Cleanup stale entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  const cleanupTimer = setInterval(() => {
    const now = Date.now()
    for (const [key, value] of requestMap.entries()) {
      if (now > value.resetAt) requestMap.delete(key)
    }
  }, 300000)
  cleanupTimer.unref?.()
}
