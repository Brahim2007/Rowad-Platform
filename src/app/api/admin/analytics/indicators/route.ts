import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { recordActivityLog } from '@/lib/activity-log'
import { getPlatformScope, platformWhere, requireAuth, verifyPlatformOwnership } from '@/lib/auth-helpers'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'platform' | 'program'
    const scope = getPlatformScope(auth.user)

    if (type === 'platform') {
      const indicators = await prisma.platformIndicator.findMany({
        where: platformWhere(scope),
        orderBy: { createdAt: 'desc' },
        include: { platform: { select: { name: true, slug: true } } },
      })
      return NextResponse.json({ success: true, data: indicators })
    }

    if (type === 'program') {
      const indicators = await prisma.programIndicator.findMany({
        where: scope.filterId ? { program: { platformId: scope.filterId } } : undefined,
        orderBy: { createdAt: 'desc' },
        include: { program: { select: { name: true, slug: true } } },
      })
      return NextResponse.json({ success: true, data: indicators })
    }

    // Return both if no type specified
    const [platformIndicators, programIndicators] = await Promise.all([
      prisma.platformIndicator.findMany({
        where: platformWhere(scope),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.programIndicator.findMany({
        where: scope.filterId ? { program: { platformId: scope.filterId } } : undefined,
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return NextResponse.json({ success: true, data: { platformIndicators, programIndicators } })
  } catch {
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

function indicatorData(body: Record<string, unknown>) {
  const {
    indicatorKey,
    indicatorName,
    value,
    target,
    unit,
    period,
    recordedAt,
  } = body

  if (!indicatorKey || !indicatorName) {
    throw new Error('اسم المؤشر ومفتاحه مطلوبان')
  }

  return {
    indicatorKey: String(indicatorKey),
    indicatorName: String(indicatorName),
    value: Number(value || 0),
    target: target === undefined || target === null || target === '' ? null : Number(target),
    unit: unit ? String(unit) : null,
    period: period ? String(period) : 'monthly',
    recordedAt: recordedAt ? new Date(String(recordedAt)) : new Date(),
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error

  try {
    const body = await request.json()
    const type = body.type
    const data = indicatorData(body)

    if (type === 'platform') {
      if (!body.platformId) return NextResponse.json({ success: false, message: 'المنصة مطلوبة' }, { status: 400 })
      const platformId = auth.user.role === 'PLATFORM_MANAGER' ? auth.user.platformId : String(body.platformId)
      if (!platformId || !(await verifyPlatformOwnership(auth.user, platformId))) {
        return NextResponse.json({ success: false, message: 'غير مصرح — خارج نطاق المنصة' }, { status: 403 })
      }
      const indicator = await prisma.platformIndicator.create({
        data: { ...data, platformId },
      })
      await recordActivityLog({
        entity: 'platform_indicator',
        entityId: indicator.id,
        action: 'CREATE',
        actor: auth.user.email || auth.user.name,
        changes: indicator,
      })
      return NextResponse.json({ success: true, data: indicator }, { status: 201 })
    }

    if (type === 'program') {
      if (!body.programId) return NextResponse.json({ success: false, message: 'البرنامج مطلوب' }, { status: 400 })
      const program = await prisma.program.findUnique({ where: { id: String(body.programId) }, select: { platformId: true } })
      if (!program || !(await verifyPlatformOwnership(auth.user, program.platformId))) {
        return NextResponse.json({ success: false, message: 'غير مصرح — خارج نطاق المنصة' }, { status: 403 })
      }
      const indicator = await prisma.programIndicator.create({
        data: { ...data, programId: String(body.programId) },
      })
      await recordActivityLog({
        entity: 'program_indicator',
        entityId: indicator.id,
        action: 'CREATE',
        actor: auth.user.email || auth.user.name,
        changes: indicator,
      })
      return NextResponse.json({ success: true, data: indicator }, { status: 201 })
    }

    return NextResponse.json({ success: false, message: 'نوع المؤشر غير معروف' }, { status: 400 })
  } catch (error: unknown) {
    const e = error as { code?: string; message?: string }
    if (e.code === 'P2002') {
      return NextResponse.json({ success: false, message: 'يوجد مؤشر بنفس المفتاح والتاريخ لهذا العنصر' }, { status: 409 })
    }
    logger.error('Indicator POST error', error)
    return NextResponse.json({ success: false, message: e.message || 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error

  try {
    const body = await request.json()
    const { id, type } = body
    if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })

    const data = indicatorData(body)

    if (type === 'platform') {
      const current = await prisma.platformIndicator.findUnique({ where: { id }, select: { platformId: true } })
      if (!current) return NextResponse.json({ success: false, message: 'المؤشر غير موجود' }, { status: 404 })
      if (!(await verifyPlatformOwnership(auth.user, current.platformId))) {
        return NextResponse.json({ success: false, message: 'غير مصرح — خارج نطاق المنصة' }, { status: 403 })
      }
      const indicator = await prisma.platformIndicator.update({ where: { id }, data })
      await recordActivityLog({
        entity: 'platform_indicator',
        entityId: indicator.id,
        action: 'UPDATE',
        actor: auth.user.email || auth.user.name,
        changes: body,
      })
      return NextResponse.json({ success: true, data: indicator })
    }

    if (type === 'program') {
      const current = await prisma.programIndicator.findUnique({
        where: { id },
        select: { program: { select: { platformId: true } } },
      })
      if (!current) return NextResponse.json({ success: false, message: 'المؤشر غير موجود' }, { status: 404 })
      if (!(await verifyPlatformOwnership(auth.user, current.program.platformId))) {
        return NextResponse.json({ success: false, message: 'غير مصرح — خارج نطاق المنصة' }, { status: 403 })
      }
      const indicator = await prisma.programIndicator.update({ where: { id }, data })
      await recordActivityLog({
        entity: 'program_indicator',
        entityId: indicator.id,
        action: 'UPDATE',
        actor: auth.user.email || auth.user.name,
        changes: body,
      })
      return NextResponse.json({ success: true, data: indicator })
    }

    return NextResponse.json({ success: false, message: 'نوع المؤشر غير معروف' }, { status: 400 })
  } catch (error: unknown) {
    const e = error as { code?: string; message?: string }
    if (e.code === 'P2002') {
      return NextResponse.json({ success: false, message: 'يوجد مؤشر بنفس المفتاح والتاريخ لهذا العنصر' }, { status: 409 })
    }
    logger.error('Indicator PUT error', error)
    return NextResponse.json({ success: false, message: e.message || 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type')
    if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })

    if (type === 'platform') {
      const indicator = await prisma.platformIndicator.findUnique({ where: { id }, select: { platformId: true } })
      if (!indicator) return NextResponse.json({ success: false, message: 'المؤشر غير موجود' }, { status: 404 })
      if (!(await verifyPlatformOwnership(auth.user, indicator.platformId))) {
        return NextResponse.json({ success: false, message: 'غير مصرح — خارج نطاق المنصة' }, { status: 403 })
      }
      await prisma.platformIndicator.delete({ where: { id } })
    } else if (type === 'program') {
      const indicator = await prisma.programIndicator.findUnique({
        where: { id },
        select: { program: { select: { platformId: true } } },
      })
      if (!indicator) return NextResponse.json({ success: false, message: 'المؤشر غير موجود' }, { status: 404 })
      if (!(await verifyPlatformOwnership(auth.user, indicator.program.platformId))) {
        return NextResponse.json({ success: false, message: 'غير مصرح — خارج نطاق المنصة' }, { status: 403 })
      }
      await prisma.programIndicator.delete({ where: { id } })
    } else {
      return NextResponse.json({ success: false, message: 'نوع المؤشر غير معروف' }, { status: 400 })
    }

    await recordActivityLog({
      entity: `${type}_indicator`,
      entityId: id,
      action: 'DELETE',
      actor: auth.user.email || auth.user.name,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Indicator DELETE error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}
