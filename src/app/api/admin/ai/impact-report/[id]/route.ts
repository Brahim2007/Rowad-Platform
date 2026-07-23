import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'
import { smartImpactReportSchema, type ImpactReportMetrics } from '@/lib/ai/impact-report'
import { logger } from '@/lib/logger'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error
  if (auth.user.role !== 'SUPER_ADMIN' && auth.user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, message: 'إدارة النظام فقط' }, { status: 403 })
  }

  try {
    const { id } = await params
    const saved = await prisma.aiGeneratedReport.findUnique({ where: { id } })
    if (!saved) {
      return NextResponse.json({ success: false, message: 'التقرير الذكي غير موجود' }, { status: 404 })
    }

    const report = smartImpactReportSchema.parse(JSON.parse(saved.reportJson))
    const metrics = JSON.parse(saved.metricsJson) as ImpactReportMetrics
    return NextResponse.json({
      success: true,
      data: {
        id: saved.id,
        report,
        metrics,
        generatedAt: saved.createdAt.toISOString(),
        filters: {
          periodType: saved.periodType,
          year: saved.periodYear,
          month: saved.periodMonth,
          platformId: saved.platformId,
          networkRole: saved.networkRole,
        },
      },
    })
  } catch (error) {
    logger.error('[ai] impact-report details error', error)
    return NextResponse.json({ success: false, message: 'تعذر تحميل التقرير الذكي' }, { status: 500 })
  }
}
