import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'
import { logger } from '@/lib/logger'

async function requireGlobalDashboardAccess() {
  const auth = await requireAuth()
  if (!auth.ok) return auth
  if (auth.user.role === 'PLATFORM_MANAGER' || auth.user.role === 'EDITOR') {
    return {
      ok: false as const,
      error: NextResponse.json({ success: false, message: 'غير مصرح — لوحة الشبكة متاحة للإدارة فقط' }, { status: 403 }),
    }
  }
  return auth
}

export async function GET() {
  const auth = await requireGlobalDashboardAccess()
  if (!auth.ok) return auth.error

  try {
    // ─── All queries in a single parallel batch ───
    const [
      totalBeneficiaries,
      activeBeneficiaries,
      totalPlatforms,
      totalPrograms,
      totalActivities,
      totalProjects,
      totalTeam,
      totalKnowledge,
      totalTemplates,
      totalReports,
      totalTasks,
      partners,
      evaluations,
      journeyStages,
      platformIndicators,
      programIndicatorsList,
      platforms,
      recentBeneficiaries,
      taskStatuses,
      totalWithEmail,
      totalWithPhone,
      totalWithGender,
      totalWithCountry,
      totalWithEducation,
      duplicateEmails,
      genderCounts,
      educationCounts,
      beneficiariesWithInterests,
      evaluationsData,
    ] = await Promise.all([
      prisma.beneficiary.count(),
      prisma.beneficiary.count({ where: { status: 'ACTIVE' } }),
      prisma.platform.count({ where: { isActive: true } }),
      prisma.program.count({ where: { isActive: true } }),
      prisma.activity.count({ where: { isActive: true } }),
      prisma.project.count(),
      prisma.beneficiary.count({ where: { type: 'TEAM', status: 'ACTIVE' } }),
      prisma.knowledgeItem.count({ where: { isPublished: true } }),
      prisma.reportTemplate.count({ where: { isActive: true } }),
      prisma.submittedReport.count(),
      prisma.coordinationTask.count(),
      prisma.partner.count({ where: { isActive: true } }),
      prisma.evaluation.count(),
      prisma.beneficiaryJourneyStage.groupBy({
        by: ['stage'],
        _count: { stage: true },
        orderBy: { stage: 'asc' },
      }),
      prisma.platformIndicator.findMany({
        orderBy: { createdAt: 'desc' },
        include: { platform: { select: { name: true, slug: true, color: true } } },
      }),
      prisma.programIndicator.findMany({
        orderBy: { createdAt: 'desc' },
        include: { program: { select: { name: true, slug: true } } },
      }),
      prisma.platform.findMany({
        where: { isActive: true },
        include: {
          _count: { select: { programs: true, projects: true } },
          programs: { select: { id: true } },
        },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.beneficiary.findMany({
        take: 10,
        orderBy: { registeredAt: 'desc' },
        include: {
          beneficiaryJourneyStages: { orderBy: { stage: 'desc' }, take: 1 },
          _count: { select: { enrollments: true, participations: true } },
        },
      }),
      prisma.coordinationTask.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.beneficiary.count({ where: { email: { not: null } } }),
      prisma.beneficiary.count({ where: { phone: { not: null } } }),
      prisma.beneficiary.count({ where: { gender: { not: null } } }),
      prisma.beneficiary.count({ where: { country: { not: null } } }),
      prisma.beneficiary.count({ where: { educationLevel: { not: null } } }),
      prisma.beneficiary.groupBy({
        by: ['email'],
        _count: { email: true },
        where: { email: { not: null } },
      }),
      prisma.beneficiary.groupBy({
        by: ['gender'],
        _count: { gender: true },
        where: { gender: { not: null } },
      }),
      prisma.beneficiary.groupBy({
        by: ['educationLevel'],
        _count: { educationLevel: true },
        where: { educationLevel: { not: null } },
      }),
      prisma.beneficiary.findMany({
        where: { interests: { not: null } },
        select: { interests: true },
        take: 200,
      }),
      prisma.evaluation.findMany({
        where: { score: { not: null }, status: { not: 'DRAFT' } },
        select: { score: true, maxScore: true },
      }),
    ])

    const dataQuality = totalBeneficiaries > 0
      ? Math.round(
          ((totalWithEmail + totalWithPhone + totalWithGender + totalWithCountry + totalWithEducation) /
            (totalBeneficiaries * 5)) *
            1000
        ) / 10
      : 0

    const duplicateCount = duplicateEmails.filter(e => e._count.email > 1).length
    const duplicateRate = totalBeneficiaries > 0
      ? Math.round((duplicateCount / totalBeneficiaries) * 1000) / 10
      : 0

    const interestMap: Record<string, number> = {}
    for (const b of beneficiariesWithInterests) {
      try {
        const parsed = JSON.parse(b.interests || '[]')
        if (Array.isArray(parsed)) {
          for (const interest of parsed) {
            const key = typeof interest === 'string' ? interest : interest?.name || ''
            if (key) interestMap[key] = (interestMap[key] || 0) + 1
          }
        }
      } catch { /* skip unparseable interests */ }
    }
    const totalInterests = Object.values(interestMap).reduce((s, v) => s + v, 0)
    const interestTags = Object.entries(interestMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({
        name,
        pct: totalInterests > 0 ? Math.round((count / totalInterests) * 100) : 0,
      }))

    const avgScore = evaluationsData.length > 0
      ? Math.round(evaluationsData.reduce((s, e) => s + ((e.score || 0) / (e.maxScore || 100)) * 100, 0) / evaluationsData.length)
      : 0

    // ─── Platform live data ───
    const enrollmentCounts = await prisma.enrollment.groupBy({
      by: ['programId'],
      _count: { programId: true },
      where: {
        program: { platformId: { in: platforms.map(p => p.id) } },
      },
    })

    const platformEnrollments: Record<string, number> = {}
    for (const ec of enrollmentCounts) {
      const platformId = platforms.find(p => p.programs.some(pr => pr.id === ec.programId))?.id
      if (platformId) {
        platformEnrollments[platformId] = (platformEnrollments[platformId] || 0) + ec._count.programId
      }
    }

    const platformLiveData = platforms.map(p => {
      const totalHours = platformIndicators
        .filter(i => i.platform.slug === p.slug && i.indicatorKey === 'volunteer_hours')
        .reduce((sum, i) => sum + i.value, 0)

      const platformActivity = platformIndicators
        .filter(i => i.platform.slug === p.slug && (i.indicatorKey === 'activity_level' || i.indicatorKey === 'active_beneficiaries'))
        .reduce((sum, i) => sum + i.value, 0)

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        color: p.color,
        logo: p.logo,
        coverImage: p.coverImage,
        focus: p.description?.slice(0, 40) || '',
        members: platformEnrollments[p.id] || 0,
        programsCount: p._count.programs,
        projectsCount: p._count.projects,
        hoursLogged: totalHours > 0 ? totalHours.toLocaleString() : '0',
        activityLevel: platformActivity > 0 ? Math.min(Math.round(platformActivity), 100) : 0,
      }
    })

    // ─── Journey stage labels ───
    const stageLabels: Record<string, string> = {
      DISCOVERY: 'اكتشاف', APPLICATION: 'تقديم', ONBOARDING: 'تأهيل',
      ACTIVE: 'نشط', ADVANCED: 'متقدم', GRADUATED: 'متخرج',
      ALUMNI: 'خريج', CHAMPION: 'سفير',
    }

    const journeyFunnel = journeyStages.map(s => ({
      stage: s.stage,
      label: stageLabels[s.stage] || s.stage,
      count: s._count.stage,
    }))

    // ─── Impact indicators ───
    const activeValues = platformIndicators.filter(i => i.indicatorKey === 'active_beneficiaries')
    const totalActiveValue = activeValues.reduce((sum, i) => sum + i.value, 0)
    const totalTargetValue = activeValues.reduce((sum, i) => sum + (i.target || 0), 0)

    const completionIndicators = platformIndicators.filter(i => i.indicatorKey === 'completion_rate')
    const avgCompletion = completionIndicators.length > 0
      ? Math.round(completionIndicators.reduce((sum, i) => sum + i.value, 0) / completionIndicators.length)
      : 0

    const satisfactionIndicators = platformIndicators.filter(i => i.indicatorKey === 'satisfaction_score')
    const avgSatisfaction = satisfactionIndicators.length > 0
      ? (satisfactionIndicators.reduce((sum, i) => sum + i.value, 0) / satisfactionIndicators.length).toFixed(1)
      : '0'

    const retentionIndicators = platformIndicators.filter(i => i.indicatorKey === 'beneficiary_retention')
    const avgRetention = retentionIndicators.length > 0
      ? Math.round(retentionIndicators.reduce((sum, i) => sum + i.value, 0) / retentionIndicators.length)
      : 0

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalBeneficiaries, activeBeneficiaries, totalPlatforms, totalPrograms,
          totalActivities, totalProjects, totalTeam, totalKnowledge,
          totalTemplates, totalReports, totalTasks, partners, evaluations,
        },
        dataQuality,
        duplicateRate,
        genderCounts,
        educationCounts,
        interestTags,
        avgScore,
        journeyFunnel,
        impactIndicators: {
          avgRetention,
          avgSatisfaction: parseFloat(avgSatisfaction),
          avgCompletion,
          totalActiveValue,
          totalTargetValue,
        },
        platformLiveData,
        platformIndicators,
        programIndicators: programIndicatorsList,
        recentBeneficiaries: recentBeneficiaries.map(b => ({
          id: b.id,
          code: b.code,
          name: `${b.firstName} ${b.lastName}`,
          email: b.email,
          country: b.country,
          city: b.city,
          status: b.status,
          currentStage: b.beneficiaryJourneyStages[0]?.stage || null,
          enrollmentsCount: b._count.enrollments,
          participationsCount: b._count.participations,
          registeredAt: b.registeredAt,
        })),
        knowledgeCategories: [],
        taskStatuses,
      },
    })
  } catch (error) {
    logger.error('Dashboard API Error', error)
    return NextResponse.json(
      { success: false, message: 'خطأ في تحميل بيانات لوحة التحكم' },
      { status: 500 }
    )
  }
}
