/**
 * API لوحة العضو
 * GET /api/member/dashboard?memberId=&tab=dashboard|activities&status=
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireActiveMember } from '@/lib/member-auth'
import { logger } from '@/lib/logger'
import { memberImpactTotals, memberRank } from '@/lib/member-impact'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireActiveMember(request)
    if (!auth.ok) return auth.error

    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get('memberId') || auth.payload.id
    const tab = searchParams.get('tab') || 'dashboard'
    const statusFilter = searchParams.get('status') || ''

    if (memberId !== auth.payload.id) {
      return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 403 })
    }

    if (tab === 'activities' || tab === 'history') {
      return handleActivities(memberId, statusFilter)
    }

    return handleDashboard(memberId)
  } catch (error) {
    logger.error('Member dashboard error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

async function handleDashboard(memberId: string) {
  const now = new Date()

  const [recentLogs, activityCount, awards, rankingLogs] = await Promise.all([
    prisma.impactLog.findMany({
      where: { beneficiaryId: memberId },
      orderBy: { date: 'desc' },
      take: 8,
      include: { action: { select: { name: true, category: true, points: true } } },
    }),
    prisma.impactLog.count({ where: { beneficiaryId: memberId } }),
    prisma.impactAward.count({ where: { beneficiaryId: memberId } }),
    prisma.impactLog.findMany({
      where: { status: 'APPROVED' },
      select: {
        beneficiaryId: true,
        status: true,
        date: true,
        count: true,
        quality: true,
        action: { select: { points: true } },
      },
    }),
  ])

  const memberLogs = rankingLogs.filter(log => log.beneficiaryId === memberId)
  const { totalPoints, monthlyPoints } = memberImpactTotals(memberLogs, now)
  const rank = memberRank(rankingLogs, memberId)

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

  const recentActivities = recentLogs.map(l => ({
    id: l.id,
    actionName: l.action?.name || '—',
    category: l.action?.category || 'OTHER',
    count: l.count,
    quality: l.quality,
    status: l.status,
    date: l.date instanceof Date ? l.date.toISOString().slice(0, 10) : String(l.date || '').slice(0, 10),
    note: l.note || null,
    link: l.link || null,
    rejectionReason: l.rejectionReason || null,
  }))

  // حساب Streak — أيام متواصلة بنشاط معتمد
  const approvedDates = new Set(
    memberLogs.map(l => l.date instanceof Date ? l.date.toISOString().slice(0, 10) : String(l.date || '').slice(0, 10))
  )
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    if (approvedDates.has(d.toISOString().slice(0, 10))) {
      streak++
    } else {
      break
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      stats: {
        totalPoints,
        monthlyPoints,
        levelName: lvl.name,
        levelProgress: lvl.to >= 9999999 ? 100 : Math.min(100, Math.max(0, ((totalPoints - lvl.from) / (lvl.to - lvl.from + 1)) * 100)),
        nextLevel: nextLevel?.name || null,
        gapToNext: nextLevel ? Math.max(0, nextLevel.from - totalPoints) : null,
        activitiesCount: activityCount,
        awardsCount: awards,
        rank,
        streak,
      },
      recentActivities,
    },
  })
}

async function handleActivities(memberId: string, statusFilter: string) {
  const where: any = { beneficiaryId: memberId }
  if (statusFilter) where.status = statusFilter

  const logs = await prisma.impactLog.findMany({
    where,
    orderBy: { date: 'desc' },
    take: 100,
    include: { action: { select: { name: true, category: true, points: true } } },
  })

  const data = logs.map((l: any) => ({
    id: l.id,
    actionName: l.action?.name || '—',
    category: l.action?.category || 'OTHER',
    count: l.count,
    quality: l.quality,
    status: l.status,
    date: l.date instanceof Date ? l.date.toISOString().slice(0, 10) : String(l.date || '').slice(0, 10),
    note: l.note || null,
    link: l.link || null,
    rejectionReason: l.rejectionReason || null,
  }))

  return NextResponse.json({ success: true, data })
}
