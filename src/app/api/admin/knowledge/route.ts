import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPlatformScope, platformWhere, requireAuth, verifyPlatformOwnership } from '@/lib/auth-helpers'
import { logger } from '@/lib/logger'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const scope = getPlatformScope(auth.user)

    const where: Prisma.KnowledgeItemWhereInput = platformWhere(scope)
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
  } catch (error) {
    logger.error('Knowledge GET error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error

  try {
    const body = await request.json()
    const { title, slug, description, category, type, author, language, tags, fileUrl, platformId, programId, projectId } = body

    if (!title || !slug || !category || !type) {
      return NextResponse.json({ success: false, message: 'العنوان والرابط والفئة والنوع مطلوبة' }, { status: 400 })
    }
    const scopedPlatformId = auth.user.role === 'PLATFORM_MANAGER' ? auth.user.platformId : platformId || null
    if (auth.user.role === 'PLATFORM_MANAGER' && !scopedPlatformId) {
      return NextResponse.json({ success: false, message: 'مدير المنصة غير مرتبط بمنصة' }, { status: 403 })
    }
    if (scopedPlatformId && !(await verifyPlatformOwnership(auth.user, scopedPlatformId))) {
      return NextResponse.json({ success: false, message: 'غير مصرح — خارج نطاق المنصة' }, { status: 403 })
    }
    if (programId) {
      const program = await prisma.program.findUnique({ where: { id: programId }, select: { platformId: true } })
      if (!program || !(await verifyPlatformOwnership(auth.user, program.platformId))) {
        return NextResponse.json({ success: false, message: 'غير مصرح — خارج نطاق المنصة' }, { status: 403 })
      }
    }
    if (projectId) {
      const project = await prisma.project.findUnique({ where: { id: projectId }, select: { platformId: true } })
      if (!project || !(await verifyPlatformOwnership(auth.user, project.platformId))) {
        return NextResponse.json({ success: false, message: 'غير مصرح — خارج نطاق المنصة' }, { status: 403 })
      }
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
        platformId: scopedPlatformId,
        programId: programId || null,
        projectId: projectId || null,
      },
    })

    return NextResponse.json({ success: true, data: item }, { status: 201 })
  } catch (error: unknown) {
    const e = error as { code?: string }
    if (e.code === 'P2002') {
      return NextResponse.json({ success: false, error: 'الرابط المختصر مستخدم مسبقاً' }, { status: 409 })
    }
    logger.error('Knowledge POST error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error

  try {
    const body = await request.json()
    const { id, title, slug, description, category, type, author, language, tags, fileUrl, isPublished, platformId, programId, projectId } = body

    if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })
    const current = await prisma.knowledgeItem.findUnique({ where: { id }, select: { platformId: true } })
    if (!current) return NextResponse.json({ success: false, message: 'العنصر غير موجود' }, { status: 404 })
    if (!(await verifyPlatformOwnership(auth.user, current.platformId))) {
      return NextResponse.json({ success: false, message: 'غير مصرح — خارج نطاق المنصة' }, { status: 403 })
    }
    const scopedPlatformId = auth.user.role === 'PLATFORM_MANAGER' ? auth.user.platformId : platformId
    if (scopedPlatformId && !(await verifyPlatformOwnership(auth.user, scopedPlatformId))) {
      return NextResponse.json({ success: false, message: 'غير مصرح — خارج نطاق المنصة' }, { status: 403 })
    }
    if (programId) {
      const program = await prisma.program.findUnique({ where: { id: programId }, select: { platformId: true } })
      if (!program || !(await verifyPlatformOwnership(auth.user, program.platformId))) {
        return NextResponse.json({ success: false, message: 'غير مصرح — خارج نطاق المنصة' }, { status: 403 })
      }
    }
    if (projectId) {
      const project = await prisma.project.findUnique({ where: { id: projectId }, select: { platformId: true } })
      if (!project || !(await verifyPlatformOwnership(auth.user, project.platformId))) {
        return NextResponse.json({ success: false, message: 'غير مصرح — خارج نطاق المنصة' }, { status: 403 })
      }
    }

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
        ...(platformId !== undefined && { platformId: scopedPlatformId || null }),
        ...(programId !== undefined && { programId: programId || null }),
        ...(projectId !== undefined && { projectId: projectId || null }),
      },
    })

    return NextResponse.json({ success: true, data: item })
  } catch (error: unknown) {
    const e = error as { code?: string }
    if (e.code === 'P2002') {
      return NextResponse.json({ success: false, error: 'الرابط المختصر مستخدم مسبقاً' }, { status: 409 })
    }
    logger.error('Knowledge PUT error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })
    const item = await prisma.knowledgeItem.findUnique({ where: { id }, select: { platformId: true } })
    if (!item) return NextResponse.json({ success: false, message: 'العنصر غير موجود' }, { status: 404 })
    if (!(await verifyPlatformOwnership(auth.user, item.platformId))) {
      return NextResponse.json({ success: false, message: 'غير مصرح — خارج نطاق المنصة' }, { status: 403 })
    }
    await prisma.knowledgeItem.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Knowledge DELETE error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}
