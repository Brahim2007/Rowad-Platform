import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { Prisma } from '@prisma/client'

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
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''

    const where: Prisma.KnowledgeItemWhereInput = {}
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } },
        { tags: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (category) where.category = category as Prisma.EnumKnowledgeCategoryFilter

    const items = await prisma.knowledgeItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: items })
  } catch {
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authError = await checkAuth()
  if (authError) return authError

  try {
    const body = await request.json()
    const { title, slug, description, category, type, author, language, tags, fileUrl } = body

    if (!title || !slug || !category || !type) {
      return NextResponse.json({ success: false, message: 'العنوان والرابط والفئة والنوع مطلوبة' }, { status: 400 })
    }

    const item = await prisma.knowledgeItem.create({
      data: {
        title,
        slug,
        description: description || null,
        category,
        type,
        author: author || null,
        language: language || 'ar',
        tags: tags || null,
        fileUrl: fileUrl || null,
        isPublished: false,
      },
    })

    return NextResponse.json({ success: true, data: item }, { status: 201 })
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
    const { id, title, slug, description, category, type, author, language, tags, fileUrl, isPublished } = body

    if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })

    const item = await prisma.knowledgeItem.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(slug && { slug }),
        description: description ?? undefined,
        ...(category && { category }),
        ...(type && { type }),
        author: author ?? undefined,
        ...(language && { language }),
        tags: tags ?? undefined,
        fileUrl: fileUrl ?? undefined,
        ...(isPublished !== undefined && { isPublished }),
      },
    })

    return NextResponse.json({ success: true, data: item })
  } catch (error: unknown) {
    const e = error as { code?: string }
    if (e.code === 'P2002') {
      return NextResponse.json({ success: false, error: 'الرابط المختصر مستخدم مسبقاً' }, { status: 409 })
    }
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
    await prisma.knowledgeItem.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}
