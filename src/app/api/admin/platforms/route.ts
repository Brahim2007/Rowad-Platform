import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PlatformSchema, ProgramSchema, ActivitySchema } from '@/lib/validations/platform'
import { getPlatformScope, platformWhere, requireAuth, type SessionUser, verifyPlatformOwnership } from '@/lib/auth-helpers'
import { logger } from '@/lib/logger'
import { z } from 'zod'

function requireGlobalPlatformMutation(user: SessionUser) {
  if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') return null
  return NextResponse.json({ success: false, message: 'هذه الميزة متاحة للإدارة العامة فقط' }, { status: 403 })
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error
  if (auth.user.role === 'PLATFORM_MANAGER' && !auth.user.platformId) {
    return NextResponse.json({ success: false, message: 'مدير المنصة غير مرتبط بمنصة' }, { status: 403 })
  }

  try {
    const scope = getPlatformScope(auth.user)
    const compact = new URL(request.url).searchParams.get('compact') === '1'
    if (compact) {
      const platforms = await prisma.platform.findMany({
        where: platformWhere(scope),
        orderBy: { sortOrder: 'asc' },
        select: { id: true, name: true, slug: true, isActive: true },
      })
      return NextResponse.json({ success: true, data: { platforms } })
    }

    const platforms = await prisma.platform.findMany({
      where: platformWhere(scope),
      orderBy: { sortOrder: 'asc' },
      include: {
        programs: {
          orderBy: { sortOrder: 'asc' },
          include: {
            activities: {
              orderBy: { sortOrder: 'asc' },
            },
            projects: {
              take: 4,
              orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
              select: {
                id: true,
                title: true,
                slug: true,
                category: true,
                status: true,
                isFeatured: true,
              },
            },
            knowledgeItems: {
              take: 4,
              orderBy: { createdAt: 'desc' },
              select: {
                id: true,
                title: true,
                slug: true,
                category: true,
                type: true,
                isPublished: true,
              },
            },
            _count: {
              select: {
                activities: true,
                enrollments: true,
                projects: true,
                knowledgeItems: true,
                submittedReports: true,
                evaluations: true,
              },
            },
          },
        },
      },
    })
    return NextResponse.json({ success: true, data: { platforms } })
  } catch (error) {
    logger.error('Platforms GET error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error
  const authError = requireGlobalPlatformMutation(auth.user)
  if (authError) return authError

  try {
    const body = await request.json()
    const validated = PlatformSchema.parse(body)
    const platform = await prisma.platform.create({ data: validated })
    return NextResponse.json({ success: true, data: platform }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, errors: error.flatten() }, { status: 400 })
    }
    logger.error('Platforms POST error', error)
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
    if (!(await verifyPlatformOwnership(auth.user, id))) {
      return NextResponse.json({ success: false, message: 'غير مصرح — خارج نطاق المنصة' }, { status: 403 })
    }
    const validated = PlatformSchema.partial().parse(data)
    const platform = await prisma.platform.update({ where: { id }, data: validated })
    return NextResponse.json({ success: true, data: platform })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, errors: error.flatten() }, { status: 400 })
    }
    logger.error('Platforms PUT error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error
  const authError = requireGlobalPlatformMutation(auth.user)
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })
    await prisma.platform.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Platforms DELETE error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

