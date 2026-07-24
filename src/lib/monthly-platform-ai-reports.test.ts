import fs from 'node:fs'
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

const source = (file: string) => fs.readFileSync(file, 'utf8')

describe('monthly platform AI report policy', () => {
  it('enforces a unique monthly platform key without rewriting legacy reports', () => {
    const schema = source('prisma/schema.prisma')
    const migration = source('prisma/migrations/20260723215000_monthly_platform_ai_reports/migration.sql')

    assert.match(schema, /monthlyPlatformKey\s+String\?\s+@unique/)
    assert.match(migration, /ADD COLUMN "monthlyPlatformKey"/)
    assert.match(migration, /CREATE UNIQUE INDEX/)
  })

  it('allows system managers to generate and rejects a duplicate platform month', () => {
    const route = source('src/app/api/admin/ai/impact-report/route.ts')

    assert.match(route, /auth\.user\.role !== 'SUPER_ADMIN'/)
    assert.match(route, /auth\.user\.role !== 'ADMIN'/)
    assert.match(route, /MONTHLY_PLATFORM_REPORT_EXISTS/)
    assert.match(route, /monthlyPlatformKey/)
  })

  it('shows the policy before generation and exposes saved reports to the platform manager', () => {
    const overview = source('src/app/[locale]/admin/platforms-overview/page.tsx')
    const managerPage = source('src/app/[locale]/admin/my-platform/page.tsx')
    const managerApi = source('src/app/api/admin/my-platform/stats/route.ts')

    assert.match(overview, /سياسة تقارير المنصات/)
    assert.match(overview, /واحد فقط لكل منصة خلال كل شهر/)
    assert.match(managerPage, /تقارير المنصة الذكية/)
    assert.match(managerApi, /handleSmartReports/)
  })

  it('separates the network-wide report from platform reports in API and UI', () => {
    const route = source('src/app/api/admin/ai/impact-report/route.ts')
    const networkPage = source('src/app/[locale]/admin/impact/page.tsx')
    const archive = source('src/app/[locale]/admin/impact/ai-reports/page.tsx')

    assert.match(route, /تقرير أداء شبكة رواد — الكلي/)
    assert.match(route, /تقرير أداء \$\{reportPlatform!\.name\}/)
    assert.match(networkPage, /reportScope: 'network'/)
    assert.doesNotMatch(networkPage, /setRepPlat|setRepRole/)
    assert.match(archive, /تقرير أداء الشبكة الكلي/)
    assert.match(archive, /تقرير أداء منصة/)
  })

  it('gives platform reports evaluation, critical issues, solutions, and rapid actions', () => {
    const aiClient = source('src/lib/ai/gemini.ts')
    const document = source('src/components/admin/SmartImpactReportDocument.tsx')

    assert.match(aiClient, /platformSmartImpactReportSchema/)
    assert.match(aiClient, /criticalIssues/)
    assert.match(aiClient, /recommendedSolution/)
    assert.match(aiClient, /immediateAction/)
    assert.match(aiClient, /rapidActionPlan/)
    assert.match(document, /التقويم التنفيذي للمنصة/)
    assert.match(document, /المشكلات الحرجة والحلول العاجلة/)
    assert.match(document, /خطة التحرك السريع/)
  })

  it('creates due reminders and notifies platform managers after generation', () => {
    const reminders = source('src/lib/monthly-platform-report-reminders.ts')
    const route = source('src/app/api/admin/ai/impact-report/route.ts')

    assert.match(reminders, /تقرير .* الذكي مستحق/)
    assert.match(reminders, /periodMonth: month/)
    assert.match(route, /recipientType: 'PLATFORM_MANAGER'/)
  })
})
