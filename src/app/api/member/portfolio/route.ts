/**
 * API بطاقة الرائد العامة — لا تحتاج تسجيل دخول
 * GET /api/member/portfolio?code=R-001
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    const member = await (prisma as any).beneficiary.findUnique({
      where: { code: code.trim() },
      select: {
        firstName: true, lastName: true, code: true, networkRole: true, joinDate: true,
        platform: { select: { name: true } },
        impactAwards: { select: { title: true, date: true, type: true }, orderBy: { date: 'desc' }, take: 10 },
        impactLogs: {
          where: { status: 'APPROVED' },
          select: { action: { select: { name: true, category: true, points: true } }, date: true, count: true, quality: true },
          orderBy: { date: 'desc' },
          take: 20,
        },
      },
    })

    if (!member) {
      return NextResponse.json({ success: false, message: 'العضو غير موجود' }, { status: 404 })
    }

    const now = new Date()
    const curYear = now.getFullYear()
    const curMonth = now.getMonth() + 1

    const bonus: Record<string, number> = { WEAK: -3, ACCEPTABLE: 0, GOOD: 3, EXCELLENT: 6, EXCEPTIONAL: 10 }

    let totalPoints = 0
    let monthlyPoints = 0
    const byCategory: Record<string, number> = {}
    const recentActivities: Array<{ actionName: string; date: string; category: string }> = []

    for (const log of member.impactLogs) {
      const pts = (log.count || 1) * (log.action?.points || 0) + (bonus[log.quality] || 0)
      totalPoints += pts
      const d = new Date(log.date)
      if (d.getFullYear() === curYear && d.getMonth() + 1 === curMonth) monthlyPoints += pts
      const catLabel = CATEGORY_LABELS[log.action?.category] || 'أخرى'
      byCategory[catLabel] = (byCategory[catLabel] || 0) + pts
      if (recentActivities.length < 10) {
        recentActivities.push({
          actionName: log.action?.name || '—',
          date: d.toISOString().slice(0, 10),
          category: catLabel,
        })
      }
    }

    const levels = [
      { name: 'عضو جديد', from: 0, to: 99 },
      { name: 'عضو نشط', from: 100, to: 299 },
      { name: 'عضو مؤثر', from: 300, to: 599 },
      { name: 'عضو متميز', from: 600, to: 999 },
      { name: 'رائد ذهبي', from: 1000, to: 1999 },
      { name: 'سفير الرواد', from: 2000, to: 9999999 },
    ]
    const lvl = levels.find(l => totalPoints >= l.from && totalPoints <= l.to) || levels[levels.length - 1]
    const nextIdx = levels.findIndex(l => l.name === lvl.name) + 1
    const nextLevel = levels[nextIdx] || null

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
        levelProgress: lvl.to >= 9999999 ? 100 : Math.min(100, Math.max(0, ((totalPoints - lvl.from) / (lvl.to - lvl.from + 1)) * 100)),
        nextLevel: nextLevel?.name || null,
        gapToNext: nextLevel ? Math.max(0, nextLevel.from - totalPoints) : null,
        activitiesCount: member.impactLogs.length,
        awardsCount: member.impactAwards.length,
        awards: member.impactAwards.map((a: any) => ({ title: a.title, date: a.date instanceof Date ? a.date.toISOString() : a.date })),
        recentActivities,
        byCategory,
      },
    })
  } catch (error) {
    console.error('Portfolio error:', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}
