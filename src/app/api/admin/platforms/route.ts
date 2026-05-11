import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { PlatformSchema, ProgramSchema, ActivitySchema } from '@/lib/validations/platform'
import { z } from 'zod'

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
    const platforms = await prisma.platform.findMany({
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
  } catch {
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authError = await checkAuth()
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
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const authError = await checkAuth()
  if (authError) return authError

  try {
    const body = await request.json()
    const { id, ...data } = body
    if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })
    const validated = PlatformSchema.partial().parse(data)
    const platform = await prisma.platform.update({ where: { id }, data: validated })
    return NextResponse.json({ success: true, data: platform })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, errors: error.flatten() }, { status: 400 })
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
    await prisma.platform.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

// Program CRUD within a platform
export async function PATCH(request: NextRequest) {
  const authError = await checkAuth()
  if (authError) return authError

  try {
    const body = await request.json()
    const { action, ...data } = body

    if (action === 'add-program') {
      const validated = ProgramSchema.parse(data)
      const program = await prisma.program.create({ data: validated })
      return NextResponse.json({ success: true, data: program }, { status: 201 })
    }
    if (action === 'update-program') {
      const { id, ...updateData } = data
      if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })
      const validated = ProgramSchema.partial().parse(updateData)
      const program = await prisma.program.update({ where: { id }, data: validated })
      return NextResponse.json({ success: true, data: program })
    }
    if (action === 'delete-program') {
      const { id } = data
      if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })
      await prisma.program.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }
    if (action === 'add-activity') {
      const validated = ActivitySchema.parse(data)
      const activity = await prisma.activity.create({ data: validated })
      return NextResponse.json({ success: true, data: activity }, { status: 201 })
    }
    if (action === 'update-activity') {
      const { id, ...updateData } = data
      if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })
      const validated = ActivitySchema.partial().parse(updateData)
      const activity = await prisma.activity.update({ where: { id }, data: validated })
      return NextResponse.json({ success: true, data: activity })
    }
    if (action === 'delete-activity') {
      const { id } = data
      if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })
      await prisma.activity.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: false, message: 'إجراء غير معروف' }, { status: 400 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, errors: error.flatten() }, { status: 400 })
    }
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}
