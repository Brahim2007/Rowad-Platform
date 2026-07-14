import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, type SessionUser } from '@/lib/auth-helpers'
import { logger } from '@/lib/logger'

function requireGlobalStandardsAccess(user: SessionUser) {
  if (user.role === 'SUPER_ADMIN') return null
  if (user.role === 'ADMIN') return null
  return NextResponse.json({ success: false, message: 'هذه الميزة متاحة للإدارة العامة فقط' }, { status: 403 })
}

export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error
  const authError = requireGlobalStandardsAccess(auth.user)
  if (authError) return authError

  try {
    const standards = await prisma.dataStandard.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ success: true, data: standards })
  } catch {
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error
  const authError = requireGlobalStandardsAccess(auth.user)
  if (authError) return authError

  try {
    const body = await request.json()
    const { name, slug, description, scope, requiredFields, validationRules } = body

    if (!name || !slug || !scope || !requiredFields) {
      return NextResponse.json({ success: false, message: 'الاسم والرابط والنطاق والحقول المطلوبة إجبارية' }, { status: 400 })
    }

    const standard = await prisma.dataStandard.create({
      data: {
        name,
        slug,
        description: description || null,
        scope,
        requiredFields: typeof requiredFields === 'string' ? requiredFields : JSON.stringify(requiredFields),
        validationRules: validationRules || null,
      },
    })

    return NextResponse.json({ success: true, data: standard }, { status: 201 })
  } catch (error: unknown) {
    const e = error as { code?: string }
    if (e.code === 'P2002') {
      return NextResponse.json({ success: false, error: 'الرابط المختصر مستخدم مسبقاً' }, { status: 409 })
    }
    logger.error('Data standard POST error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error
  const authError = requireGlobalStandardsAccess(auth.user)
  if (authError) return authError

  try {
    const body = await request.json()
    const { id, name, slug, description, scope, requiredFields, validationRules, isActive } = body

    if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })

    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = name
    if (slug !== undefined) data.slug = slug
    if (description !== undefined) data.description = description || null
    if (scope !== undefined) data.scope = scope
    if (requiredFields !== undefined) data.requiredFields = typeof requiredFields === 'string' ? requiredFields : JSON.stringify(requiredFields)
    if (validationRules !== undefined) data.validationRules = validationRules || null
    if (isActive !== undefined) data.isActive = isActive

    const standard = await prisma.dataStandard.update({ where: { id }, data })
    return NextResponse.json({ success: true, data: standard })
  } catch (error) {
    logger.error('Data standard PUT error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error
  const authError = requireGlobalStandardsAccess(auth.user)
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })
    await prisma.dataStandard.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Data standard DELETE error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}
