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
    const tasks = await prisma.coordinationTask.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        platform: { select: { name: true, slug: true } },
        program: { select: { name: true, slug: true } },
      },
    })
    return NextResponse.json({ success: true, data: tasks })
  } catch {
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authError = await checkAuth()
  if (authError) return authError

  try {
    const body = await request.json()
    const { title, description, assignee, assigneeRole, status, priority, dueDate, notes, platformId, programId } = body

    if (!title) {
      return NextResponse.json({ success: false, message: 'عنوان المهمة مطلوب' }, { status: 400 })
    }

    const task = await prisma.coordinationTask.create({
      data: {
        title,
        description: description || null,
        assignee: assignee || null,
        assigneeRole: assigneeRole || null,
        status: status || 'PENDING',
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        notes: notes || null,
        platformId: platformId || null,
        programId: programId || null,
      },
    })

    // If status is COMPLETED, set completedAt
    if (status === 'COMPLETED') {
      await prisma.coordinationTask.update({
        where: { id: task.id },
        data: { completedAt: new Date() },
      })
    }

    return NextResponse.json({ success: true, data: task }, { status: 201 })
  } catch {
    return NextResponse.json({ success: false, message: 'خطأ في إنشاء المهمة' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const authError = await checkAuth()
  if (authError) return authError

  try {
    const body = await request.json()
    const { id, title, description, assignee, assigneeRole, status, priority, dueDate, notes, platformId, programId, completedAt } = body

    if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })

    const data: Record<string, unknown> = {}
    if (title !== undefined) data.title = title
    if (description !== undefined) data.description = description || null
    if (assignee !== undefined) data.assignee = assignee || null
    if (assigneeRole !== undefined) data.assigneeRole = assigneeRole || null
    if (status !== undefined) data.status = status
    if (priority !== undefined) data.priority = priority
    if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null
    if (notes !== undefined) data.notes = notes || null
    if (platformId !== undefined) data.platformId = platformId || null
    if (programId !== undefined) data.programId = programId || null
    if (completedAt !== undefined) data.completedAt = completedAt ? new Date(completedAt) : null

    // Auto-set completedAt when status changes to COMPLETED
    if (status === 'COMPLETED') {
      data.completedAt = new Date()
    }

    const task = await prisma.coordinationTask.update({ where: { id }, data })
    return NextResponse.json({ success: true, data: task })
  } catch {
    return NextResponse.json({ success: false, message: 'خطأ في تحديث المهمة' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const authError = await checkAuth()
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })
    await prisma.coordinationTask.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}
