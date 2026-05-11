import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { recordActivityLog } from '@/lib/activity-log'

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
    const reports = await prisma.submittedReport.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        template: { select: { title: true, description: true, category: true, sections: true } },
        platform: { select: { id: true, name: true } },
        program: { select: { id: true, name: true } },
        project: { select: { id: true, title: true } },
      },
    })

    return NextResponse.json({ success: true, data: reports })
  } catch {
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

function normalizeReportData(value: unknown) {
  if (!value) return '{}'
  if (typeof value === 'string') {
    JSON.parse(value)
    return value
  }
  return JSON.stringify(value)
}

function statusDates(status?: string, reviewedBy?: string | null) {
  const data: { submittedAt?: Date; reviewedAt?: Date; reviewedBy?: string | null } = {}
  if (status === 'SUBMITTED') data.submittedAt = new Date()
  if (status === 'REVIEWED' || status === 'APPROVED' || status === 'REJECTED') {
    data.reviewedAt = new Date()
    if (reviewedBy !== undefined) data.reviewedBy = reviewedBy || null
  }
  return data
}

export async function POST(request: NextRequest) {
  const authError = await checkAuth()
  if (authError) return authError

  try {
    const body = await request.json()
    const {
      templateId,
      data,
      status = 'DRAFT',
      submittedBy,
      reviewedBy,
      reviewNotes,
      platformId,
      programId,
      projectId,
    } = body

    if (!templateId) {
      return NextResponse.json({ success: false, message: 'قالب التقرير مطلوب' }, { status: 400 })
    }

    const report = await prisma.submittedReport.create({
      data: {
        templateId,
        data: normalizeReportData(data),
        status,
        submittedBy: submittedBy || null,
        reviewedBy: reviewedBy || null,
        reviewNotes: reviewNotes || null,
        submittedAt: status !== 'DRAFT' ? new Date() : null,
        reviewedAt: ['REVIEWED', 'APPROVED', 'REJECTED'].includes(status) ? new Date() : null,
        platformId: platformId || null,
        programId: programId || null,
        projectId: projectId || null,
      },
    })

    const session = await auth()
    await recordActivityLog({
      entity: 'report',
      entityId: report.id,
      action: 'CREATE',
      actor: session?.user?.email || session?.user?.name,
      changes: report,
    })

    return NextResponse.json({ success: true, data: report }, { status: 201 })
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ success: false, message: 'بيانات التقرير يجب أن تكون JSON صحيحاً' }, { status: 400 })
    }
    console.error('Submitted report POST error:', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const authError = await checkAuth()
  if (authError) return authError

  try {
    const body = await request.json()
    const {
      id,
      templateId,
      data,
      status,
      submittedBy,
      reviewedBy,
      reviewNotes,
      platformId,
      programId,
      projectId,
    } = body
    if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })

    const report = await prisma.submittedReport.update({
      where: { id },
      data: {
        ...(templateId !== undefined && { templateId }),
        ...(data !== undefined && { data: normalizeReportData(data) }),
        ...(status !== undefined && { status, ...statusDates(status, reviewedBy) }),
        ...(submittedBy !== undefined && { submittedBy: submittedBy || null }),
        ...(reviewedBy !== undefined && { reviewedBy: reviewedBy || null }),
        ...(reviewNotes !== undefined && { reviewNotes: reviewNotes || null }),
        ...(platformId !== undefined && { platformId: platformId || null }),
        ...(programId !== undefined && { programId: programId || null }),
        ...(projectId !== undefined && { projectId: projectId || null }),
      },
    })

    const session = await auth()
    await recordActivityLog({
      entity: 'report',
      entityId: report.id,
      action: status ? `STATUS_${status}` : 'UPDATE',
      actor: session?.user?.email || session?.user?.name,
      changes: body,
    })

    return NextResponse.json({ success: true, data: report })
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ success: false, message: 'بيانات التقرير يجب أن تكون JSON صحيحاً' }, { status: 400 })
    }
    console.error('Submitted report PUT error:', error)
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

    await prisma.submittedReport.delete({ where: { id } })

    const session = await auth()
    await recordActivityLog({
      entity: 'report',
      entityId: id,
      action: 'DELETE',
      actor: session?.user?.email || session?.user?.name,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Submitted report DELETE error:', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}
