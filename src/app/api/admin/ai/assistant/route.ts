/**
 * مساعد الإدارة العليا — استعلام بلغة طبيعية
 * POST /api/admin/ai/assistant — للـ SUPER_ADMIN فقط
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ai } from '@/lib/ai/deepseek'
import { requireSuperAdmin } from '@/lib/auth-helpers'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const assistantRequestSchema = z.object({ question: z.string().trim().min(2).max(1000) })

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return auth.error

  try {
    const parsed = assistantRequestSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ success: false, message: 'السؤال مطلوب وبحد أقصى 1000 حرف' }, { status: 400 })
    const { question } = parsed.data

    if (!ai.isConfigured()) {
      return NextResponse.json({ success: false, message: 'مفتاح DeepSeek غير مضبوط' }, { status: 503 })
    }

    // جمع بيانات النظام الحالية — استعلامات محددة سلفاً فقط، لا SQL حر
    const now = new Date()
    const curYear = now.getFullYear()
    const curMonth = now.getMonth() + 1
    const currentStart = new Date(curYear, curMonth - 1, 1)
    const previousStart = new Date(curYear, curMonth - 2, 1)

    const [
      platforms,
      totalMembers,
      activeMembers,
      pendingCount,
      impactLogsThisMonth,
    ] = await Promise.all([
      prisma.platform.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { sortOrder: 'asc' } }),
      prisma.beneficiary.count({ where: { status: 'ACTIVE' } }),
      prisma.beneficiary.count({ where: { status: 'ACTIVE', impactLogs: { some: { date: { gte: currentStart } } } } }),
      prisma.impactLog.count({ where: { status: 'PENDING_REVIEW' } }),
      prisma.impactLog.findMany({
        where: { date: { gte: previousStart } },
        select: {
          status: true, platformId: true, beneficiaryId: true, date: true,
          beneficiary: { select: { firstName: true, lastName: true } },
          action: { select: { category: true } },
        },
      }),
    ])

    const currentLogs = impactLogsThisMonth.filter(log => log.date >= currentStart)
    const previousLogs = impactLogsThisMonth.filter(log => log.date >= previousStart && log.date < currentStart)

    // تجميعات لكل منصة
    const platformStats = platforms.map((p) => {
      const platformLogs = currentLogs.filter((l) => l.platformId === p.id)
      const previousPlatformLogs = previousLogs.filter((l) => l.platformId === p.id)
      const approved = platformLogs.filter((l) => l.status === 'APPROVED').length
      const pending = platformLogs.filter((l) => l.status === 'PENDING_REVIEW').length
      const active = new Set(platformLogs.map((l) => l.beneficiaryId).filter(Boolean)).size
      return { name: p.name, approved, pending, active, activities: platformLogs.length, previousActivities: previousPlatformLogs.length }
    })

    const memberActivity = new Map<string, { name: string; activities: number }>()
    for (const log of currentLogs.filter(item => item.status === 'APPROVED')) {
      const name = `${log.beneficiary.firstName} ${log.beneficiary.lastName}`.trim()
      const current = memberActivity.get(log.beneficiaryId) || { name, activities: 0 }
      current.activities += 1
      memberActivity.set(log.beneficiaryId, current)
    }
    const topMembers = [...memberActivity.values()].sort((a, b) => b.activities - a.activities).slice(0, 5)

    const categories = Object.entries(currentLogs.reduce<Record<string, number>>((acc, log) => {
      const category = String(log.action.category)
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {})).map(([category, activities]) => ({ category, activities }))

    const contextData = {
      date: `${curYear}-${String(curMonth).padStart(2, '0')}`,
      platforms: platformStats,
      topMembers,
      categories,
      totals: {
        platforms: platforms.length,
        members: totalMembers,
        activeMembers,
        pendingActivities: pendingCount,
        activitiesThisMonth: currentLogs.length,
        approvedThisMonth: currentLogs.filter((l) => l.status === 'APPROVED').length,
        rejectedThisMonth: currentLogs.filter((l) => l.status === 'REJECTED').length,
        previousMonthActivities: previousLogs.length,
        previousMonthApproved: previousLogs.filter((l) => l.status === 'APPROVED').length,
      },
    }

    const answer = await ai.assistant(question, contextData, auth.user.id)

    return NextResponse.json({ success: true, data: { answer, context: contextData } })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Budget exceeded') {
      return NextResponse.json({ success: false, message: 'تم تجاوز السقف الشهري' }, { status: 429 })
    }
    logger.error('[ai] assistant error', error)
    return NextResponse.json({ success: false, message: 'فشل معالجة السؤال' }, { status: 500 })
  }
}
