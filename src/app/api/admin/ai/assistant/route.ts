/**
 * مساعد الإدارة العليا — استعلام بلغة طبيعية
 * POST /api/admin/ai/assistant — للـ SUPER_ADMIN فقط
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ai } from '@/lib/ai/deepseek'
import { requireSuperAdmin } from '@/lib/auth-helpers'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return auth.error

  try {
    const { question } = await request.json()
    if (!question?.trim()) {
      return NextResponse.json({ success: false, message: 'السؤال مطلوب' }, { status: 400 })
    }

    if (!ai.isConfigured()) {
      return NextResponse.json({ success: false, message: 'مفتاح DeepSeek غير مضبوط' }, { status: 503 })
    }

    // جمع بيانات النظام الحالية — استعلامات محددة سلفاً فقط، لا SQL حر
    const now = new Date()
    const curYear = now.getFullYear()
    const curMonth = now.getMonth() + 1

    const [
      platforms,
      totalMembers,
      activeMembers,
      pendingCount,
      impactLogsThisMonth,
    ] = await Promise.all([
      prisma.platform.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { sortOrder: 'asc' } }),
      prisma.beneficiary.count({ where: { status: 'ACTIVE' } }),
      prisma.beneficiary.count({ where: { status: 'ACTIVE', impactLogs: { some: { date: { gte: new Date(curYear, curMonth - 1, 1) } } } } }),
      prisma.impactLog.count({ where: { status: 'PENDING_REVIEW' } }),
      prisma.impactLog.findMany({
        where: { date: { gte: new Date(curYear, curMonth - 1, 1) } },
        select: { status: true, platformId: true, beneficiaryId: true },
      }),
    ])

    // تجميعات لكل منصة
    const platformStats = platforms.map((p) => {
      const platformLogs = impactLogsThisMonth.filter((l) => l.platformId === p.id)
      const approved = platformLogs.filter((l) => l.status === 'APPROVED').length
      const pending = platformLogs.filter((l) => l.status === 'PENDING_REVIEW').length
      const active = new Set(platformLogs.map((l) => l.beneficiaryId).filter(Boolean)).size
      return { name: p.name, approved, pending, active }
    })

    const contextData = {
      date: `${curYear}-${String(curMonth).padStart(2, '0')}`,
      platforms: platformStats,
      totals: {
        platforms: platforms.length,
        members: totalMembers,
        activeMembers,
        pendingActivities: pendingCount,
        activitiesThisMonth: impactLogsThisMonth.length,
        approvedThisMonth: impactLogsThisMonth.filter((l) => l.status === 'APPROVED').length,
      },
    }

    const answer = await ai.assistant(question.trim(), contextData, auth.user.id)

    return NextResponse.json({ success: true, data: { answer, context: contextData } })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Budget exceeded') {
      return NextResponse.json({ success: false, message: 'تم تجاوز السقف الشهري' }, { status: 429 })
    }
    logger.error('[ai] assistant error', error)
    return NextResponse.json({ success: false, message: 'فشل معالجة السؤال' }, { status: 500 })
  }
}