// Program CRUD within a platform
export async function PATCH(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error

  try {
    const body = await request.json()
    const { action, ...data } = body

    if (action === 'add-program') {
      const validated = ProgramSchema.parse({
        ...data,
        platformId: auth.user.role === 'PLATFORM_MANAGER' ? auth.user.platformId : data.platformId,
      })
      if (!(await verifyPlatformOwnership(auth.user, validated.platformId))) {
        return NextResponse.json({ success: false, message: 'غير مصرح — خارج نطاق المنصة' }, { status: 403 })
      }
      const program = await prisma.program.create({ data: validated })
      return NextResponse.json({ success: true, data: program }, { status: 201 })
    }
    if (action === 'update-program') {
      const { id, ...updateData } = data
      if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })
      const current = await prisma.program.findUnique({ where: { id }, select: { platformId: true } })
      if (!current) return NextResponse.json({ success: false, message: 'البرنامج غير موجود' }, { status: 404 })
      if (!(await verifyPlatformOwnership(auth.user, current.platformId))) {
        return NextResponse.json({ success: false, message: 'غير مصرح — خارج نطاق المنصة' }, { status: 403 })
      }
      const validated = ProgramSchema.partial().parse({
        ...updateData,
        ...(updateData.platformId !== undefined && {
          platformId: auth.user.role === 'PLATFORM_MANAGER' ? auth.user.platformId : updateData.platformId,
        }),
      })
      if (validated.platformId && !(await verifyPlatformOwnership(auth.user, validated.platformId))) {
        return NextResponse.json({ success: false, message: 'غير مصرح — خارج نطاق المنصة' }, { status: 403 })
      }
      const program = await prisma.program.update({ where: { id }, data: validated })
      return NextResponse.json({ success: true, data: program })
    }
    if (action === 'delete-program') {
      const { id } = data
      if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })
      const program = await prisma.program.findUnique({ where: { id }, select: { platformId: true } })
      if (!program) return NextResponse.json({ success: false, message: 'البرنامج غير موجود' }, { status: 404 })
      if (!(await verifyPlatformOwnership(auth.user, program.platformId))) {
        return NextResponse.json({ success: false, message: 'غير مصرح — خارج نطاق المنصة' }, { status: 403 })
      }
      await prisma.program.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }
    if (action === 'add-activity') {
      const validated = ActivitySchema.parse(data)
      const program = await prisma.program.findUnique({ where: { id: validated.programId }, select: { platformId: true } })
      if (!program || !(await verifyPlatformOwnership(auth.user, program.platformId))) {
        return NextResponse.json({ success: false, message: 'غير مصرح — خارج نطاق المنصة' }, { status: 403 })
      }
      const activity = await prisma.activity.create({ data: validated })
      return NextResponse.json({ success: true, data: activity }, { status: 201 })
    }
    if (action === 'update-activity') {
      const { id, ...updateData } = data
      if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })
      const current = await prisma.activity.findUnique({
        where: { id },
        select: { program: { select: { platformId: true } } },
      })
      if (!current) return NextResponse.json({ success: false, message: 'النشاط غير موجود' }, { status: 404 })
      if (!(await verifyPlatformOwnership(auth.user, current.program.platformId))) {
        return NextResponse.json({ success: false, message: 'غير مصرح — خارج نطاق المنصة' }, { status: 403 })
      }
      const validated = ActivitySchema.partial().parse(updateData)
      if (validated.programId) {
        const program = await prisma.program.findUnique({ where: { id: validated.programId }, select: { platformId: true } })
        if (!program || !(await verifyPlatformOwnership(auth.user, program.platformId))) {
          return NextResponse.json({ success: false, message: 'غير مصرح — خارج نطاق المنصة' }, { status: 403 })
        }
      }
      const activity = await prisma.activity.update({ where: { id }, data: validated })
      return NextResponse.json({ success: true, data: activity })
    }
    if (action === 'delete-activity') {
      const { id } = data
      if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })
      const activity = await prisma.activity.findUnique({
        where: { id },
        select: { program: { select: { platformId: true } } },
      })
      if (!activity) return NextResponse.json({ success: false, message: 'النشاط غير موجود' }, { status: 404 })
      if (!(await verifyPlatformOwnership(auth.user, activity.program.platformId))) {
        return NextResponse.json({ success: false, message: 'غير مصرح — خارج نطاق المنصة' }, { status: 403 })
      }
      await prisma.activity.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: false, message: 'إجراء غير معروف' }, { status: 400 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, errors: error.flatten() }, { status: 400 })
    }
    logger.error('Platforms PATCH error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}
