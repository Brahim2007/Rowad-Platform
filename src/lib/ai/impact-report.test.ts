import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { buildImpactReportMetrics, getImpactReportPeriod, impactReportRequestSchema, percentageChange, platformSmartImpactReportSchema } from './impact-report'

describe('smart impact report aggregation', () => {
  it('builds monthly and previous-month boundaries across years', () => {
    const input = impactReportRequestSchema.parse({ periodType: 'monthly', year: 2026, month: 1 })
    const period = getImpactReportPeriod(input)
    assert.equal(period.start.toISOString(), '2026-01-01T00:00:00.000Z')
    assert.equal(period.previousStart.toISOString(), '2025-12-01T00:00:00.000Z')
    assert.equal(period.previousLabel, 'ديسمبر 2025')
  })

  it('rejects a monthly report without a month', () => {
    assert.equal(impactReportRequestSchema.safeParse({ periodType: 'monthly', year: 2026 }).success, false)
  })

  it('keeps network-wide and platform report scopes separate', () => {
    assert.equal(impactReportRequestSchema.safeParse({
      reportScope: 'network', periodType: 'monthly', year: 2026, month: 7, platformId: 'p1',
    }).success, false)
    assert.equal(impactReportRequestSchema.safeParse({
      reportScope: 'network', periodType: 'monthly', year: 2026, month: 7, networkRole: 'متطوع',
    }).success, false)
    assert.equal(impactReportRequestSchema.safeParse({
      reportScope: 'platform', periodType: 'yearly', year: 2026, platformId: 'p1',
    }).success, false)
    assert.equal(impactReportRequestSchema.safeParse({
      reportScope: 'platform', periodType: 'monthly', year: 2026, month: 7, platformId: 'p1',
    }).success, true)
  })

  it('requires evaluation and rapid actions in a platform report', () => {
    const platformReport = {
      title: 'تقرير أداء منصة التقنية',
      executiveSummary: 'ملخص تنفيذي',
      performanceNarrative: 'قراءة الأداء',
      highlights: [],
      risks: [],
      recommendations: [],
      platformInsights: [],
      memberInsights: [],
      nextPeriodFocus: [],
      dataNotes: [],
      platformEvaluation: {
        overallStatus: 'تحتاج تدخل',
        summary: 'انخفاض المشاركة يتطلب تدخلًا.',
        strengths: ['وجود أعضاء نشطين'],
        gaps: ['انخفاض نسبة المشاركة'],
      },
      criticalIssues: [],
      rapidActionPlan: [{
        priority: 1,
        action: 'مراجعة الأعضاء غير النشطين',
        ownerRole: 'مدير المنصة',
        timeframe: 'خلال 3 أيام',
        successMeasure: 'التواصل مع جميع الأعضاء غير النشطين',
      }],
    }

    assert.equal(platformSmartImpactReportSchema.safeParse(platformReport).success, true)
    const { platformEvaluation: _removed, ...incomplete } = platformReport
    assert.equal(platformSmartImpactReportSchema.safeParse(incomplete).success, false)
  })

  it('calculates safe percentage changes', () => {
    assert.equal(percentageChange(150, 100), 50)
    assert.equal(percentageChange(0, 0), 0)
    assert.equal(percentageChange(10, 0), null)
  })

  it('aggregates all supplied records and excludes unapproved points', () => {
    const period = getImpactReportPeriod(impactReportRequestSchema.parse({ periodType: 'monthly', year: 2026, month: 7 }))
    const members = [
      { id: 'm1', firstName: 'سارة', lastName: 'أحمد', networkRole: 'باحث ومفكر', platformId: 'p1', platform: { name: 'منصة المعرفة' } },
      { id: 'm2', firstName: 'عمر', lastName: 'علي', networkRole: 'متطوع', platformId: null, platform: null },
    ]
    const logs = [
      { beneficiaryId: 'm1', date: new Date('2026-07-10T00:00:00Z'), count: 2, quality: 'GOOD', status: 'APPROVED', pointsSnapshot: null, action: { name: 'بحث', points: 10, category: 'INITIATIVES' } },
      { beneficiaryId: 'm2', date: new Date('2026-07-11T00:00:00Z'), count: 1, quality: 'ACCEPTABLE', status: 'PENDING_REVIEW', pointsSnapshot: null, action: { name: 'تطوع', points: 8, category: 'DISCIPLINE' } },
      { beneficiaryId: 'm1', date: new Date('2026-06-03T00:00:00Z'), count: 1, quality: 'ACCEPTABLE', status: 'APPROVED', pointsSnapshot: 20, action: { name: 'بحث', points: 10, category: 'INITIATIVES' } },
    ]

    const metrics = buildImpactReportMetrics({ members, logs, period, qualityBonus: { GOOD: 3, ACCEPTABLE: 0 } })
    assert.equal(metrics.totalPoints, 23)
    assert.equal(metrics.totalActivities, 2)
    assert.equal(metrics.approvedActivities, 1)
    assert.equal(metrics.pendingActivities, 1)
    assert.equal(metrics.activeMembers, 1)
    assert.equal(metrics.previousTotalPoints, 20)
    assert.equal(metrics.pointsChangePercent, 15)
    assert.equal(metrics.dataQuality.missingPlatformMembers, 1)
  })
})
