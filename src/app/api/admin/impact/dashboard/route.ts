/**
 * API: لوحة المؤشرات الرئيسية للوحة أثر الرواد
 * GET /api/admin/impact/dashboard — إحصائيات مجمعة
 * Query params:
 *   scope=all|month|week (default: all)
 *   year, month, ref (for weekly)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import {
  buildActionMap,
  memberTotal,
  memberScopedPoints,
  memberByCategory,
  memberMonthlyPoints,
  memberYearlyPoints,
  memberMonthlyTrend,
  memberJourney,
  levelOf,
  nextLevelGap,
  levelProgress,
  rewardEligibility,
  umrahEligible,
  filterByScope,
  finalPoints,
  summarizeMembers,
  platformAggregation,
  activityStatus,
  computeAlerts,
  type Scope,
  type ImpactActionItem,
  type ImpactLogEntry,
  type MemberSummary,
  type Alert,
} from '@/lib/impact-scoring'
import type { Prisma } from '@prisma/client'

type BeneficiaryWithRelations = Prisma.BeneficiaryGetPayload<{
  include: {
    impactLogs: { include: { action: true } }
    impactAwards: true
    platform: { select: { name: true } }
  }
}>

async function checkAuth() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })
  }
  return null
}

export async function GET(request: NextRequest) {
  const authError = await checkAuth()
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const scopeType = (searchParams.get('scope') || 'all') as 'all' | 'month' | 'week'
    const scope: Scope = { type: scopeType }
    if (scopeType === 'month') {
      const now = new Date()
      scope.year = Number(searchParams.get('year')) || now.getFullYear()
      scope.month = Number(searchParams.get('month')) || now.getMonth() + 1
    }
    if (scopeType === 'week') {
      scope.ref = searchParams.get('ref') || new Date().toISOString().split('T')[0]
    }

    // جلب كل البيانات دفعة واحدة
    const [actions, beneficiaries, awards, gates, settings] = await Promise.all([
      prisma.impactAction.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
      prisma.beneficiary.findMany({
        where: { status: 'ACTIVE', type: { in: ['BENEFICIARY', 'BOTH'] } },
        include: {
          impactLogs: { include: { action: true } },
          impactAwards: true,
        },
      }),
      prisma.impactAward.findMany({ orderBy: { date: 'desc' } }),
      prisma.impactGate.findMany(),
      prisma.impactSettings.findUnique({ where: { id: 1 } }),
    ])

    const actionMap = buildActionMap(actions as ImpactActionItem[])

    // لكل مستفيد: حساب نقاطه
    const membersData = beneficiaries.map(b => ({
      id: b.id,
      name: `${b.firstName} ${b.lastName}`,
      firstName: b.firstName,
      lastName: b.lastName,
      networkRole: b.networkRole,
      platformName: 'منصة الرواد',
      code: b.code,
      joinDate: b.joinDate || (b.memberSince ? new Date(b.memberSince) : null),
      status: b.status,
      entries: b.impactLogs.map(log => ({
        ...log,
        action: log.action as ImpactActionItem,
      })) as ImpactLogEntry[],
    }))

    // تجميع
    const summary = summarizeMembers(membersData, actionMap, scope)
    const totalPoints = summary.reduce((s, m) => s + m.total, 0)

    // إجمالي كل الأنشطة بدون نطاق
    const allEntries = beneficiaries.flatMap(b =>
      b.impactLogs.map(log => ({
        ...log,
        action: log.action as ImpactActionItem,
      }))
    ) as ImpactLogEntry[]

    const activeNow = membersData.filter(m => memberMonthlyPoints(m.entries, actionMap, new Date().getFullYear(), new Date().getMonth() + 1) > 0).length

    // تجميع المحاور
    const catTotals: Record<string, number> = {}
    for (const m of membersData) {
      const byCat = memberByCategory(m.entries, actionMap)
      for (const [cat, val] of Object.entries(byCat)) {
        catTotals[cat] = (catTotals[cat] || 0) + val
      }
    }

    // أفضل عضو
    const topMember = summary[0] || null

    // أفضل لكل صفة
    const roles = ['باحث ومفكر', 'مؤثر رقمي', 'متطوع', 'مشرف', 'رئيس منصة']
    const topByRole: Record<string, { name: string; val: number } | null> = {}
    for (const role of roles) {
      let best: { name: string; val: number } | null = null
      let bestVal = -Infinity
      for (const m of membersData) {
        if (m.networkRole === role) {
          const val = scope.type === 'all' ? memberTotal(m.entries, actionMap) : memberScopedPoints(m.entries, actionMap, scope)
          if (val > bestVal) { bestVal = val; best = { name: `${m.firstName} ${m.lastName}`, val } }
        }
      }
      topByRole[role] = best
    }

    // تجميع المنصات
    const platformsAgg = platformAggregation(membersData, actionMap, scope.type !== 'all' ? scope : undefined)

    // البوابات
    const gateMap = new Map<string, boolean>()
    for (const g of gates) {
      gateMap.set(`${g.beneficiaryId}_${g.year}_${g.month}`, g.passed)
    }

    // التنبيهات
    const now = new Date()
    const alerts = computeAlerts(membersData, actionMap, allEntries, gateMap, now.getFullYear(), now.getMonth() + 1)

    // الإعدادات
    const settingsData = settings
      ? {
          qualityBonus: JSON.parse(settings.qualityBonus),
          levels: JSON.parse(settings.levels),
          rewardTiers: JSON.parse(settings.rewardTiers),
          umrah: JSON.parse(settings.umrah),
        }
      : null

    return NextResponse.json({
      success: true,
      data: {
        scope,
        kpis: {
          memberCount: membersData.length,
          activeNow,
          actCount: allEntries.length,
          totalPoints,
          badgeCount: awards.filter(a => a.type === 'SHIELD').length,
          topMember: topMember ? { name: topMember.member.name || `${topMember.member.firstName} ${topMember.member.lastName}`, total: topMember.total } : null,
        },
        catTotals,
        topByRole,
        top10: summary.slice(0, 10).map(m => ({
          name: m.member.name || `${m.member.firstName} ${m.member.lastName}`,
          code: m.member.code,
          networkRole: m.member.networkRole,
          platformName: m.member.platformName,
          total: m.total,
          level: m.level.name,
          acts: m.acts,
        })),
        platforms: platformsAgg,
        alerts: alerts.slice(0, 15),
        settings: settingsData,
      },
    })
  } catch (error) {
    console.error('ImpactDashboard GET error:', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}
