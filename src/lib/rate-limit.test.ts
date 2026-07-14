import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { blockRateLimit, clearRateLimit, isRateLimited, rateLimit } from './rate-limit'

function uniqueKey(label: string) {
  return `test:${label}:${Date.now()}:${Math.random()}`
}

describe('rate-limit authentication flow', () => {
  it('allows five attempts and rejects the sixth', () => {
    const key = uniqueKey('attempts')
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      assert.equal(rateLimit(key, 5, 60_000).success, true)
    }
    assert.equal(rateLimit(key, 5, 60_000).success, false)
    clearRateLimit(key)
  })

  it('checks explicit blocks without consuming a first request', () => {
    const key = uniqueKey('block')
    assert.equal(isRateLimited(key), false)
    assert.equal(isRateLimited(key), false)

    blockRateLimit(key, 60_000)
    assert.equal(isRateLimited(key), true)
    assert.equal(isRateLimited(key), true)

    clearRateLimit(key)
    assert.equal(isRateLimited(key), false)
  })

  it('clears failed-attempt counters after a successful login', () => {
    const key = uniqueKey('reset')
    for (let attempt = 1; attempt <= 4; attempt += 1) {
      assert.equal(rateLimit(key, 5, 60_000).success, true)
    }

    clearRateLimit(key)

    for (let attempt = 1; attempt <= 5; attempt += 1) {
      assert.equal(rateLimit(key, 5, 60_000).success, true)
    }
    assert.equal(rateLimit(key, 5, 60_000).success, false)
    clearRateLimit(key)
  })
})

describe('client IP trust policy', () => {
  it('ignores spoofable forwarding headers unless a trusted proxy is configured', async () => {
    const { clientIp } = await import('./rate-limit')
    const previous = process.env.TRUST_PROXY_IP_HEADERS
    delete process.env.TRUST_PROXY_IP_HEADERS
    const request = new Request('https://example.test', {
      headers: { 'x-forwarded-for': '203.0.113.10', 'x-real-ip': '203.0.113.11' },
    })
    assert.equal(clientIp(request), 'unknown')
    if (previous === undefined) delete process.env.TRUST_PROXY_IP_HEADERS
    else process.env.TRUST_PROXY_IP_HEADERS = previous
  })

  it('uses forwarding headers when the deployment explicitly trusts its proxy', async () => {
    const { clientIp } = await import('./rate-limit')
    const previous = process.env.TRUST_PROXY_IP_HEADERS
    process.env.TRUST_PROXY_IP_HEADERS = 'true'
    const request = new Request('https://example.test', {
      headers: { 'x-forwarded-for': '203.0.113.10, 10.0.0.1' },
    })
    assert.equal(clientIp(request), '203.0.113.10')
    if (previous === undefined) delete process.env.TRUST_PROXY_IP_HEADERS
    else process.env.TRUST_PROXY_IP_HEADERS = previous
  })
})
