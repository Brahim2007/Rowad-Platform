/**
 * API مركز متابعة المنصات — للإدارة العليا فقط
 * GET /api/admin/platforms-overview
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })

  const user = session.user as any
  if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, message: 'الإدارة العليا فقط' }, { status: 403 })
  }

  try {
    const now = new Date()
    const curYear = now.getFullYear()
    const curMonth = now.getMonth() + 1
    const prevYear = curMonth === 1 ? curYear - 1 : curYear
    const prevMonth = curMonth === 1 ? 12 : curMonth - 1

    const platforms = await (prisma as any).platform.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, slug: true, color: true },
    })

    const data = await Promise.all(platforms.map(async (p: any) => {
      const [
        memberCount,
        pendingCount,
        allLogs,
        managedBy,
      ] = await Promise.all([
        (prisma as any).beneficiary.count({ where: { platformId: p.id, status: 'ACTIVE' } }),
        (prisma as any).impactLog.count({ where: { platformId: p.id, status: 'PENDING_REVIEW' } }),
        (prisma as any).impactLog.findMany({
          where: { platformId: p.id },
          select: { status: true, date: true, beneficiaryId: true },
        }),
        (prisma as any).adminUser.findFirst({
          where: { platformId: p.id, role: 'PLATFORM_MANAGER', isActive: true },
          select: { fullName: true, email: true },
        }),
      ])

      // هذا الشهر
      const thisMonth = allLogs.filter((l: any) => {
        const d = new Date(l.date)
        return d.getFullYear() === curYear && d.getMonth() + 1 === curMonth
      })
      // الشهر السابق
      const prevMonthLogs = allLogs.filter((l: any) => {
        const d = new Date(l.date)
        return d.getFullYear() === prevYear && d.getMonth() + 1 === prevMonth
      })

      const approved = allLogs.filter((l: any) => l.status === 'APPROVED').length
      const thisMonthApproved = thisMonth.filter((l: any) => l.status === 'APPROVED').length
      const prevMonthApproved = prevMonthLogs.filter((l: any) => l.status === 'APPROVED').length

      const activeMembers = new Set(thisMonth.map((l: any) => l.beneficiaryId).filter(Boolean)).size

      // الأنشطة المتأخرة (+7 أيام)
      const nowMs = now.getTime()
      const stalePending = allLogs.filter((l: any) => l.status === 'PENDING_REVIEW' && (nowMs - new Date(l.date).getTime()) > 7 * 86400000).length

      // اتجاه الشهر
      const trend = prevMonthApproved > 0
        ? Math.round(((thisMonthApproved - prevMonthApproved) / prevMonthApproved) * 100)
        : thisMonthApproved > 0 ? 100 : 0

      return {
        platformId: p.id,
        platformName: p.name,
        platformSlug: p.slug,
        memberCount,
        activeMembers,
        pendingCount,
        stalePending,
        totalApproved: approved,
        thisMonthApproved,
        trend,
        managedBy: managedBy?.fullName || null,
        managedByEmail: managedBy?.email || null,
      }
    }))

    // إجماليات
    const totals = {
      platforms: data.length,
      totalMembers: data.reduce((s: number, d: any) => s + d.memberCount, 0),
      totalPending: data.reduce((s: number, d: any) => s + d.pendingCount, 0),
      totalApproved: data.reduce((s: number, d: any) => s + d.totalApproved, 0),
      mostActive: data.sort((a: any, b: any) => b.thisMonthApproved - a.thisMonthApproved)[0]?.platformName || '—',
      mostAtRisk: data.filter((d: any) => d.stalePending > 0).length,
    }

    return NextResponse.json({ success: true, data: { platforms: data, totals } })
  } catch (error) {
    console.error('Platforms overview error:', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}
