import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import fs from 'node:fs'

const publicApi = fs.readFileSync('src/app/api/public/ai-reports/[id]/route.ts', 'utf8')
const publicPage = fs.readFileSync('src/app/[locale]/reports/ai/[id]/page.tsx', 'utf8')
const adminPage = fs.readFileSync('src/app/[locale]/admin/impact/ai-reports/[id]/page.tsx', 'utf8')

describe('public AI report sharing', () => {
  it('keeps the shared report API public and limits its selected fields', () => {
    assert.doesNotMatch(publicApi, /requireSuperAdmin|requireAuth/)
    assert.match(publicApi, /reportJson:\s*true/)
    assert.match(publicApi, /metricsJson:\s*true/)
    assert.doesNotMatch(publicApi, /generatedBy:\s*true/)
  })

  it('provides a public report page with WhatsApp sharing', () => {
    assert.match(publicPage, /\/api\/public\/ai-reports\//)
    assert.match(publicPage, /https:\/\/wa\.me\/\?text=/)
  })

  it('shares the public URL from the administrative report page', () => {
    assert.match(adminPage, /\/reports\/ai\//)
  })
})
