import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'
import { logger } from '@/lib/logger'

async function requireGlobalAnalyticsAccess() {
  const auth = await requireAuth()
  if (!auth.ok) return auth
  if (auth.user.role === 'PLATFORM_MANAGER' || auth.user.role === 'EDITOR') {
    return {
      ok: false as const,
      error: NextResponse.json({ success: false, message: 'غير مصرح — التحليلات العامة متاحة للإدارة فقط' }, { status: 403 }),
    }
  }
  return auth
}

export async function GET(request: NextRequest) {
  const auth = await requireGlobalAnalyticsAccess()
  if (!auth.ok) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30' // days
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')
    const country = searchParams.get('country') || ''
    const device = searchParams.get('device') || ''
    const search = searchParams.get('search') || ''

    const since = new Date()
    since.setDate(since.getDate() - parseInt(period))

    // Build where clause
    const whereBase: Record<string, unknown> = {
      timestamp: { gte: since },
    }
    if (country) whereBase.country = country
    if (device) whereBase.deviceType = device

    // Run all queries in parallel
    const [
      totalVisits,
      uniqueVisitors,
      todayVisits,
      countryStats,
      deviceStats,
      browserStats,
      osStats,
      dailyStats,
      recentVisits,
      totalFiltered,
      pageVisits,
      referrerStats,
    ] = await Promise.all([
      // Total visits in period
      prisma.visit.count({ where: whereBase }),
      // Unique visitors
      prisma.visit.groupBy({
        by: ['visitorId'],
        where: {
          ...whereBase,
          visitorId: { not: null },
        },
      }),
      // Today's visits
      prisma.visit.count({
        where: {
          timestamp: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      // Country stats
      prisma.visit.groupBy({
        by: ['country'],
        where: {
          ...whereBase,
          country: { not: null },
        },
        _count: { country: true },
        orderBy: { _count: { country: 'desc' } },
        take: 20,
      }),
      // Device stats
      prisma.visit.groupBy({
        by: ['deviceType'],
        where: whereBase,
        _count: { deviceType: true },
        orderBy: { _count: { deviceType: 'desc' } },
      }),
      // Browser stats
      prisma.visit.groupBy({
        by: ['browser'],
        where: {
          ...whereBase,
          browser: { not: null },
        },
        _count: { browser: true },
        orderBy: { _count: { browser: 'desc' } },
        take: 10,
      }),
      // OS stats
      prisma.visit.groupBy({
        by: ['os'],
        where: {
          ...whereBase,
          os: { not: null },
        },
        _count: { os: true },
        orderBy: { _count: { os: 'desc' } },
        take: 10,
      }),
      // Daily visits for chart
      prisma.$queryRawUnsafe<Array<{ date: string; count: bigint }>>(
        `SELECT DATE(timestamp) as date, COUNT(*)::int as count
         FROM visits
         WHERE timestamp >= $1
         GROUP BY DATE(timestamp)
         ORDER BY date ASC`,
        since
      ),
      // Recent visits
      prisma.visit.findMany({
        where: search
          ? {
              timestamp: { gte: since },
              OR: [
                { path: { contains: search } },
                { country: { contains: search } },
                { city: { contains: search } },
                { browser: { contains: search } },
                { os: { contains: search } },
                { deviceType: { contains: search } },
              ],
            }
          : { ...whereBase },
        orderBy: { timestamp: 'desc' },
        take: pageSize,
        skip: (page - 1) * pageSize,
      }),
      // Total count for pagination
      prisma.visit.count({
        where: search
          ? {
              timestamp: { gte: since },
              OR: [
                { path: { contains: search } },
                { country: { contains: search } },
                { city: { contains: search } },
                { browser: { contains: search } },
                { os: { contains: search } },
                { deviceType: { contains: search } },
              ],
            }
          : { ...whereBase },
      }),
      // Top pages
      prisma.visit.groupBy({
        by: ['path'],
        where: whereBase,
        _count: { path: true },
        orderBy: { _count: { path: 'desc' } },
        take: 20,
      }),
      // Referrers
      prisma.visit.groupBy({
        by: ['referrer'],
        where: {
          ...whereBase,
          referrer: { not: null },
          NOT: { referrer: '' },
        },
        _count: { referrer: true },
        orderBy: { _count: { referrer: 'desc' } },
        take: 10,
      }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalVisits,
          uniqueVisitors: uniqueVisitors.length,
          todayVisits,
          countriesCount: countryStats.length,
        },
        dailyStats: (dailyStats as Array<{ date: string; count: number | bigint }>).map(d => ({
          date: d.date,
          count: Number(d.count),
        })),
        countryStats: countryStats.map(c => ({
          country: c.country,
          count: c._count.country,
        })),
        deviceStats: deviceStats.map(d => ({
          device: d.deviceType || 'unknown',
          count: d._count.deviceType,
        })),
        browserStats: browserStats.map(b => ({
          browser: b.browser,
          count: b._count.browser,
        })),
        osStats: osStats.map(o => ({
          os: o.os,
          count: o._count.os,
        })),
        pageStats: pageVisits.map(p => ({
          path: p.path,
          count: p._count.path,
        })),
        referrerStats: referrerStats.map(r => ({
          referrer: r.referrer,
          count: r._count.referrer,
        })),
        recentVisits: recentVisits.map(v => ({
          id: v.id,
          path: v.path,
          country: v.country,
          city: v.city,
          deviceType: v.deviceType,
          browser: v.browser,
          os: v.os,
          referrer: v.referrer,
          screenSize: v.screenSize,
          language: v.language,
          timestamp: v.timestamp,
          visitorId: v.visitorId,
        })),
        pagination: {
          page,
          pageSize,
          total: totalFiltered,
          totalPages: Math.ceil(totalFiltered / pageSize),
        },
      },
    })
  } catch (error) {
    logger.error('Visitors API Error', error)
    return NextResponse.json(
      { success: false, message: 'خطأ في تحميل بيانات الزوار' },
      { status: 500 }
    )
  }
}
