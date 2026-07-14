import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { recordActivityLog } from '@/lib/activity-log'
import { getPlatformScope, platformWhere, requireAuth, verifyPlatformOwnership } from '@/lib/auth-helpers'
import { logger } from '@/lib/logger'
import { canReviewReports, canSetReportStatus, parseReportStatus, type ReportStatusValue } from '@/lib/report-policy'

async function reportTargetsAreValid(platformId: string | null, programId?: string | null, projectId?: string | null) {
  const [program, project] = await Promise.all([
    programId ? prisma.program.findUnique({ where: { id: programId }, select: { platformId: true } }) : null,
    projectId ? prisma.project.findUnique({ where: { id: projectId }, select: { platformId: true } }) : null,
  ])

  if (programId && !program) return false
  if (projectId && !project) return false
  if (!platformId) return true
  return (!program || program.platformId === platformId) && (!project || project.platformId === platformId)
}

export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error

  try {
    const scope = getPlatformScope(auth.user)
    const reports = await prisma.submittedReport.findMany({
      where: platformWhere(scope),
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
  const auth = await requireAuth()
  if (!auth.ok) return auth.error

  try {
    const body = await request.json()
    const {
      templateId,
      data,
      status: requestedStatus = 'DRAFT',
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
    const status = parseReportStatus(requestedStatus)
    if (!status) return NextResponse.json({ success: false, message: 'حالة التقرير غير صحيحة' }, { status: 400 })
    if (!canSetReportStatus(auth.user.role, status) || (!canReviewReports(auth.user.role) && (reviewedBy || reviewNotes))) {
      return NextResponse.json({ success: false, message: 'غير مصرح باعتماد أو مراجعة التقارير' }, { status: 403 })
    }
    const scopedPlatformId = auth.user.role === 'PLATFORM_MANAGER' ? auth.user.platformId : platformId || null
    if (auth.user.role === 'PLATFORM_MANAGER' && !scopedPlatformId) {
      return NextResponse.json({ success: false, message: 'مدير المنصة غير مرتبط بمنصة' }, { status: 403 })
    }
    if (!(await reportTargetsAreValid(scopedPlatformId, programId, projectId))) {
      return NextResponse.json({ success: false, message: 'البرنامج أو المشروع لا ينتمي إلى منصة التقرير' }, { status: 400 })
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
        platformId: scopedPlatformId,
        programId: programId || null,
        projectId: projectId || null,
      },
    })

    await recordActivityLog({
      entity: 'report',
      entityId: report.id,
      action: 'CREATE',
      actor: auth.user.email || auth.user.name,
      changes: report,
    })

    return NextResponse.json({ success: true, data: report }, { status: 201 })
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ success: false, message: 'بيانات التقرير يجب أن تكون JSON صحيحاً' }, { status: 400 })
    }
    logger.error('Submitted report POST error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error

  try {
    const body = await request.json()
    const {
      id,
      templateId,
      data,
      status: requestedStatus,
      submittedBy,
      reviewedBy,
      reviewNotes,
      platformId,
      programId,
      projectId,
    } = body
    if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })
    let status: ReportStatusValue | undefined
    if (requestedStatus !== undefined) {
      const parsedStatus = parseReportStatus(requestedStatus)
      if (!parsedStatus) {
        return NextResponse.json({ success: false, message: 'حالة التقرير غير صحيحة' }, { status: 400 })
      }
      status = parsedStatus
    }
    if ((status && !canSetReportStatus(auth.user.role, status)) || (!canReviewReports(auth.user.role) && (reviewedBy || reviewNotes))) {
      return NextResponse.json({ success: false, message: 'غير مصرح باعتماد أو مراجعة التقارير' }, { status: 403 })
    }
    const current = await prisma.submittedReport.findUnique({ where: { id }, select: { status: true, platformId: true, programId: true, projectId: true } })
    if (!current) return NextResponse.json({ success: false, message: 'التقرير غير موجود' }, { status: 404 })
    if (!canReviewReports(auth.user.role) && ['REVIEWED', 'APPROVED', 'REJECTED'].includes(current.status)) {
      return NextResponse.json({ success: false, message: 'لا يمكن تعديل تقرير بعد دخوله مرحلة المراجعة' }, { status: 403 })
    }
    if (!(await verifyPlatformOwnership(auth.user, current.platformId))) {
      return NextResponse.json({ success: false, message: 'غير مصرح — خارج نطاق المنصة' }, { status: 403 })
    }
    const scopedPlatformId = auth.user.role === 'PLATFORM_MANAGER' ? auth.user.platformId : platformId || null
    const effectivePlatformId = auth.user.role === 'PLATFORM_MANAGER'
      ? auth.user.platformId
      : platformId !== undefined ? platformId || null : current.platformId
    const effectiveProgramId = programId !== undefined ? programId || null : current.programId
    const effectiveProjectId = projectId !== undefined ? projectId || null : current.projectId
    if (!(await reportTargetsAreValid(effectivePlatformId, effectiveProgramId, effectiveProjectId))) {
      return NextResponse.json({ success: false, message: 'البرنامج أو المشروع لا ينتمي إلى منصة التقرير' }, { status: 400 })
    }

    const report = await prisma.submittedReport.update({
      where: { id },
      data: {
        ...(templateId !== undefined && { templateId }),
        ...(data !== undefined && { data: normalizeReportData(data) }),
        ...(status !== undefined && { status, ...statusDates(status, reviewedBy) }),
        ...(submittedBy !== undefined && { submittedBy: submittedBy || null }),
        ...(reviewedBy !== undefined && { reviewedBy: reviewedBy || null }),
        ...(reviewNotes !== undefined && { reviewNotes: reviewNotes || null }),
        ...(platformId !== undefined || auth.user.role === 'PLATFORM_MANAGER' ? { platformId: scopedPlatformId } : {}),
        ...(programId !== undefined && { programId: programId || null }),
        ...(projectId !== undefined && { projectId: projectId || null }),
      },
    })

    await recordActivityLog({
      entity: 'report',
      entityId: report.id,
      action: status ? `STATUS_${status}` : 'UPDATE',
      actor: auth.user.email || auth.user.name,
      changes: body,
    })

    return NextResponse.json({ success: true, data: report })
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ success: false, message: 'بيانات التقرير يجب أن تكون JSON صحيحاً' }, { status: 400 })
    }
    logger.error('Submitted report PUT error', error)
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
    const report = await prisma.submittedReport.findUnique({ where: { id }, select: { platformId: true } })
    if (!report) return NextResponse.json({ success: false, message: 'التقرير غير موجود' }, { status: 404 })
    if (!(await verifyPlatformOwnership(auth.user, report.platformId))) {
      return NextResponse.json({ success: false, message: 'غير مصرح — خارج نطاق المنصة' }, { status: 403 })
    }

    await prisma.submittedReport.delete({ where: { id } })

    await recordActivityLog({
      entity: 'report',
      entityId: id,
      action: 'DELETE',
      actor: auth.user.email || auth.user.name,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Submitted report DELETE error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}
