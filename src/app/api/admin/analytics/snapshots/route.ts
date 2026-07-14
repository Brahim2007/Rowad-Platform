import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { recordActivityLog } from '@/lib/activity-log'
import { requireAuth, type SessionUser } from '@/lib/auth-helpers'
import { logger } from '@/lib/logger'

function requireGlobalSnapshotAccess(user: SessionUser) {
  if (user.role === 'SUPER_ADMIN') return null
  if (user.role === 'ADMIN') return null
  return NextResponse.json({ success: false, message: 'هذه الميزة متاحة للإدارة العامة فقط' }, { status: 403 })
}

export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error
  const authError = requireGlobalSnapshotAccess(auth.user)
  if (authError) return authError

  try {
    const snapshots = await prisma.analyticsSnapshot.findMany({
      orderBy: { periodStart: 'desc' },
      select: {
        id: true,
        title: true,
        period: true,
        periodStart: true,
        periodEnd: true,
        summary: true,
        generatedBy: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ success: true, data: snapshots })
  } catch {
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error
  const authError = requireGlobalSnapshotAccess(auth.user)
  if (authError) return authError

  try {
    const body = await request.json()
    const { title, period, periodStart, periodEnd, summary, generatedBy, data } = body

    if (!title || !period || !periodStart || !periodEnd) {
      return NextResponse.json({ success: false, message: 'العنوان والفترة وتواريخ البداية والنهاية مطلوبة' }, { status: 400 })
    }

    const payload = data || {
      platformIndicators: await prisma.platformIndicator.findMany({
        where: { recordedAt: { gte: new Date(periodStart), lte: new Date(periodEnd) } },
        include: { platform: { select: { name: true, slug: true } } },
      }),
      programIndicators: await prisma.programIndicator.findMany({
        where: { recordedAt: { gte: new Date(periodStart), lte: new Date(periodEnd) } },
        include: { program: { select: { name: true, slug: true } } },
      }),
    }

    const snapshot = await prisma.analyticsSnapshot.create({
      data: {
        title,
        period,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        summary: summary || null,
        generatedBy: generatedBy || null,
        data: typeof payload === 'string' ? payload : JSON.stringify(payload),
      },
    })

    await recordActivityLog({
      entity: 'analytics_snapshot',
      entityId: snapshot.id,
      action: 'CREATE',
      actor: auth.user.email || auth.user.name,
      changes: snapshot,
    })

    return NextResponse.json({ success: true, data: snapshot }, { status: 201 })
  } catch (error) {
    logger.error('Analytics snapshot POST error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error
  const authError = requireGlobalSnapshotAccess(auth.user)
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })

    await prisma.analyticsSnapshot.delete({ where: { id } })

    await recordActivityLog({
      entity: 'analytics_snapshot',
      entityId: id,
      action: 'DELETE',
      actor: auth.user.email || auth.user.name,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Analytics snapshot DELETE error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}
