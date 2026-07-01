/**
 * API لوحة العضو
 * GET /api/member/dashboard?memberId=&tab=dashboard|activities&status=
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.AUTH_SECRET || 'member-secret-dev'

function verifyToken(token: string): any {
  try { return jwt.verify(token, JWT_SECRET) } catch { return null }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('member_token')?.value
    if (!token) return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ success: false, message: 'انتهت الجلسة' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get('memberId') || payload.id
    const tab = searchParams.get('tab') || 'dashboard'
    const statusFilter = searchParams.get('status') || ''

    if (memberId !== payload.id) {
      return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 403 })
    }

    if (tab === 'activities' || tab === 'history') {
      return handleActivities(memberId, statusFilter)
    }

    return handleDashboard(memberId)
  } catch (error) {
    console.error('Member dashboard error:', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

async function handleDashboard(memberId: string) {
  const now = new Date()
  const curYear = now.getFullYear()
  const curMonth = now.getMonth() + 1

  const [impactLogs, awards] = await Promise.all([
    (prisma as any).impactLog.findMany({
      where: { beneficiaryId: memberId },
      orderBy: { date: 'desc' },
      take: 50,
      include: { action: { select: { name: true, category: true, points: true } } },
    }),
    (prisma as any).impactAward.count({ where: { beneficiaryId: memberId } }),
  ])

  const actionMap = new Map<string, any>()
  // const uniqueActions = new Set(impactLogs.map((l: any) => l.actionId))
  for (const log of impactLogs) {
    if (log.action && !actionMap.has(log.actionId)) {
      actionMap.set(log.actionId, log.action)
    }
  }

  const bonus: Record<string, number> = { WEAK: -3, ACCEPTABLE: 0, GOOD: 3, EXCELLENT: 6, EXCEPTIONAL: 10 }
  const calcPts = (l: any) => {
    if (l.status !== 'APPROVED') return 0
    return (l.count || 1) * (actionMap.get(l.actionId)?.points || 0) + (bonus[l.quality] || 0)
  }

  const totalPoints = impactLogs.reduce((s: number, l: any) => s + calcPts(l), 0)
  const monthlyPoints = impactLogs
    .filter((l: any) => new Date(l.date).getFullYear() === curYear && new Date(l.date).getMonth() + 1 === curMonth)
    .reduce((s: number, l: any) => s + calcPts(l), 0)

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

  const recentActivities = impactLogs.slice(0, 8).map((l: any) => ({
    id: l.id,
    actionName: l.action?.name || '—',
    category: l.action?.category || 'OTHER',
    count: l.count,
    quality: l.quality,
    status: l.status,
    date: l.date instanceof Date ? l.date.toISOString().slice(0, 10) : String(l.date || '').slice(0, 10),
    note: l.note || null,
    rejectionReason: l.rejectionReason || null,
  }))

  // حساب Streak — أيام متواصلة بنشاط معتمد
  const approvedDates = new Set(
    impactLogs
      .filter((l: any) => l.status === 'APPROVED')
      .map((l: any) => l.date instanceof Date ? l.date.toISOString().slice(0, 10) : String(l.date || '').slice(0, 10))
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
        activitiesCount: impactLogs.length,
        awardsCount: awards,
        rank: 0,
        streak,
      },
      recentActivities,
    },
  })
}

async function handleActivities(memberId: string, statusFilter: string) {
  const where: any = { beneficiaryId: memberId }
  if (statusFilter) where.status = statusFilter

  const logs = await (prisma as any).impactLog.findMany({
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
    rejectionReason: l.rejectionReason || null,
  }))

  return NextResponse.json({ success: true, data })
}
