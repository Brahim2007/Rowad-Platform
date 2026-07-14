import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { recordActivityLog } from '@/lib/activity-log'
import { requireAuth, type SessionUser } from '@/lib/auth-helpers'
import { logger } from '@/lib/logger'

function requireTemplateMutation(user: SessionUser) {
  if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, message: 'غير مصرح — قوالب التقارير متاحة للإدارة فقط' }, { status: 403 })
  }
  return null
}

export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error

  try {
    const templates = await prisma.reportTemplate.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        category: true,
        sections: true,
        icon: true,
        isActive: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ success: true, data: templates })
  } catch {
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

function normalizeSections(value: unknown) {
  if (!value) return '[]'
  if (typeof value === 'string') {
    JSON.parse(value)
    return value
  }
  return JSON.stringify(value)
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error
  const authError = requireTemplateMutation(auth.user)
  if (authError) return authError

  try {
    const body = await request.json()
    const { title, slug, description, category, sections, icon, isActive } = body

    if (!title || !slug || !category) {
      return NextResponse.json({ success: false, message: 'العنوان والرابط والفئة مطلوبة' }, { status: 400 })
    }

    const template = await prisma.reportTemplate.create({
      data: {
        title,
        slug,
        description: description || null,
        category,
        sections: normalizeSections(sections),
        icon: icon || null,
        isActive: isActive ?? true,
      },
    })

    await recordActivityLog({
      entity: 'report_template',
      entityId: template.id,
      action: 'CREATE',
      actor: auth.user.email || auth.user.name,
      changes: template,
    })

    return NextResponse.json({ success: true, data: template }, { status: 201 })
  } catch (error: unknown) {
    const e = error as { code?: string }
    if (e.code === 'P2002') {
      return NextResponse.json({ success: false, message: 'الرابط المختصر مستخدم مسبقاً' }, { status: 409 })
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ success: false, message: 'صيغة JSON في الأقسام غير صحيحة' }, { status: 400 })
    }
    logger.error('Report template POST error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error
  const authError = requireTemplateMutation(auth.user)
  if (authError) return authError

  try {
    const body = await request.json()
    const { id, title, slug, description, category, sections, icon, isActive } = body
    if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })

    const template = await prisma.reportTemplate.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(slug !== undefined && { slug }),
        ...(description !== undefined && { description: description || null }),
        ...(category !== undefined && { category }),
        ...(sections !== undefined && { sections: normalizeSections(sections) }),
        ...(icon !== undefined && { icon: icon || null }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    await recordActivityLog({
      entity: 'report_template',
      entityId: template.id,
      action: 'UPDATE',
      actor: auth.user.email || auth.user.name,
      changes: body,
    })

    return NextResponse.json({ success: true, data: template })
  } catch (error: unknown) {
    const e = error as { code?: string }
    if (e.code === 'P2002') {
      return NextResponse.json({ success: false, message: 'الرابط المختصر مستخدم مسبقاً' }, { status: 409 })
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ success: false, message: 'صيغة JSON في الأقسام غير صحيحة' }, { status: 400 })
    }
    logger.error('Report template PUT error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error
  const authError = requireTemplateMutation(auth.user)
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })

    await prisma.reportTemplate.delete({ where: { id } })

    await recordActivityLog({
      entity: 'report_template',
      entityId: id,
      action: 'DELETE',
      actor: auth.user.email || auth.user.name,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Report template DELETE error', error)
    return NextResponse.json({ success: false, message: 'لا يمكن حذف قالب مرتبط بتقارير أو حدث خطأ في الخادم' }, { status: 500 })
  }
}
