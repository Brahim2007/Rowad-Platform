import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

function source(path: string) {
  return readFileSync(path, 'utf8')
}

describe('Gemini contextual field help', () => {
  it('allows only curated field keys and provides a complete fallback', () => {
    const service = source('src/lib/ai/field-help.ts')
    assert.match(service, /fieldHelpKeySchema = z\.enum\(\[/)
    assert.match(service, /'activity_evidence'/)
    assert.doesNotMatch(service, /'member_private_value'/)
    assert.match(service, /const FIELD_DEFINITIONS: Record<FieldHelpKey, FieldDefinition>/)
    assert.match(service, /explanation:/)
    assert.match(service, /example:/)
    assert.match(service, /tips:/)
  })

  it('authenticates members and administrators and rate-limits each account', () => {
    const route = source('src/app/api/ai/field-help/route.ts')
    assert.match(route, /requireActiveMember\(request\)/)
    assert.match(route, /requireAuth\(\{ allowEvaluator: true \}\)/)
    assert.match(route, /rateLimit\(`field-help:\$\{audience\}:\$\{userId\}`/)
    assert.match(route, /z\.object\(\{\s*fieldKey: fieldHelpKeySchema/)
    assert.match(route, /\.strict\(\)/)
  })

  it('sends only the selected field key from the browser, never the entered value', () => {
    const component = source('src/components/shared/FieldHelp.tsx')
    assert.match(component, /JSON\.stringify\(\{ fieldKey \}\)/)
    assert.doesNotMatch(component, /JSON\.stringify\(\{[^}]*value/)
    assert.match(component, /لا تُرسل قيمة الحقل أو بياناتك إلى Gemini/)
  })

  it('exposes contextual help in member submission and admin review forms', () => {
    const memberPage = source('src/app/[locale]/member/page.tsx')
    const adminPage = source('src/app/[locale]/admin/impact/page.tsx')
    assert.match(memberPage, /<FieldHelp fieldKey="activity_type"/)
    assert.match(memberPage, /<FieldHelp fieldKey="activity_evidence"/)
    assert.match(adminPage, /<FieldHelp fieldKey="activity_quality"/)
    assert.match(adminPage, /<FieldHelp fieldKey="activity_rejection_reason"/)
  })
})
