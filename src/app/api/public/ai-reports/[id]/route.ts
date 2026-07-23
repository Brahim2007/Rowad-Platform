import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { smartImpactReportSchema, type ImpactReportMetrics } from '@/lib/ai/impact-report'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!id || id.length > 100) {
      return NextResponse.json({ success: false, message: 'رابط التقرير غير صالح' }, { status: 400 })
    }

    const saved = await prisma.aiGeneratedReport.findUnique({
      where: { id },
      select: {
        id: true,
        reportJson: true,
        metricsJson: true,
        createdAt: true,
      },
    })
    if (!saved) {
      return NextResponse.json({ success: false, message: 'التقرير الذكي غير موجود' }, { status: 404 })
    }

    const report = smartImpactReportSchema.parse(JSON.parse(saved.reportJson))
    const metrics = JSON.parse(saved.metricsJson) as ImpactReportMetrics
    const response = NextResponse.json({
      success: true,
      data: {
        id: saved.id,
        report,
        metrics,
        generatedAt: saved.createdAt.toISOString(),
      },
    })
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
    return response
  } catch (error) {
    logger.error('[public] ai impact-report details error', error)
    return NextResponse.json({ success: false, message: 'تعذر تحميل التقرير الذكي' }, { status: 500 })
  }
}
