import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

async function checkAuth() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })
  }
  return null
}

export async function GET() {
  const authError = await checkAuth()
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
  const authError = await checkAuth()
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
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const authError = await checkAuth()
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
  } catch {
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const authError = await checkAuth()
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })
    await prisma.dataStandard.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}
