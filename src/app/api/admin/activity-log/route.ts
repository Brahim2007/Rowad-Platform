import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'
import { logger } from '@/lib/logger'
import { Prisma } from '@prisma/client'

async function requireActivityLogAccess() {
  const auth = await requireAuth()
  if (!auth.ok) return auth
  if (auth.user.role !== 'SUPER_ADMIN' && auth.user.role !== 'ADMIN') {
    return {
      ok: false as const,
      error: NextResponse.json({ success: false, message: 'غير مصرح — سجل النشاط متاح للإدارة فقط' }, { status: 403 }),
    }
  }
  return auth
}

export async function GET(request: NextRequest) {
  const auth = await requireActivityLogAccess()
  if (!auth.ok) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const entity = searchParams.get('entity') || ''
    const action = searchParams.get('action') || ''
    const search = searchParams.get('search') || ''
    const from = searchParams.get('from') || ''
    const to = searchParams.get('to') || ''
    const limit = Math.min(100, Math.max(10, Number(searchParams.get('limit') || 25)))
    const page = Math.max(Number(searchParams.get('page')) || 1, 1)
    const where: Prisma.ActivityLogWhereInput = {
      ...(entity && { entity }),
      ...(action && { action }),
      ...(search && {
        OR: [
          { entity: { contains: search, mode: 'insensitive' } },
          { entityId: { contains: search, mode: 'insensitive' } },
          { action: { contains: search, mode: 'insensitive' } },
          { actor: { contains: search, mode: 'insensitive' } },
          { changes: { contains: search, mode: 'insensitive' } },
          { metadata: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...((from || to) && {
        createdAt: {
          ...(from && { gte: new Date(`${from}T00:00:00.000Z`) }),
          ...(to && { lte: new Date(`${to}T23:59:59.999Z`) }),
        },
      }),
    }

    const [logs, total, actionGroups, entityGroups] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.activityLog.count({ where }),
      prisma.activityLog.groupBy({ by: ['action'], where, _count: { _all: true } }),
      prisma.activityLog.groupBy({ by: ['entity'], where, _count: { _all: true } }),
    ])

    return NextResponse.json({
      success: true,
      data: logs,
      pagination: { page, pageSize: limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) },
      summary: {
        actionCounts: Object.fromEntries(actionGroups.map(row => [row.action, row._count._all])),
        entityCounts: Object.fromEntries(entityGroups.map(row => [row.entity, row._count._all])),
      },
    })
  } catch (error) {
    logger.error('Activity log GET error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}
