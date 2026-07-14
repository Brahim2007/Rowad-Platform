/**
 * API مركز متابعة المنصات — للإدارة العليا فقط
 * GET /api/admin/platforms-overview
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'
import { logger } from '@/lib/logger'

export async function GET(_request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error

  if (auth.user.role !== 'SUPER_ADMIN' && auth.user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, message: 'الإدارة العليا فقط' }, { status: 403 })
  }

  try {
    const now = new Date()
    const curYear = now.getFullYear()
    const curMonth = now.getMonth() + 1
    const prevYear = curMonth === 1 ? curYear - 1 : curYear
    const prevMonth = curMonth === 1 ? 12 : curMonth - 1

    const platforms = await prisma.platform.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, slug: true, color: true },
    })

    const data = await Promise.all(platforms.map(async (p) => {
      const [
        memberCount,
        pendingCount,
        allLogs,
        managedBy,
      ] = await Promise.all([
        prisma.beneficiary.count({ where: { platformId: p.id, status: 'ACTIVE' } }),
        prisma.impactLog.count({ where: { platformId: p.id, status: 'PENDING_REVIEW' } }),
        prisma.impactLog.findMany({
          where: { platformId: p.id },
          select: { status: true, date: true, beneficiaryId: true },
        }),
        prisma.adminUser.findFirst({
          where: { platformId: p.id, role: 'PLATFORM_MANAGER', isActive: true },
          select: { fullName: true, email: true },
        }),
      ])

      // هذا الشهر
      const thisMonth = allLogs.filter((l) => {
        const d = new Date(l.date)
        return d.getFullYear() === curYear && d.getMonth() + 1 === curMonth
      })
      // الشهر السابق
      const prevMonthLogs = allLogs.filter((l) => {
        const d = new Date(l.date)
        return d.getFullYear() === prevYear && d.getMonth() + 1 === prevMonth
      })

      const approved = allLogs.filter((l) => l.status === 'APPROVED').length
      const thisMonthApproved = thisMonth.filter((l) => l.status === 'APPROVED').length
      const prevMonthApproved = prevMonthLogs.filter((l) => l.status === 'APPROVED').length

      const activeMembers = new Set(thisMonth.map((l) => l.beneficiaryId).filter(Boolean)).size

      // الأنشطة المتأخرة (+7 أيام)
      const nowMs = now.getTime()
      const stalePending = allLogs.filter((l) => l.status === 'PENDING_REVIEW' && (nowMs - new Date(l.date).getTime()) > 7 * 86400000).length

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
      totalMembers: data.reduce((s, d) => s + d.memberCount, 0),
      totalPending: data.reduce((s, d) => s + d.pendingCount, 0),
      totalApproved: data.reduce((s, d) => s + d.totalApproved, 0),
      mostActive: data.sort((a, b) => b.thisMonthApproved - a.thisMonthApproved)[0]?.platformName || '—',
      mostAtRisk: data.filter((d) => d.stalePending > 0).length,
    }

    return NextResponse.json({ success: true, data: { platforms: data, totals } })
  } catch (error) {
    logger.error('Platforms overview error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}
