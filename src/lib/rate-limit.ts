const requestMap = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(
  identifier: string,
  maxRequests = 10,
  windowMs = 60000
): { success: boolean; remaining: number } {
  const now = Date.now()
  const record = requestMap.get(identifier)

  if (!record || now > record.resetAt) {
    requestMap.set(identifier, { count: 1, resetAt: now + windowMs })
    return { success: true, remaining: maxRequests - 1 }
  }

  if (record.count >= maxRequests) {
    return { success: false, remaining: 0 }
  }

  record.count++
  return { success: true, remaining: maxRequests - record.count }
}

// Cleanup stale entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, value] of requestMap.entries()) {
      if (now > value.resetAt) requestMap.delete(key)
    }
  }, 300000)
}
