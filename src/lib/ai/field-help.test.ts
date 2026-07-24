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
    assert.match(service, /'impact\.activity\.evidence'/)
    assert.doesNotMatch(service, /'member_private_value'/)
    assert.match(service, /const FIELD_DEFINITIONS: Record<FieldHelpKey, FieldDefinition>/)
    assert.match(service, /explanation:/)
    assert.match(service, /example:/)
    assert.match(service, /tips:/)
  })

  it('stores one shared guide per field for reuse across all accounts and services', () => {
    const service = source('src/lib/ai/field-help.ts')
    const schema = source('prisma/schema.prisma')
    const migration = source('prisma/migrations/20260724153000_shared_field_help_guides/migration.sql')
    assert.match(schema, /model FieldHelpGuide/)
    assert.match(schema, /fieldKey\s+String\s+@unique/)
    assert.match(schema, /service\s+String/)
    assert.match(migration, /CREATE TABLE "field_help_guides"/)
    assert.match(service, /prisma\.fieldHelpGuide\.findUnique/)
    assert.match(service, /prisma\.fieldHelpGuide\.upsert/)
    assert.match(service, /update:\s*\{\}/)
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
    assert.match(memberPage, /<FieldHelp fieldKey="impact\.activity\.type"/)
    assert.match(memberPage, /<FieldHelp fieldKey="impact\.activity\.evidence"/)
    assert.match(adminPage, /<FieldHelp fieldKey="impact\.activity\.quality"/)
    assert.match(adminPage, /<FieldHelp fieldKey="impact\.activity\.rejection_reason"/)
  })

  it('keeps the new activity dialog wide without an internal scrollbar', () => {
    const adminPage = source('src/app/[locale]/admin/impact/page.tsx')
    assert.match(adminPage, /max-w-5xl rounded-2xl bg-white shadow-xl/)
    assert.match(adminPage, /grid gap-3 md:grid-cols-3/)
  })
})
