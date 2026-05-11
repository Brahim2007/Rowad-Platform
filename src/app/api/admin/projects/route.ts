import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { ProjectSchema } from '@/lib/validations/project'
import { z } from 'zod'

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
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '50')))

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        orderBy: { sortOrder: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          platform: { select: { id: true, name: true, slug: true, color: true } },
          program: { select: { id: true, name: true, slug: true } },
          _count: { select: { knowledgeItems: true, submittedReports: true, evaluations: true } },
        },
      }),
      prisma.project.count(),
    ])

    return NextResponse.json({ success: true, data: { projects, total, page } })
  } catch {
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authError = await checkAuth()
  if (authError) return authError

  try {
    const body = await request.json()
    const validated = ProjectSchema.parse(body)
    const { platformId, programId, ...rest } = validated
    const project = await prisma.project.create({
      data: {
        ...rest,
        platformId: platformId || null,
        programId: programId || null,
      },
    })
    return NextResponse.json({ success: true, data: project }, { status: 201 })
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
    const validated = ProjectSchema.partial().parse(data)
    const { platformId, programId, ...rest } = validated
    const project = await prisma.project.update({
      where: { id },
      data: {
        ...rest,
        ...(platformId !== undefined && { platformId: platformId || null }),
        ...(programId !== undefined && { programId: programId || null }),
      },
    })
    return NextResponse.json({ success: true, data: project })
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
    await prisma.project.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}
