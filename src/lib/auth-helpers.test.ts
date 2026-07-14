import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  getPlatformScope,
  platformWhere,
  verifyPlatformOwnership,
  type SessionUser,
} from './auth-helpers'

const baseUser: SessionUser = {
  id: 'user-1',
  email: 'user@example.com',
  name: 'Test User',
  role: 'EDITOR',
  platformId: null,
  platformName: null,
}

function user(overrides: Partial<SessionUser>): SessionUser {
  return { ...baseUser, ...overrides }
}

describe('auth-helpers platform isolation', () => {
  it('does not scope global administrative roles', () => {
    for (const role of ['SUPER_ADMIN', 'ADMIN', 'EDITOR'] as const) {
      const scope = getPlatformScope(user({ role, platformId: 'platform-a' }))

      assert.deepEqual(scope, { filterId: null, filterAll: true })
      assert.deepEqual(platformWhere(scope), {})
    }
  })

  it('scopes platform managers to their own platform', () => {
    const scope = getPlatformScope(user({ role: 'PLATFORM_MANAGER', platformId: 'platform-a' }))

    assert.deepEqual(scope, { filterId: 'platform-a', filterAll: false })
    assert.deepEqual(platformWhere(scope), { platformId: 'platform-a' })
  })

  it('allows writes only inside the platform manager platform', async () => {
    const manager = user({ role: 'PLATFORM_MANAGER', platformId: 'platform-a' })

    assert.equal(await verifyPlatformOwnership(manager, 'platform-a'), true)
    assert.equal(await verifyPlatformOwnership(manager, 'platform-b'), false)
    assert.equal(await verifyPlatformOwnership(manager, null), false)
  })

  it('allows super admins and admins to write across platforms but denies editors', async () => {
    assert.equal(await verifyPlatformOwnership(user({ role: 'SUPER_ADMIN' }), 'platform-a'), true)
    assert.equal(await verifyPlatformOwnership(user({ role: 'ADMIN' }), 'platform-a'), true)
    assert.equal(await verifyPlatformOwnership(user({ role: 'EDITOR' }), 'platform-a'), false)
  })
})
