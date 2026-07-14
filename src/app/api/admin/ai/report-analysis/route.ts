/**
 * API تحليل اتجاهات التقارير
 * POST /api/admin/ai/report-analysis — للـ SUPER_ADMIN فقط
 */

import { NextRequest, NextResponse } from 'next/server'
import { ai } from '@/lib/ai/deepseek'
import { requireSuperAdmin } from '@/lib/auth-helpers'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return auth.error

  try {
    const body = await request.json()
    const { periodName, current, previous, platforms } = body

    if (!current || !previous) {
      return NextResponse.json({ success: false, message: 'بيانات الشهر الحالي والسابق مطلوبة' }, { status: 400 })
    }

    if (!ai.isConfigured()) {
      return NextResponse.json({ success: false, message: 'مفتاح DeepSeek غير مضبوط' }, { status: 503 })
    }

    const result = await ai.reportAnalysis({
      periodName: periodName || 'الشهر الحالي',
      current, previous,
      platforms: platforms || [],
    }, auth.user.id)

    return NextResponse.json({ success: true, data: result })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Budget exceeded') {
      return NextResponse.json({ success: false, message: 'تم تجاوز السقف الشهري' }, { status: 429 })
    }
    logger.error('[ai] report-analysis error', error)
    return NextResponse.json({ success: false, message: 'فشل التحليل' }, { status: 500 })
  }
}
