/**
 * API بطاقة الرائد العامة — لا تحتاج تسجيل دخول
 * GET /api/member/portfolio?code=R-001
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { levelOf, nextLevelGap, levelProgress } from '@/lib/impact-scoring'
import { logger } from '@/lib/logger'
import { memberImpactTotals, memberLogPoints } from '@/lib/member-impact'

const CATEGORY_LABELS: Record<string, string> = {
  DIGITAL_ACTIVITY: 'النشاط الرقمي',
  SCIENTIFIC_EVENTS: 'المشاركة العلمية والفعاليات',
  INITIATIVES: 'المبادرات والإنتاج',
  DISCIPLINE: 'الالتزام والانضباط',
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    if (!code) {
      return NextResponse.json({ success: false, message: 'رمز العضو مطلوب' }, { status: 400 })
    }

    const member = await prisma.beneficiary.findUnique({
      where: { code: code.trim() },
      select: {
        id: true, firstName: true, lastName: true, code: true, networkRole: true, joinDate: true,
        platform: { select: { name: true } },
      },
    })

    if (!member) {
      return NextResponse.json({ success: false, message: 'العضو غير موجود' }, { status: 404 })
    }

    const [impactLogs, recentLogs, awards, awardsCount, activitiesCount] = await Promise.all([
      prisma.impactLog.findMany({
        where: { beneficiaryId: member.id, status: 'APPROVED' },
        select: { beneficiaryId: true, status: true, action: { select: { name: true, category: true, points: true } }, date: true, count: true, quality: true },
      }),
      prisma.impactLog.findMany({
        where: { beneficiaryId: member.id, status: 'APPROVED' },
        select: { action: { select: { name: true, category: true } }, date: true },
        orderBy: { date: 'desc' },
        take: 10,
      }),
      prisma.impactAward.findMany({
        where: { beneficiaryId: member.id },
        select: { title: true, date: true, type: true },
        orderBy: { date: 'desc' },
        take: 10,
      }),
      prisma.impactAward.count({ where: { beneficiaryId: member.id } }),
      prisma.impactLog.count({ where: { beneficiaryId: member.id, status: 'APPROVED' } }),
    ])

    const now = new Date()
    const { totalPoints, monthlyPoints } = memberImpactTotals(impactLogs, now)
    const byCategory: Record<string, number> = {}
    const recentActivities = recentLogs.map(log => ({
      actionName: log.action?.name || '—',
      date: log.date.toISOString().slice(0, 10),
      category: CATEGORY_LABELS[log.action?.category] || 'أخرى',
    }))

    for (const log of impactLogs) {
      const pts = memberLogPoints(log)
      const catLabel = CATEGORY_LABELS[log.action?.category] || 'أخرى'
      byCategory[catLabel] = (byCategory[catLabel] || 0) + pts
    }

    const lvl = levelOf(totalPoints)
    const gap = nextLevelGap(totalPoints)

    return NextResponse.json({
      success: true,
      data: {
        name: `${member.firstName} ${member.lastName}`.trim(),
        code: member.code,
        networkRole: member.networkRole,
        platformName: member.platform?.name || null,
        joinDate: member.joinDate,
        totalPoints,
        monthlyPoints,
        level: lvl.name,
        levelProgress: levelProgress(totalPoints),
        nextLevel: gap?.name || null,
        gapToNext: gap?.gap ?? null,
        activitiesCount,
        awardsCount,
        awards: awards.map(a => ({ title: a.title, date: a.date instanceof Date ? a.date.toISOString() : a.date })),
        recentActivities,
        byCategory,
      },
    })
  } catch (error) {
    logger.error('Portfolio error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}
