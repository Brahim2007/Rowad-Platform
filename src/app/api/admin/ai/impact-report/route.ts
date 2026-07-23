import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSuperAdmin } from '@/lib/auth-helpers'
import { ai } from '@/lib/ai/deepseek'
import { buildImpactReportMetrics, getImpactReportPeriod, impactReportRequestSchema } from '@/lib/ai/impact-report'
import { logger } from '@/lib/logger'
import { archiveAiReport } from '@/lib/institutional-archive'

const DEFAULT_QUALITY_BONUS: Record<string, number> = {
  WEAK: -3,
  ACCEPTABLE: 0,
  GOOD: 3,
  EXCELLENT: 6,
  EXCEPTIONAL: 10,
}

export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get('page')) || 1)
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get('pageSize')) || 30))
    const search = (searchParams.get('search') || '').trim().slice(0, 100)
    const year = Number(searchParams.get('year')) || 0
    const where = {
      ...(search && { title: { contains: search, mode: 'insensitive' as const } }),
      ...(year >= 2020 && year <= 2100 && { periodYear: year }),
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
    return NextResponse.json({ success: true, data: reports, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } })
  } catch (error) {
    logger.error('[ai] impact-report list error', error)
    return NextResponse.json({ success: false, message: 'تعذر تحميل سجل التقارير الذكية' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return auth.error

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
      return NextResponse.json({ success: false, message: 'مفتاح DeepSeek غير مضبوط' }, { status: 503 })
    }

    const input = parsed.data
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
    const report = await ai.impactReport(metrics, auth.user.id)
    const savedReport = await prisma.aiGeneratedReport.create({
      data: {
        title: report.title,
        periodType: input.periodType,
        periodYear: input.year,
        periodMonth: input.periodType === 'monthly' ? input.month : null,
        platformId: input.platformId || null,
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

    return NextResponse.json({
      success: true,
      data: {
        id: savedReport.id,
        report,
        metrics,
        generatedAt: savedReport.createdAt.toISOString(),
        source: 'full-period-server-data',
      },
    })
  } catch (error: unknown) {
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
