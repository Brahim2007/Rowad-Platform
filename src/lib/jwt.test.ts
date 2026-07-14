import assert from 'node:assert/strict'
import { afterEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { getJwtSecret } from './jwt'

const originalAuthSecret = process.env.AUTH_SECRET

afterEach(() => {
  if (originalAuthSecret === undefined) {
    delete process.env.AUTH_SECRET
  } else {
    process.env.AUTH_SECRET = originalAuthSecret
  }
})

describe('JWT secret handling', () => {
  it('fails closed when AUTH_SECRET is missing', () => {
    delete process.env.AUTH_SECRET

    assert.throws(() => getJwtSecret(), /AUTH_SECRET is required/)
  })

  it('returns AUTH_SECRET when configured', () => {
    process.env.AUTH_SECRET = 'test-secret'

    assert.equal(getJwtSecret(), 'test-secret')
  })

  it('does not reintroduce public fallback secrets or legacy env names', () => {
    const files = [
      'src/lib/jwt.ts',
      'src/lib/member-auth.ts',
      'src/app/api/member/auth/route.ts',
      'src/app/api/member/dashboard/route.ts',
      'src/app/api/member/portfolio/route.ts',
      'src/app/api/member/profile/route.ts',
      '.env.example',
      'README.md',
    ]

    const offenders = files.flatMap(file => {
      const source = readFileSync(join(process.cwd(), file), 'utf8')
      return source.includes('member-secret-dev') || source.includes('NEXTAUTH_SECRET') ? [file] : []
    })

    assert.deepEqual(offenders, [])
  })
})
