import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

function source(path: string) {
  return readFileSync(path, 'utf8')
}

describe('Gemini capacity fallback', () => {
  it('retries capacity failures with the Flash-Lite model', () => {
    const client = source('src/lib/ai/gemini.ts')
    assert.match(client, /GEMINI_FALLBACK_MODEL.*gemini-3\.5-flash-lite/)
    assert.match(client, /status === 429 \|\| status === 503/)
    assert.match(client, /response = await createCompletion\(GEMINI_FALLBACK_MODEL\)/)
  })

  it('returns an actionable message if both models are unavailable', () => {
    const route = source('src/app/api/admin/ai/assistant/route.ts')
    assert.match(route, /isAiCapacityError\(error\)/)
    assert.match(route, /خدمة Gemini مزدحمة أو بلغت حد الطلبات مؤقتًا/)
    assert.match(route, /\}, \{ status: 503 \}\)/)
  })

  it('documents the fallback model for deployments', () => {
    const env = source('.env.example')
    assert.match(env, /GEMINI_FALLBACK_MODEL="gemini-3\.5-flash-lite"/)
  })
})
