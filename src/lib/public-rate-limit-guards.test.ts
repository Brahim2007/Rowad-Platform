import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

const publicPostRoutes = [
  'src/app/api/contact/route.ts',
  'src/app/api/track/visit/route.ts',
] as const

describe('public API rate-limit guard coverage', () => {
  it('keeps public write endpoints protected by the shared rate limiter', () => {
    const offenders = publicPostRoutes.flatMap(route => {
      const source = readFileSync(join(root, route), 'utf8')
      const hasPostHandler = /export\s+async\s+function\s+POST\b/.test(source)
      const usesSharedLimiter =
        source.includes('@/lib/rate-limit') &&
        source.includes('clientIp(') &&
        source.includes('rateLimit(') &&
        source.includes('rateLimitResponse(')

      return hasPostHandler && usesSharedLimiter ? [] : [route]
    })

    assert.deepEqual(offenders, [])
  })
})
