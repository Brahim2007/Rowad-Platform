import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, verifyPlatformOwnership } from '@/lib/auth-helpers'
import { buildActionMap, finalPoints, QUALITY_BONUS, type ImpactQuality } from '@/lib/impact-scoring'
import { calculatePlatformHealth } from '@/lib/platform-health'
import { logger } from '@/lib/logger'

function monthRange(year: number, month: number) {
  return { start: new Date(year, month - 1, 1), end: new Date(year, month, 1) }
}

function percentChange(current: number, previous: number) {
  if (!previous) return current ? 100 : 0
  return Math.round((current - previous) / previous * 100)
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error

  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const now = new Date()
    const year = Number(searchParams.get('year')) || now.getFullYear()
    const month = Math.min(12, Math.max(1, Number(searchParams.get('month')) || now.getMonth() + 1))
    const current = monthRange(year, month)
    const previousDate = new Date(year, month - 2, 1)
    const previous = monthRange(previousDate.getFullYear(), previousDate.getMonth() + 1)
    const staleBefore = new Date(now.getTime() - 7 * 86400000)

    const platform = await prisma.platform.findUnique({
      where: { slug },
      select: {
        id: true, name: true, slug: true, description: true, vision: true,
        logo: true, color: true, isActive: true, createdAt: true,
        managerAssignments: {
          orderBy: { startedAt: 'desc' },
          take: 50,
          select: {
            id: true, assignmentRole: true, startedAt: true, endedAt: true, assignedBy: true, note: true,
            adminUser: {
              select: {
                id: true,
                fullName: true,
                email: true,
                isActive: true,
                lastLoginAt: true,
                createdAt: true,
              },
            },
          },
        },
        programs: {
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true, name: true, slug: true, isActive: true, startDate: true, endDate: true,
            _count: { select: { activities: true, enrollments: true, submittedReports: true } },
          },
        },
        projects: {
          orderBy: { createdAt: 'desc' },
          take: 12,
          select: { id: true, title: true, slug: true, status: true, startDate: true, endDate: true },
        },
        platformIndicators: {
          orderBy: { recordedAt: 'desc' },
          take: 30,
          select: { id: true, indicatorKey: true, indicatorName: true, value: true, target: true, unit: true, period: true, recordedAt: true },
        },
      },
    })

    if (!platform) return NextResponse.json({ success: false, message: 'المنصة غير موجودة' }, { status: 404 })
    if (!(await verifyPlatformOwnership(auth.user, platform.id))) {
      return NextResponse.json({ success: false, message: 'غير مصرح — خارج نطاق المنصة' }, { status: 403 })
    }

    const [
      members,
      logs,
      pendingLogs,
      recentReports,
      recentDocuments,
      evaluations,
      openTasks,
      settings,
      logsWithoutPlatform,
    ] = await Promise.all([
      prisma.beneficiary.findMany({
        where: { platformId: platform.id, status: 'ACTIVE' },
        orderBy: { registeredAt: 'desc' },
        select: {
          id: true, code: true, firstName: true, lastName: true, email: true,
          networkRole: true, joinDate: true, registeredAt: true,
        },
      }),
      prisma.impactLog.findMany({
        where: { platformId: platform.id, date: { gte: previous.start, lt: current.end } },
        orderBy: { date: 'desc' },
        select: {
          id: true, beneficiaryId: true, actionId: true, count: true, quality: true,
          status: true, date: true, pointsSnapshot: true, note: true, rejectionReason: true,
          action: { select: { id: true, name: true, points: true, category: true, note: true, isActive: true, sortOrder: true } },
          beneficiary: { select: { firstName: true, lastName: true, code: true, platformId: true } },
        },
      }),
      prisma.impactLog.findMany({
        where: { platformId: platform.id, status: 'PENDING_REVIEW' },
        orderBy: { date: 'asc' },
        take: 100,
        select: {
          id: true, date: true, note: true,
          action: { select: { name: true } },
          beneficiary: { select: { firstName: true, lastName: true, code: true } },
        },
      }),
      prisma.submittedReport.findMany({
        where: { platformId: platform.id },
        orderBy: { createdAt: 'desc' },
        take: 12,
        select: {
          id: true, status: true, submittedBy: true, submittedAt: true, reviewedAt: true, createdAt: true,
          template: { select: { title: true, category: true } },
        },
      }),
      prisma.document.findMany({
        where: { platformId: platform.id },
        orderBy: { createdAt: 'desc' },
        take: 12,
        select: { id: true, title: true, type: true, status: true, periodYear: true, periodMonth: true, createdAt: true },
      }),
      prisma.evaluation.findMany({
        where: { platformId: platform.id },
        orderBy: { evaluatedAt: 'desc' },
        take: 12,
        select: { id: true, title: true, type: true, score: true, maxScore: true, status: true, evaluatedAt: true, recommendations: true },
      }),
      prisma.coordinationTask.findMany({
        where: { platformId: platform.id, status: { in: ['PENDING', 'IN_PROGRESS'] } },
        orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
        take: 20,
        select: { id: true, title: true, status: true, priority: true, assignee: true, dueDate: true },
      }),
      prisma.impactSettings.findUnique({ where: { id: 1 }, select: { qualityBonus: true } }),
      prisma.impactLog.count({
        where: { platformId: null, beneficiary: { platformId: platform.id } },
      }),
    ])

    const actions = Array.from(new Map(logs.filter(log => log.action).map(log => [log.action!.id, log.action!])).values())
    const actionMap = buildActionMap(actions as any)
    let qualityBonus = QUALITY_BONUS
    try {
      if (settings?.qualityBonus) qualityBonus = { ...QUALITY_BONUS, ...JSON.parse(settings.qualityBonus) } as Record<ImpactQuality, number>
    } catch { /* use defaults */ }

    const currentLogs = logs.filter(log => log.date >= current.start && log.date < current.end)
    const previousLogs = logs.filter(log => log.date >= previous.start && log.date < previous.end)
    const currentApproved = currentLogs.filter(log => log.status === 'APPROVED')
    const previousApproved = previousLogs.filter(log => log.status === 'APPROVED')
    const currentPoints = currentApproved.reduce((sum, log) => sum + (log.pointsSnapshot ?? finalPoints(log as any, actionMap, qualityBonus)), 0)
    const previousPoints = previousApproved.reduce((sum, log) => sum + (log.pointsSnapshot ?? finalPoints(log as any, actionMap, qualityBonus)), 0)
    const memberIdSet = new Set(members.map(member => member.id))
    const activeMemberIds = new Set(currentApproved.filter(log => memberIdSet.has(log.beneficiaryId)).map(log => log.beneficiaryId))
    const activeRate = members.length ? Math.round(activeMemberIds.size / members.length * 100) : 0

    const memberStats = new Map<string, { points: number; activities: number; lastActivity: Date | null }>()
    for (const log of currentApproved) {
      if (!memberIdSet.has(log.beneficiaryId)) continue
      const bucket = memberStats.get(log.beneficiaryId) || { points: 0, activities: 0, lastActivity: null }
      bucket.points += log.pointsSnapshot ?? finalPoints(log as any, actionMap, qualityBonus)
      bucket.activities += 1
      if (!bucket.lastActivity || log.date > bucket.lastActivity) bucket.lastActivity = log.date
      memberStats.set(log.beneficiaryId, bucket)
    }

    const enrichedMembers = members.map(member => {
      const stats = memberStats.get(member.id) || { points: 0, activities: 0, lastActivity: null }
      return {
        ...member,
        name: `${member.firstName} ${member.lastName}`.trim(),
        ...stats,
        isActiveInPeriod: stats.activities > 0,
      }
    })
    const topMembers = [...enrichedMembers].sort((a, b) => b.points - a.points).slice(0, 10)
    const inactiveMembers = enrichedMembers.filter(member => !member.isActiveInPeriod).slice(0, 20)

    const activeManagerAssignment = platform.managerAssignments.find(
      assignment => !assignment.endedAt && assignment.assignmentRole === 'PRIMARY',
    )
    const manager = activeManagerAssignment?.adminUser || null
    const stalePending = pendingLogs.filter(log => log.date < staleBefore)
    const reportCounts = recentReports.reduce((acc, report) => {
      acc.total += 1
      if (report.status === 'APPROVED') acc.approved += 1
      if (report.status === 'DRAFT' || report.status === 'SUBMITTED' || report.status === 'REVIEWED') acc.pending += 1
      return acc
    }, { total: 0, approved: 0, pending: 0 })
    const finalEvaluations = evaluations.filter(evaluation => evaluation.score !== null && (evaluation.status === 'FINAL' || evaluation.status === 'APPROVED'))
    const evaluationScore = finalEvaluations.length
      ? Math.round(finalEvaluations.reduce((sum, evaluation) => sum + ((evaluation.score || 0) / evaluation.maxScore * 100), 0) / finalEvaluations.length)
      : null
    const overdueTasks = openTasks.filter(task => task.dueDate && task.dueDate < now)

    const alerts: Array<{ severity: 'danger' | 'warning' | 'info'; code: string; title: string; detail: string; target: string }> = []
    if (!manager) alerts.push({ severity: 'danger', code: 'NO_MANAGER', title: 'لا يوجد مدير للمنصة', detail: 'عيّن مديرًا أساسيًا حتى تكون المسؤولية التشغيلية واضحة.', target: 'manager' })
    else if (!manager.lastLoginAt) alerts.push({ severity: 'warning', code: 'MANAGER_NEVER_LOGGED_IN', title: 'مدير المنصة لم يسجل الدخول', detail: manager.fullName, target: 'manager' })
    if (!members.length) alerts.push({ severity: 'danger', code: 'NO_MEMBERS', title: 'لا يوجد أعضاء نشطون', detail: 'المنصة لا تحتوي على أعضاء مرتبطين بها.', target: 'members' })
    else if (activeRate < 30) alerts.push({ severity: 'warning', code: 'LOW_ENGAGEMENT', title: 'مشاركة الأعضاء منخفضة', detail: `${activeRate}% فقط نشطون في الفترة`, target: 'members' })
    if (stalePending.length) alerts.push({ severity: 'danger', code: 'STALE_PENDING', title: 'أنشطة متأخرة في الاعتماد', detail: `${stalePending.length} نشاطًا معلقًا منذ أكثر من 7 أيام`, target: 'activities' })
    if (reportCounts.total > 0 && reportCounts.approved === 0) alerts.push({ severity: 'warning', code: 'NO_APPROVED_REPORTS', title: 'لا توجد تقارير معتمدة', detail: `${reportCounts.pending} تقارير ما زالت ضمن دورة المراجعة`, target: 'reports' })
    if (overdueTasks.length) alerts.push({ severity: 'danger', code: 'OVERDUE_TASKS', title: 'مهام متأخرة', detail: `${overdueTasks.length} مهام تجاوزت موعدها`, target: 'tasks' })
    if (logsWithoutPlatform) alerts.push({ severity: 'warning', code: 'UNSCOPED_LOGS', title: 'سجلات أثر غير مرتبطة بالمنصة', detail: `${logsWithoutPlatform} سجلًا لأعضاء المنصة يحتاج مراجعة`, target: 'activities' })

    const healthResult = calculatePlatformHealth({
      hasManager: Boolean(manager),
      managerHasLoggedIn: Boolean(manager?.lastLoginAt),
      memberCount: members.length,
      activeRate,
      stalePending: stalePending.length,
      activityTrend: percentChange(currentApproved.length, previousApproved.length),
      reportCount: reportCounts.total,
      approvedReportCount: reportCounts.approved,
    })

    const latestIndicators = Array.from(new Map(platform.platformIndicators.map(indicator => [indicator.indicatorKey, indicator])).values())

    return NextResponse.json({
      success: true,
      data: {
        platform: {
          id: platform.id, name: platform.name, slug: platform.slug, description: platform.description,
          vision: platform.vision, logo: platform.logo, color: platform.color, isActive: platform.isActive,
        },
        period: { year, month, previousYear: previousDate.getFullYear(), previousMonth: previousDate.getMonth() + 1 },
        health: {
          score: healthResult.score,
          status: healthResult.status,
          alerts,
        },
        manager,
        managerHistory: platform.managerAssignments,
        kpis: {
          members: members.length,
          activeMembers: activeMemberIds.size,
          activeRate,
          activities: currentLogs.length,
          approvedActivities: currentApproved.length,
          pendingActivities: pendingLogs.length,
          stalePending: stalePending.length,
          approvalRate: currentLogs.length ? Math.round(currentApproved.length / currentLogs.length * 100) : 0,
          points: currentPoints,
          pointsTrend: percentChange(currentPoints, previousPoints),
          activitiesTrend: percentChange(currentApproved.length, previousApproved.length),
          reports: reportCounts,
          documents: recentDocuments.length,
          evaluationScore,
          openTasks: openTasks.length,
          overdueTasks: overdueTasks.length,
        },
        members: { top: topMembers, inactive: inactiveMembers, recent: enrichedMembers.slice(0, 20) },
        activities: {
          recent: currentLogs.slice(0, 30).map(log => ({
            id: log.id,
            memberName: log.beneficiary ? `${log.beneficiary.firstName} ${log.beneficiary.lastName}`.trim() : '—',
            memberCode: log.beneficiary?.code || '—',
            actionName: log.action?.name || '—',
            status: log.status,
            date: log.date,
            points: log.status === 'APPROVED' ? (log.pointsSnapshot ?? finalPoints(log as any, actionMap, qualityBonus)) : 0,
            note: log.note,
            rejectionReason: log.rejectionReason,
          })),
          pending: pendingLogs,
        },
        programs: platform.programs,
        projects: platform.projects,
        reports: recentReports,
        documents: recentDocuments,
        evaluations,
        tasks: openTasks,
        indicators: latestIndicators,
        dataQuality: { logsWithoutPlatform },
      },
    })
  } catch (error) {
    logger.error('Platform monitoring detail error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}
