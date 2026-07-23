/**
 * API مركز متابعة المنصات — للإدارة العليا فقط.
 * يجمع البيانات في استعلامات مشتركة لتجنب N+1 ويحصر السجلات الزمنية في فترتي المقارنة.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'
import { buildActionMap, finalPoints, QUALITY_BONUS, type ImpactQuality } from '@/lib/impact-scoring'
import { calculatePlatformHealth } from '@/lib/platform-health'
import { logger } from '@/lib/logger'

function monthRange(year: number, month: number) {
  return {
    start: new Date(year, month - 1, 1),
    end: new Date(year, month, 1),
  }
}

function increment(map: Map<string, number>, key: string | null, value = 1) {
  if (!key) return
  map.set(key, (map.get(key) || 0) + value)
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error
  if (auth.user.role !== 'SUPER_ADMIN' && auth.user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, message: 'الإدارة العليا فقط' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const now = new Date()
    const year = Number(searchParams.get('year')) || now.getFullYear()
    const month = Math.min(12, Math.max(1, Number(searchParams.get('month')) || now.getMonth() + 1))
    const current = monthRange(year, month)
    const previousDate = new Date(year, month - 2, 1)
    const previous = monthRange(previousDate.getFullYear(), previousDate.getMonth() + 1)
    const staleBefore = new Date(now.getTime() - 7 * 86400000)

    const [
      platforms,
      members,
      comparisonLogs,
      pendingLogs,
      approvedGroups,
      reportGroups,
      evaluationGroups,
      settings,
      unassignedMembers,
      unscopedLogs,
    ] = await Promise.all([
      prisma.platform.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          name: true,
          slug: true,
          color: true,
          managerAssignments: {
            where: { endedAt: null, assignmentRole: 'PRIMARY' },
            take: 1,
            select: {
              startedAt: true,
              adminUser: {
                select: { id: true, fullName: true, email: true, lastLoginAt: true },
              },
            },
          },
          _count: { select: { programs: true, projects: true, documents: true } },
        },
      }),
      prisma.beneficiary.findMany({
        where: { status: 'ACTIVE', platformId: { not: null } },
        select: { id: true, platformId: true },
      }),
      prisma.impactLog.findMany({
        where: { date: { gte: previous.start, lt: current.end }, platformId: { not: null } },
        select: {
          id: true,
          platformId: true,
          beneficiaryId: true,
          actionId: true,
          count: true,
          quality: true,
          status: true,
          date: true,
          pointsSnapshot: true,
          action: { select: { id: true, name: true, points: true, category: true, note: true, isActive: true, sortOrder: true } },
        },
      }),
      prisma.impactLog.findMany({
        where: { status: 'PENDING_REVIEW', platformId: { not: null } },
        select: { platformId: true, date: true },
      }),
      prisma.impactLog.groupBy({
        by: ['platformId'],
        where: { status: 'APPROVED', platformId: { not: null } },
        _count: { _all: true },
      }),
      prisma.submittedReport.groupBy({
        by: ['platformId', 'status'],
        where: { platformId: { not: null } },
        _count: { _all: true },
      }),
      prisma.evaluation.groupBy({
        by: ['platformId'],
        where: { platformId: { not: null }, status: { in: ['FINAL', 'APPROVED'] }, score: { not: null } },
        _avg: { score: true, maxScore: true },
        _count: { _all: true },
      }),
      prisma.impactSettings.findUnique({ where: { id: 1 }, select: { qualityBonus: true } }),
      prisma.beneficiary.count({ where: { status: 'ACTIVE', platformId: null } }),
      prisma.impactLog.count({ where: { platformId: null } }),
    ])

    const memberIdsByPlatform = new Map<string, Set<string>>()
    for (const member of members) {
      if (!member.platformId) continue
      if (!memberIdsByPlatform.has(member.platformId)) memberIdsByPlatform.set(member.platformId, new Set())
      memberIdsByPlatform.get(member.platformId)!.add(member.id)
    }

    const actions = Array.from(new Map(comparisonLogs.filter(log => log.action).map(log => [log.action!.id, log.action!])).values())
    const actionMap = buildActionMap(actions as any)
    let qualityBonus = QUALITY_BONUS
    try {
      if (settings?.qualityBonus) qualityBonus = { ...QUALITY_BONUS, ...JSON.parse(settings.qualityBonus) } as Record<ImpactQuality, number>
    } catch { /* use defaults */ }

    const currentApproved = new Map<string, number>()
    const previousApproved = new Map<string, number>()
    const currentPoints = new Map<string, number>()
    const previousPoints = new Map<string, number>()
    const currentMemberIds = new Map<string, Set<string>>()

    for (const log of comparisonLogs) {
      if (!log.platformId) continue
      const isCurrent = log.date >= current.start && log.date < current.end
      const isPrevious = log.date >= previous.start && log.date < previous.end
      if (log.status === 'APPROVED') {
        const points = log.pointsSnapshot ?? finalPoints(log as any, actionMap, qualityBonus)
        if (isCurrent) {
          increment(currentApproved, log.platformId)
          increment(currentPoints, log.platformId, points)
          const validMembers = memberIdsByPlatform.get(log.platformId)
          if (validMembers?.has(log.beneficiaryId)) {
            if (!currentMemberIds.has(log.platformId)) currentMemberIds.set(log.platformId, new Set())
            currentMemberIds.get(log.platformId)!.add(log.beneficiaryId)
          }
        } else if (isPrevious) {
          increment(previousApproved, log.platformId)
          increment(previousPoints, log.platformId, points)
        }
      }
    }

    const pendingCount = new Map<string, number>()
    const stalePending = new Map<string, number>()
    for (const log of pendingLogs) {
      increment(pendingCount, log.platformId)
      if (log.date < staleBefore) increment(stalePending, log.platformId)
    }

    const totalApproved = new Map(approvedGroups.filter(row => row.platformId).map(row => [row.platformId!, row._count._all]))
    const reports = new Map<string, { total: number; approved: number; pending: number }>()
    for (const group of reportGroups) {
      if (!group.platformId) continue
      const bucket = reports.get(group.platformId) || { total: 0, approved: 0, pending: 0 }
      bucket.total += group._count._all
      if (group.status === 'APPROVED') bucket.approved += group._count._all
      if (group.status === 'DRAFT' || group.status === 'SUBMITTED' || group.status === 'REVIEWED') bucket.pending += group._count._all
      reports.set(group.platformId, bucket)
    }
    const evaluations = new Map(evaluationGroups.filter(row => row.platformId).map(row => {
      const score = row._avg.score || 0
      const maxScore = row._avg.maxScore || 100
      return [row.platformId!, { score: Math.round(maxScore ? score / maxScore * 100 : 0), count: row._count._all }]
    }))

    const data = platforms.map(platform => {
      const activeManagerAssignment = platform.managerAssignments[0] || null
      const manager = activeManagerAssignment?.adminUser || null
      const memberCount = memberIdsByPlatform.get(platform.id)?.size || 0
      const activeMembers = currentMemberIds.get(platform.id)?.size || 0
      const activeRate = memberCount ? Math.round(activeMembers / memberCount * 100) : 0
      const approvedThisMonth = currentApproved.get(platform.id) || 0
      const approvedPreviousMonth = previousApproved.get(platform.id) || 0
      const points = currentPoints.get(platform.id) || 0
      const previousPeriodPoints = previousPoints.get(platform.id) || 0
      const trend = approvedPreviousMonth
        ? Math.round((approvedThisMonth - approvedPreviousMonth) / approvedPreviousMonth * 100)
        : approvedThisMonth ? 100 : 0
      const pointsTrend = previousPeriodPoints
        ? Math.round((points - previousPeriodPoints) / previousPeriodPoints * 100)
        : points ? 100 : 0
      const stale = stalePending.get(platform.id) || 0
      const reportStats = reports.get(platform.id) || { total: 0, approved: 0, pending: 0 }
      const evaluation = evaluations.get(platform.id) || { score: null, count: 0 }

      const health = calculatePlatformHealth({
        hasManager: Boolean(manager),
        managerHasLoggedIn: Boolean(manager?.lastLoginAt),
        memberCount,
        activeRate,
        stalePending: stale,
        activityTrend: trend,
        reportCount: reportStats.total,
        approvedReportCount: reportStats.approved,
      })

      return {
        platformId: platform.id,
        platformName: platform.name,
        platformSlug: platform.slug,
        color: platform.color,
        memberCount,
        activeMembers,
        activeRate,
        pendingCount: pendingCount.get(platform.id) || 0,
        stalePending: stale,
        totalApproved: totalApproved.get(platform.id) || 0,
        thisMonthApproved: approvedThisMonth,
        trend,
        points,
        pointsTrend,
        healthScore: health.score,
        healthStatus: health.status,
        managedBy: manager?.fullName || null,
        managedByEmail: manager?.email || null,
        managerLastLoginAt: manager?.lastLoginAt || null,
        managerStartedAt: activeManagerAssignment?.startedAt || null,
        reports: reportStats,
        evaluation,
        content: platform._count,
      }
    })

    const ranked = [...data].sort((a, b) => b.points - a.points)
    const totals = {
      platforms: data.length,
      totalMembers: data.reduce((sum, row) => sum + row.memberCount, 0),
      totalPending: data.reduce((sum, row) => sum + row.pendingCount, 0),
      totalApproved: data.reduce((sum, row) => sum + row.totalApproved, 0),
      totalPoints: data.reduce((sum, row) => sum + row.points, 0),
      mostActive: ranked[0]?.platformName || '—',
      mostAtRisk: data.filter(row => row.healthStatus === 'CRITICAL').length,
      withoutManager: data.filter(row => !row.managedBy).length,
      unassignedMembers,
      unscopedLogs,
    }

    return NextResponse.json({
      success: true,
      data: {
        platforms: data,
        totals,
        period: { year, month, previousYear: previousDate.getFullYear(), previousMonth: previousDate.getMonth() + 1 },
      },
    })
  } catch (error) {
    logger.error('Platforms overview error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}
