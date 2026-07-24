/**
 * API الملخص التنفيذي الذكي للتقارير
 * POST /api/admin/ai/report-summary — للـ SUPER_ADMIN فقط
 */

import { NextRequest, NextResponse } from 'next/server'
import { ai } from '@/lib/ai/gemini'
import { requireSuperAdmin } from '@/lib/auth-helpers'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return auth.error

  try {
    const body = await request.json()
    const { periodName, totalPoints, activeMembers, totalActivities, topMember, topMemberPoints, topPlatform, topPlatformApproved, memberCount, platformCount, pendingCount } = body

    if (!periodName) {
      return NextResponse.json({ success: false, message: 'اسم الفترة مطلوب' }, { status: 400 })
    }

    if (!ai.isConfigured()) {
      return NextResponse.json({ success: false, message: 'مفتاح Gemini غير مضبوط — راجع إعدادات البيئة' }, { status: 503 })
    }

    const text = await ai.reportSummary({
      periodName, totalPoints: totalPoints || 0, activeMembers: activeMembers || 0,
      totalActivities: totalActivities || 0, topMember: topMember || '—', topMemberPoints: topMemberPoints || 0,
      topPlatform: topPlatform || '—', topPlatformApproved: topPlatformApproved || 0,
      memberCount: memberCount || 0, platformCount: platformCount || 0, pendingCount: pendingCount || 0,
    }, auth.user.id)

    return NextResponse.json({ success: true, data: { text } })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Budget exceeded') {
      return NextResponse.json({ success: false, message: 'تم تجاوز السقف الشهري لاستهلاك الذكاء الاصطناعي' }, { status: 429 })
    }
    logger.error('[ai] report-summary error', error)
    return NextResponse.json({ success: false, message: 'فشل توليد الملخص — حاول لاحقاً' }, { status: 500 })
  }
}
