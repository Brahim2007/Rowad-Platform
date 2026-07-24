import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'
import { ai } from '@/lib/ai/gemini'
import { buildImpactReportMetrics, getImpactReportPeriod, impactReportRequestSchema } from '@/lib/ai/impact-report'
import { logger } from '@/lib/logger'
import { archiveAiReport } from '@/lib/institutional-archive'
import { createNotification } from '@/lib/notifications'

const DEFAULT_QUALITY_BONUS: Record<string, number> = {
  WEAK: -3,
  ACCEPTABLE: 0,
  GOOD: 3,
  EXCELLENT: 6,
  EXCEPTIONAL: 10,
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error
  if (auth.user.role !== 'SUPER_ADMIN' && auth.user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, message: 'إدارة النظام فقط' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get('page')) || 1)
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get('pageSize')) || 30))
    const search = (searchParams.get('search') || '').trim().slice(0, 100)
    const year = Number(searchParams.get('year')) || 0
    const scope = searchParams.get('scope')
    const where: Prisma.AiGeneratedReportWhereInput = {
      ...(search && { title: { contains: search, mode: 'insensitive' as const } }),
      ...(year >= 2020 && year <= 2100 && { periodYear: year }),
      ...(scope === 'network' && { platformId: null }),
      ...(scope === 'platform' && { platformId: { not: null } }),
    }
    const [reports, total] = await Promise.all([
      prisma.aiGeneratedReport.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          title: true,
          periodType: true,
          periodYear: true,
          periodMonth: true,
          platformId: true,
          networkRole: true,
          createdAt: true,
        },
      }),
      prisma.aiGeneratedReport.count({ where }),
    ])
    return NextResponse.json({
      success: true,
      data: reports.map(report => ({
        ...report,
        reportScope: report.platformId ? 'PLATFORM' : 'NETWORK',
      })),
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    })
  } catch (error) {
    logger.error('[ai] impact-report list error', error)
    return NextResponse.json({ success: false, message: 'تعذر تحميل سجل التقارير الذكية' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error
  if (auth.user.role !== 'SUPER_ADMIN' && auth.user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, message: 'إدارة النظام فقط' }, { status: 403 })
  }

  try {
    const parsed = impactReportRequestSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({
        success: false,
        message: 'بيانات فترة التقرير غير صالحة',
        errors: parsed.error.flatten().fieldErrors,
      }, { status: 400 })
    }

    if (!ai.isConfigured()) {
      return NextResponse.json({ success: false, message: 'مفتاح Gemini غير مضبوط' }, { status: 503 })
    }

    const input = parsed.data
    const monthlyPlatformKey =
      input.periodType === 'monthly' && input.platformId && input.month
        ? `${input.platformId}:${input.year}-${String(input.month).padStart(2, '0')}`
        : null

    let reportPlatform: { id: string; name: string; slug: string } | null = null
    if (input.platformId) {
      reportPlatform = await prisma.platform.findFirst({
        where: { id: input.platformId, isActive: true },
        select: { id: true, name: true, slug: true },
      })
      if (!reportPlatform) {
        return NextResponse.json({ success: false, message: 'المنصة غير موجودة أو غير نشطة' }, { status: 404 })
      }
    }

    if (monthlyPlatformKey) {
      const existing = await prisma.aiGeneratedReport.findFirst({
        where: {
          platformId: input.platformId,
          periodType: 'monthly',
          periodYear: input.year,
          periodMonth: input.month,
        },
        orderBy: { createdAt: 'desc' },
        select: { id: true, createdAt: true },
      })
      if (existing) {
        return NextResponse.json({
          success: false,
          message: 'تسمح السياسة بتقرير ذكي واحد فقط لكل منصة خلال الشهر المحدد',
          code: 'MONTHLY_PLATFORM_REPORT_EXISTS',
          existingReportId: existing.id,
          generatedAt: existing.createdAt.toISOString(),
        }, { status: 409 })
      }
    }

    const period = getImpactReportPeriod(input)
    const memberWhere = {
      ...(input.platformId && { platformId: input.platformId }),
      ...(input.networkRole && { networkRole: input.networkRole }),
    }

    const [members, logs, settings] = await Promise.all([
      prisma.beneficiary.findMany({
        where: memberWhere,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          networkRole: true,
          platformId: true,
          platform: { select: { name: true } },
        },
      }),
      prisma.impactLog.findMany({
        where: {
          date: { gte: period.previousStart, lt: period.end },
          beneficiary: memberWhere,
        },
        select: {
          beneficiaryId: true,
          date: true,
          count: true,
          quality: true,
          status: true,
          pointsSnapshot: true,
          action: { select: { name: true, points: true, category: true } },
        },
      }),
      prisma.impactSettings.findUnique({ where: { id: 1 }, select: { qualityBonus: true } }),
    ])

    let qualityBonus = DEFAULT_QUALITY_BONUS
    if (settings?.qualityBonus) {
      try {
        qualityBonus = { ...DEFAULT_QUALITY_BONUS, ...JSON.parse(settings.qualityBonus) }
      } catch {
        logger.warn('[ai] invalid impact quality bonus settings; using defaults')
      }
    }

    const metrics = buildImpactReportMetrics({
      members,
      logs: logs.map(log => ({ ...log, quality: String(log.quality), status: String(log.status), action: { ...log.action, category: String(log.action.category) } })),
      period,
      qualityBonus,
    })
    const generatedReport = await ai.impactReport(metrics, auth.user.id, {
      scope: input.reportScope,
      platformName: reportPlatform?.name,
    })
    const report = {
      ...generatedReport,
      title: input.reportScope === 'platform'
        ? `تقرير أداء ${reportPlatform!.name} — ${period.label}`
        : `تقرير أداء شبكة رواد — الكلي — ${period.label}`,
    }
    const savedReport = await prisma.aiGeneratedReport.create({
      data: {
        title: report.title,
        periodType: input.periodType,
        periodYear: input.year,
        periodMonth: input.periodType === 'monthly' ? input.month : null,
        platformId: input.platformId || null,
        monthlyPlatformKey,
        networkRole: input.networkRole || null,
        reportJson: JSON.stringify(report),
        metricsJson: JSON.stringify(metrics),
        generatedBy: auth.user.id,
      },
      select: { id: true, createdAt: true },
    })
    await archiveAiReport({
      id: savedReport.id,
      title: report.title,
      reportJson: JSON.stringify(report),
      periodYear: input.year,
      periodMonth: input.periodType === 'monthly' ? input.month || null : null,
      platformId: input.platformId || null,
    }, auth.user)

    if (reportPlatform && input.periodType === 'monthly') {
      const managers = await prisma.platformManagerAssignment.findMany({
        where: {
          platformId: reportPlatform.id,
          endedAt: null,
          adminUser: { isActive: true },
        },
        select: { adminUserId: true },
      })
      for (const manager of managers) {
        await createNotification({
          recipientId: manager.adminUserId,
          recipientType: 'PLATFORM_MANAGER',
          type: 'SYSTEM_ALERT',
          title: `صدر التقرير الذكي لمنصة ${reportPlatform.name}`,
          body: `أصبح تقرير ${period.label} متاحًا للعرض في لوحة المنصة.`,
          link: '/admin/my-platform?tab=reports',
          senderId: auth.user.id,
          senderName: auth.user.name,
        })
      }

      await prisma.notification.updateMany({
        where: {
          recipientType: 'ADMIN',
          type: 'SYSTEM_ALERT',
          title: `تقرير ${reportPlatform.name} الذكي مستحق`,
          isRead: false,
        },
        data: { isRead: true, readAt: new Date() },
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: savedReport.id,
        report,
        metrics,
        generatedAt: savedReport.createdAt.toISOString(),
        reportScope: input.reportScope === 'platform' ? 'PLATFORM' : 'NETWORK',
        platformName: reportPlatform?.name || null,
        source: 'full-period-server-data',
      },
    })
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({
        success: false,
        message: 'تم إنشاء تقرير هذه المنصة لهذا الشهر بالفعل؛ لا يمكن إنشاء تقرير ثانٍ وفق السياسة',
        code: 'MONTHLY_PLATFORM_REPORT_EXISTS',
      }, { status: 409 })
    }
    if (error instanceof Error && error.message === 'Budget exceeded') {
      return NextResponse.json({ success: false, message: 'تم تجاوز السقف الشهري لاستهلاك الذكاء الاصطناعي' }, { status: 429 })
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ success: false, message: 'تعذر قراءة الطلب أو استجابة الذكاء الاصطناعي' }, { status: 502 })
    }
    logger.error('[ai] impact-report error', error)
    return NextResponse.json({ success: false, message: 'فشل إنشاء التقرير الذكي الموسع' }, { status: 500 })
  }
}
