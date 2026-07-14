import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ProjectSchema } from '@/lib/validations/project'
import { getPlatformScope, platformWhere, requireAuth, verifyPlatformOwnership } from '@/lib/auth-helpers'
import { logger } from '@/lib/logger'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '50')))
    const scope = getPlatformScope(auth.user)
    const where = platformWhere(scope)

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy: { sortOrder: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          platform: { select: { id: true, name: true, slug: true, color: true } },
          program: { select: { id: true, name: true, slug: true } },
          _count: { select: { knowledgeItems: true, submittedReports: true, evaluations: true } },
        },
      }),
      prisma.project.count({ where }),
    ])

    return NextResponse.json({ success: true, data: { projects, total, page } })
  } catch (error) {
    logger.error('Projects GET error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error

  try {
    const body = await request.json()
    const validated = ProjectSchema.parse(body)
    const { platformId, programId, ...rest } = validated
    const scopedPlatformId = auth.user.role === 'PLATFORM_MANAGER' ? auth.user.platformId : platformId || null
    if (auth.user.role === 'PLATFORM_MANAGER' && !scopedPlatformId) {
      return NextResponse.json({ success: false, message: 'مدير المنصة غير مرتبط بمنصة' }, { status: 403 })
    }
    if (programId) {
      const program = await prisma.program.findUnique({ where: { id: programId }, select: { platformId: true } })
      if (!program || !(await verifyPlatformOwnership(auth.user, program.platformId))) {
        return NextResponse.json({ success: false, message: 'غير مصرح — خارج نطاق المنصة' }, { status: 403 })
      }
    }
    const project = await prisma.project.create({
      data: {
        ...rest,
        platformId: scopedPlatformId,
        programId: programId || null,
      },
    })
    return NextResponse.json({ success: true, data: project }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, errors: error.flatten() }, { status: 400 })
    }
    logger.error('Projects POST error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error

  try {
    const body = await request.json()
    const { id, ...data } = body
    if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })
    const current = await prisma.project.findUnique({ where: { id }, select: { platformId: true } })
    if (!current) return NextResponse.json({ success: false, message: 'المشروع غير موجود' }, { status: 404 })
    if (!(await verifyPlatformOwnership(auth.user, current.platformId))) {
      return NextResponse.json({ success: false, message: 'غير مصرح — خارج نطاق المنصة' }, { status: 403 })
    }
    const validated = ProjectSchema.partial().parse(data)
    const { platformId, programId, ...rest } = validated
    if (programId) {
      const program = await prisma.program.findUnique({ where: { id: programId }, select: { platformId: true } })
      if (!program || !(await verifyPlatformOwnership(auth.user, program.platformId))) {
        return NextResponse.json({ success: false, message: 'غير مصرح — خارج نطاق المنصة' }, { status: 403 })
      }
    }
    const project = await prisma.project.update({
      where: { id },
      data: {
        ...rest,
        ...(platformId !== undefined && { platformId: auth.user.role === 'PLATFORM_MANAGER' ? auth.user.platformId : platformId || null }),
        ...(programId !== undefined && { programId: programId || null }),
      },
    })
    return NextResponse.json({ success: true, data: project })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, errors: error.flatten() }, { status: 400 })
    }
    logger.error('Projects PUT error', error)
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
    const project = await prisma.project.findUnique({ where: { id }, select: { platformId: true } })
    if (!project) return NextResponse.json({ success: false, message: 'المشروع غير موجود' }, { status: 404 })
    if (!(await verifyPlatformOwnership(auth.user, project.platformId))) {
      return NextResponse.json({ success: false, message: 'غير مصرح — خارج نطاق المنصة' }, { status: 403 })
    }
    await prisma.project.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Projects DELETE error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}
