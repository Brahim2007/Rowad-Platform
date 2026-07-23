/**
 * API: لوحة المؤشرات الرئيسية للوحة أثر الرواد
 * GET /api/admin/impact/dashboard — إحصائيات مجمعة
 * Query params:
 *   scope=all|month|week (default: all)
 *   year, month, ref (for weekly)
 */

import { NextRequest, NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'
import { logger } from '@/lib/logger'
import {
  buildActionMap,
  memberTotal,
  memberScopedPoints,
  memberByCategory,
  memberMonthlyPoints,
  filterByScope,
  summarizeMembers,
  platformAggregation,
  computeAlerts,
  type Scope,
  type ImpactActionItem,
  type ImpactLogEntry,
} from '@/lib/impact-scoring'

async function requireImpactDashboardAccess() {
  const auth = await requireAuth()
  if (!auth.ok) return auth
  if (auth.user.role === 'EDITOR') {
    return {
      ok: false as const,
      error: NextResponse.json({ success: false, message: 'غير مصرح — الصلاحية محدودة' }, { status: 403 }),
    }
  }
  if (auth.user.role === 'PLATFORM_MANAGER' && !auth.user.platformId) {
    return {
      ok: false as const,
      error: NextResponse.json({ success: false, message: 'مدير المنصة غير مرتبط بمنصة' }, { status: 403 }),
    }
  }
  return auth
}

function sourceKey(sourceType?: string | null, sourceId?: string | null, actionId?: string | null) {
  return sourceType && sourceId && actionId ? `${sourceType}:${sourceId}:${actionId}` : ''
}

async function buildDashboardData(scope: Scope, platformId?: string | null) {
  // تحميل متدرج لتجنب فتح عدد كبير من اتصالات قاعدة البيانات في البيئة المجانية.
  const actions = await prisma.impactAction.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } })
  const beneficiaries = await prisma.beneficiary.findMany({
    where: {
      status: 'ACTIVE',
      type: { in: ['BENEFICIARY', 'BOTH'] },
      ...(platformId ? { platformId } : {}),
    },
    select: {
      id: true,
      code: true,
      firstName: true,
      lastName: true,
      networkRole: true,
      joinDate: true,
      memberSince: true,
      status: true,
    },
  })
  const shieldAwardCount = await prisma.impactAward.count({
    where: {
      type: 'SHIELD',
      ...(platformId ? { beneficiary: { platformId } } : {}),
    },
  })
  const gates = await prisma.impactGate.findMany({
    where: platformId ? { beneficiary: { platformId } } : undefined,
    select: { beneficiaryId: true, year: true, month: true, passed: true },
  })
  const settings = await prisma.impactSettings.findUnique({ where: { id: 1 } })

  const actionMap = buildActionMap(actions as ImpactActionItem[])
  const beneficiaryIds = beneficiaries.map(b => b.id)

  const impactLogs = beneficiaryIds.length
    ? await prisma.impactLog.findMany({
        where: { beneficiaryId: { in: beneficiaryIds } },
        select: {
          id: true,
          beneficiaryId: true,
          actionId: true,
          sourceType: true,
          sourceId: true,
          platformId: true,
          programId: true,
          activityId: true,
          enrollmentId: true,
          participationId: true,
          reportId: true,
          evaluationId: true,
          count: true,
          quality: true,
          status: true,
          date: true,
          link: true,
          note: true,
          platform: { select: { name: true } },
        },
      })
    : []
  const enrollments = beneficiaryIds.length
    ? await prisma.enrollment.findMany({
        where: {
          beneficiaryId: { in: beneficiaryIds },
          status: 'COMPLETED',
          ...(platformId ? { program: { platformId } } : {}),
        },
        select: {
          id: true,
          beneficiaryId: true,
          completedAt: true,
          updatedAt: true,
          program: {
            select: {
              id: true,
              name: true,
              platform: { select: { id: true, name: true } },
            },
          },
        },
      })
    : []
  const participations = beneficiaryIds.length
    ? await prisma.participation.findMany({
        where: {
          beneficiaryId: { in: beneficiaryIds },
          status: { in: ['ATTENDED', 'COMPLETED'] },
          ...(platformId ? { activity: { program: { platformId } } } : {}),
        },
        select: {
          id: true,
          beneficiaryId: true,
          status: true,
          attendedAt: true,
          createdAt: true,
          activity: {
            select: {
              id: true,
              name: true,
              startDate: true,
              program: {
                select: {
                  id: true,
                  name: true,
                  platform: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      })
    : []

  const logsByBeneficiary = new Map<string, typeof impactLogs>()
  for (const log of impactLogs) {
    const list = logsByBeneficiary.get(log.beneficiaryId) || []
    list.push(log)
    logsByBeneficiary.set(log.beneficiaryId, list)
  }

  const enrollmentsByBeneficiary = new Map<string, typeof enrollments>()
  for (const enrollment of enrollments) {
    const list = enrollmentsByBeneficiary.get(enrollment.beneficiaryId) || []
    list.push(enrollment)
    enrollmentsByBeneficiary.set(enrollment.beneficiaryId, list)
  }

  const participationsByBeneficiary = new Map<string, typeof participations>()
  for (const participation of participations) {
    const list = participationsByBeneficiary.get(participation.beneficiaryId) || []
    list.push(participation)
    participationsByBeneficiary.set(participation.beneficiaryId, list)
  }

  const membersData = beneficiaries.map(b => {
    const beneficiaryLogs = (logsByBeneficiary.get(b.id) || []).filter(log => !platformId || log.platformId === platformId)
    const persistedKeys = new Set(
      beneficiaryLogs
        .map(log => sourceKey(log.sourceType, log.sourceId, log.actionId))
        .filter(Boolean)
    )

    const persistedEntries = beneficiaryLogs.map(log => ({
      ...log,
      action: actionMap.get(log.actionId),
      platformName: log.platform?.name || null,
    })) as ImpactLogEntry[]

    const operationalEntries: ImpactLogEntry[] = []
    for (const participation of participationsByBeneficiary.get(b.id) || []) {
      const actionId = participation.status === 'COMPLETED'
        ? '__participation_completed'
        : '__participation_attended'
      const key = sourceKey('PARTICIPATION', participation.id, actionId)
      if (persistedKeys.has(key)) continue

      operationalEntries.push({
        id: `virtual:${key}`,
        beneficiaryId: b.id,
        actionId,
        action: actionMap.get(actionId),
        sourceType: 'PARTICIPATION',
        sourceId: participation.id,
        platformId: participation.activity.program.platform.id,
        platformName: participation.activity.program.platform.name,
        programId: participation.activity.program.id,
        activityId: participation.activity.id,
        participationId: participation.id,
        count: 1,
        quality: 'ACCEPTABLE',
        status: 'APPROVED',
        date: participation.attendedAt || participation.activity.startDate || participation.createdAt,
        note: participation.activity.name,
      })
    }

    for (const enrollment of enrollmentsByBeneficiary.get(b.id) || []) {
      const actionId = '__enrollment_completed'
      const key = sourceKey('ENROLLMENT', enrollment.id, actionId)
      if (persistedKeys.has(key)) continue

      operationalEntries.push({
        id: `virtual:${key}`,
        beneficiaryId: b.id,
        actionId,
        action: actionMap.get(actionId),
        sourceType: 'ENROLLMENT',
        sourceId: enrollment.id,
        platformId: enrollment.program.platform.id,
        platformName: enrollment.program.platform.name,
        programId: enrollment.program.id,
        enrollmentId: enrollment.id,
        count: 1,
        quality: 'GOOD',
        status: 'APPROVED',
        date: enrollment.completedAt || enrollment.updatedAt,
        note: enrollment.program.name,
      })
    }

    const platformName = [...persistedEntries, ...operationalEntries].find(e => e.platformName)?.platformName || 'غير محدد'

    return {
      id: b.id,
      name: `${b.firstName} ${b.lastName}`,
      firstName: b.firstName,
      lastName: b.lastName,
      networkRole: b.networkRole,
      platformName,
      code: b.code,
      joinDate: b.joinDate || (b.memberSince ? new Date(b.memberSince) : null),
      status: b.status,
      entries: [...persistedEntries, ...operationalEntries],
    }
  })

  // تجميع
  const summary = summarizeMembers(membersData, actionMap, scope)
  const totalPoints = summary.reduce((s, m) => s + m.total, 0)

  // إجمالي الأنشطة والنشاط الحالي. مؤشرات الفترة يجب أن تستخدم النطاق نفسه.
  const allEntries = membersData.flatMap(m => m.entries)
  const scopedEntries = scope.type === 'all' ? allEntries : filterByScope(allEntries, scope)

  const activeNow = membersData.filter(m => memberMonthlyPoints(m.entries, actionMap, new Date().getFullYear(), new Date().getMonth() + 1) > 0).length

  // تجميع المحاور
  const catTotals: Record<string, number> = {}
  for (const m of membersData) {
    const scopedMemberEntries = scope.type === 'all' ? m.entries : filterByScope(m.entries, scope)
    const byCat = memberByCategory(scopedMemberEntries, actionMap)
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


  return {
    scope,
    kpis: {
      memberCount: membersData.length,
      activeNow,
      actCount: scopedEntries.length,
      totalPoints,
      badgeCount: shieldAwardCount,
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
  }
}

const getCachedDashboardData = unstable_cache(
  async (_scopeKey: string, scope: Scope) => buildDashboardData(scope),
  ['impact-dashboard'],
  { revalidate: 60, tags: ['impact-dashboard'] },
)

function dashboardScopeKey(scope: Scope) {
  return JSON.stringify({ type: scope.type, year: scope.year ?? null, month: scope.month ?? null, ref: scope.ref ?? null })
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireImpactDashboardAccess()
    if (!auth.ok) return auth.error

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

    const platformId = auth.user.role === 'PLATFORM_MANAGER' ? auth.user.platformId : null
    const data = platformId
      ? await buildDashboardData(scope, platformId)
      : await getCachedDashboardData(dashboardScopeKey(scope), scope)

    return NextResponse.json(
      { success: true, data },
      { headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=30' } },
    )
  } catch (error) {
    logger.error('ImpactDashboard GET error', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { success: false, message: 'تعذر تحميل لوحة الأثر', error: message },
      { status: 500 },
    )
  }
}

