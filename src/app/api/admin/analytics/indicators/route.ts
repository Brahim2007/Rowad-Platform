import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { recordActivityLog } from '@/lib/activity-log'

async function checkAuth() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })
  }
  return null
}

export async function GET(request: NextRequest) {
  const authError = await checkAuth()
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'platform' | 'program'

    if (type === 'platform') {
      const indicators = await prisma.platformIndicator.findMany({
        orderBy: { createdAt: 'desc' },
        include: { platform: { select: { name: true, slug: true } } },
      })
      return NextResponse.json({ success: true, data: indicators })
    }

    if (type === 'program') {
      const indicators = await prisma.programIndicator.findMany({
        orderBy: { createdAt: 'desc' },
        include: { program: { select: { name: true, slug: true } } },
      })
      return NextResponse.json({ success: true, data: indicators })
    }

    // Return both if no type specified
    const [platformIndicators, programIndicators] = await Promise.all([
      prisma.platformIndicator.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.programIndicator.findMany({ orderBy: { createdAt: 'desc' } }),
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
  const authError = await checkAuth()
  if (authError) return authError

  try {
    const body = await request.json()
    const type = body.type
    const data = indicatorData(body)

    if (type === 'platform') {
      if (!body.platformId) return NextResponse.json({ success: false, message: 'المنصة مطلوبة' }, { status: 400 })
      const indicator = await prisma.platformIndicator.create({
        data: { ...data, platformId: body.platformId },
      })
      const session = await auth()
      await recordActivityLog({
        entity: 'platform_indicator',
        entityId: indicator.id,
        action: 'CREATE',
        actor: session?.user?.email || session?.user?.name,
        changes: indicator,
      })
      return NextResponse.json({ success: true, data: indicator }, { status: 201 })
    }

    if (type === 'program') {
      if (!body.programId) return NextResponse.json({ success: false, message: 'البرنامج مطلوب' }, { status: 400 })
      const indicator = await prisma.programIndicator.create({
        data: { ...data, programId: body.programId },
      })
      const session = await auth()
      await recordActivityLog({
        entity: 'program_indicator',
        entityId: indicator.id,
        action: 'CREATE',
        actor: session?.user?.email || session?.user?.name,
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
    return NextResponse.json({ success: false, message: e.message || 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const authError = await checkAuth()
  if (authError) return authError

  try {
    const body = await request.json()
    const { id, type } = body
    if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })

    const data = indicatorData(body)

    if (type === 'platform') {
      const indicator = await prisma.platformIndicator.update({ where: { id }, data })
      const session = await auth()
      await recordActivityLog({
        entity: 'platform_indicator',
        entityId: indicator.id,
        action: 'UPDATE',
        actor: session?.user?.email || session?.user?.name,
        changes: body,
      })
      return NextResponse.json({ success: true, data: indicator })
    }

    if (type === 'program') {
      const indicator = await prisma.programIndicator.update({ where: { id }, data })
      const session = await auth()
      await recordActivityLog({
        entity: 'program_indicator',
        entityId: indicator.id,
        action: 'UPDATE',
        actor: session?.user?.email || session?.user?.name,
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
    return NextResponse.json({ success: false, message: e.message || 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const authError = await checkAuth()
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type')
    if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })

    if (type === 'platform') {
      await prisma.platformIndicator.delete({ where: { id } })
    } else if (type === 'program') {
      await prisma.programIndicator.delete({ where: { id } })
    } else {
      return NextResponse.json({ success: false, message: 'نوع المؤشر غير معروف' }, { status: 400 })
    }

    const session = await auth()
    await recordActivityLog({
      entity: `${type}_indicator`,
      entityId: id,
      action: 'DELETE',
      actor: session?.user?.email || session?.user?.name,
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}
