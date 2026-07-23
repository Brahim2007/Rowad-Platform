import { NextRequest, NextResponse } from 'next/server'
import { EvaluationStatus, EvaluationType, Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { recordActivityLog } from '@/lib/activity-log'
import { getPlatformScope, platformWhere, requireAuth, type SessionUser } from '@/lib/auth-helpers'
import { logger } from '@/lib/logger'
import {
  canCreateEvaluation,
  canDeleteEvaluation,
  canEditEvaluationForActor,
  canReviewEvaluation,
} from '@/lib/evaluation-policy'

const MANAGEMENT_ROLES = new Set(['SUPER_ADMIN', 'ADMIN'])
const REVIEWABLE_STATUSES = new Set<EvaluationStatus>([
  EvaluationStatus.SUBMITTED,
  EvaluationStatus.FINAL,
])

async function requireEvaluationsAccess() {
  const auth = await requireAuth({ allowEvaluator: true })
  if (!auth.ok) return auth
  if (auth.user.role === 'EDITOR') {
    return {
      ok: false as const,
      error: NextResponse.json({ success: false, message: 'التقييمات غير متاحة لدور المحرر' }, { status: 403 }),
    }
  }
  if (auth.user.role === 'PLATFORM_MANAGER' && !auth.user.platformId) {
    return {
      ok: false as const,
      error: NextResponse.json({ success: false, message: 'مدير المنصة غير مرتبط بمنصة' }, { status: 403 }),
    }
  }
  return auth
}

function nullable(value: unknown) {
  const trimmed = String(value || '').trim()
  return trimmed || null
}

function parseType(value: unknown) {
  const type = String(value || EvaluationType.PROGRAM)
  return Object.values(EvaluationType).includes(type as EvaluationType)
    ? type as EvaluationType
    : EvaluationType.PROGRAM
}

function numeric(value: unknown, fallback: number | null) {
  if (value === undefined || value === null || value === '') return fallback
  const result = Number(value)
  if (!Number.isFinite(result)) throw new Error('قيمة الدرجة غير صحيحة')
  return result
}

async function resolveTarget(body: Record<string, unknown>, user: SessionUser) {
  const type = user.role === 'PLATFORM_MANAGER' ? EvaluationType.SELF : parseType(body.type)
  let platformId = nullable(body.platformId)
  const programId = nullable(body.programId)
  const activityId = nullable(body.activityId)
  const projectId = nullable(body.projectId)

  if (programId) {
    const program = await prisma.program.findUnique({ where: { id: programId }, select: { platformId: true } })
    if (!program) throw new Error('البرنامج المحدد غير موجود')
    platformId = program.platformId
  }
  if (activityId) {
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      select: { program: { select: { platformId: true } } },
    })
    if (!activity) throw new Error('النشاط المحدد غير موجود')
    platformId = activity.program.platformId
  }
  if (projectId) {
    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { platformId: true } })
    if (!project) throw new Error('المشروع المحدد غير موجود')
    platformId = project.platformId
  }
  if (user.role === 'PLATFORM_MANAGER') platformId = user.platformId
  if (!platformId) throw new Error('يجب ربط التقييم بمنصة')
  if (user.role === 'PLATFORM_MANAGER' && platformId !== user.platformId) {
    throw new Error('لا يمكن إنشاء تقييم خارج نطاق منصتك')
  }

  return {
    type,
    platformId,
    programId: type === EvaluationType.PROGRAM ? programId : null,
    activityId: type === EvaluationType.ACTIVITY ? activityId : null,
    projectId: type === EvaluationType.PROJECT ? projectId : null,
  }
}

async function resolveEvaluator(body: Record<string, unknown>, user: SessionUser) {
  const requestedId = nullable(body.evaluatorUserId)
  const evaluatorUserId = user.role === 'PLATFORM_MANAGER' ? user.id : requestedId || user.id
  const evaluator = await prisma.adminUser.findFirst({
    where: {
      id: evaluatorUserId,
      isActive: true,
      role: { in: ['SUPER_ADMIN', 'ADMIN', 'PLATFORM_MANAGER', 'EVALUATOR'] },
    },
    select: { id: true, fullName: true, email: true, role: true },
  })
  if (!evaluator) throw new Error('يجب اختيار مقيّم نشط ومعتمد')
  return evaluator
}

function canEditEvaluation(
  user: SessionUser,
  evaluation: { status: EvaluationStatus; evaluatorUserId: string | null; createdById: string | null; platformId: string | null },
) {
  return canEditEvaluationForActor({
    role: user.role,
    userId: user.id,
    platformId: user.platformId,
    evaluation,
  })
}

const evaluationInclude = {
  platform: { select: { id: true, name: true, slug: true } },
  program: { select: { id: true, name: true, slug: true } },
  activity: { select: { id: true, name: true, slug: true } },
  project: { select: { id: true, title: true, slug: true } },
  evaluatorUser: { select: { id: true, fullName: true, email: true, role: true } },
  createdBy: { select: { id: true, fullName: true, email: true } },
  approvedBy: { select: { id: true, fullName: true, email: true } },
} satisfies Prisma.EvaluationInclude

export async function GET(request: NextRequest) {
  const auth = await requireEvaluationsAccess()
  if (!auth.ok) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || ''
    const status = searchParams.get('status') || ''
    const scopedPlatformWhere = auth.user.role === 'PLATFORM_MANAGER'
      ? platformWhere(getPlatformScope(auth.user))
      : {}
    const where: Prisma.EvaluationWhereInput = {
      ...scopedPlatformWhere,
      ...(auth.user.role === 'EVALUATOR' && { evaluatorUserId: auth.user.id }),
      ...(type && { type: parseType(type) }),
      ...(status && Object.values(EvaluationStatus).includes(status as EvaluationStatus) && { status: status as EvaluationStatus }),
    }
    const [evaluations, evaluators] = await Promise.all([
      prisma.evaluation.findMany({ where, orderBy: { evaluatedAt: 'desc' }, include: evaluationInclude }),
      MANAGEMENT_ROLES.has(auth.user.role)
        ? prisma.adminUser.findMany({
            where: { isActive: true, role: { in: ['SUPER_ADMIN', 'ADMIN', 'EVALUATOR'] } },
            orderBy: { fullName: 'asc' },
            select: { id: true, fullName: true, email: true, role: true },
          })
        : Promise.resolve([]),
    ])

    return NextResponse.json({
      success: true,
      data: evaluations.map(evaluation => ({
        ...evaluation,
        permissions: {
          canEdit: canEditEvaluation(auth.user, evaluation),
          canDelete: canDeleteEvaluation(auth.user.role, evaluation.status),
          canSubmit: canEditEvaluation(auth.user, evaluation),
          canReview: canReviewEvaluation({
            role: auth.user.role,
            userId: auth.user.id,
            status: evaluation.status,
            createdById: evaluation.createdById,
            evaluatorUserId: evaluation.evaluatorUserId,
          }),
        },
      })),
      meta: {
        role: auth.user.role,
        canCreate: canCreateEvaluation(auth.user.role),
        canAssign: MANAGEMENT_ROLES.has(auth.user.role),
        evaluators,
      },
    })
  } catch (error) {
    logger.error('Evaluations GET error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireEvaluationsAccess()
  if (!auth.ok) return auth.error
  if (auth.user.role === 'EVALUATOR') {
    return NextResponse.json({ success: false, message: 'ينفذ المقيّم التقييمات المسندة إليه ولا ينشئ تكليفات جديدة' }, { status: 403 })
  }

  try {
    const body = await request.json() as Record<string, unknown>
    const title = String(body.title || '').trim()
    if (!title) return NextResponse.json({ success: false, message: 'عنوان التقييم مطلوب' }, { status: 400 })
    const target = await resolveTarget(body, auth.user)
    const evaluatorUser = await resolveEvaluator(body, auth.user)
    const score = numeric(body.score, null)
    const maxScore = numeric(body.maxScore, 100) || 100
    if (score !== null && (score < 0 || score > maxScore)) {
      return NextResponse.json({ success: false, message: 'النتيجة يجب أن تكون بين صفر والدرجة القصوى' }, { status: 400 })
    }

    const evaluation = await prisma.evaluation.create({
      data: {
        title,
        evaluator: evaluatorUser.fullName,
        evaluatorUserId: evaluatorUser.id,
        evaluatorRole: auth.user.role === 'PLATFORM_MANAGER' ? 'SELF' : nullable(body.evaluatorRole) || 'INTERNAL',
        createdById: auth.user.id,
        status: EvaluationStatus.DRAFT,
        evaluatedAt: body.evaluatedAt ? new Date(String(body.evaluatedAt)) : new Date(),
        score,
        maxScore,
        feedback: nullable(body.feedback),
        recommendations: nullable(body.recommendations),
        ...target,
      },
      include: evaluationInclude,
    })
    await recordActivityLog({
      entity: 'evaluation',
      entityId: evaluation.id,
      action: 'CREATE',
      actor: auth.user.email || auth.user.name,
      changes: { title, evaluatorUserId: evaluatorUser.id, platformId: target.platformId, status: EvaluationStatus.DRAFT },
    })
    return NextResponse.json({ success: true, data: evaluation }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطأ في الخادم'
    logger.error('Evaluations POST error', error)
    return NextResponse.json({ success: false, message }, { status: 400 })
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireEvaluationsAccess()
  if (!auth.ok) return auth.error

  try {
    const body = await request.json() as Record<string, unknown>
    const id = String(body.id || '')
    const action = String(body.action || 'save')
    if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })
    const current = await prisma.evaluation.findUnique({ where: { id }, include: evaluationInclude })
    if (!current) return NextResponse.json({ success: false, message: 'التقييم غير موجود' }, { status: 404 })

    if (action === 'approve' || action === 'reject') {
      if (!MANAGEMENT_ROLES.has(auth.user.role)) {
        return NextResponse.json({ success: false, message: 'الاعتماد والرفض من صلاحيات إدارة النظام فقط' }, { status: 403 })
      }
      if (!REVIEWABLE_STATUSES.has(current.status)) {
        return NextResponse.json({ success: false, message: 'يجب إرسال التقييم للمراجعة أولًا' }, { status: 409 })
      }
      if (!canReviewEvaluation({
        role: auth.user.role,
        userId: auth.user.id,
        status: current.status,
        createdById: current.createdById,
        evaluatorUserId: current.evaluatorUserId,
      })) {
        return NextResponse.json({ success: false, message: 'لا يجوز لمن أنشأ أو نفذ التقييم أن يعتمد تقييمه بنفسه' }, { status: 403 })
      }
      const rejectionReason = nullable(body.rejectionReason)
      if (action === 'reject' && !rejectionReason) {
        return NextResponse.json({ success: false, message: 'سبب الرفض مطلوب' }, { status: 400 })
      }
      const evaluation = await prisma.evaluation.update({
        where: { id },
        data: action === 'approve'
          ? { status: EvaluationStatus.APPROVED, approvedById: auth.user.id, approvedAt: new Date(), rejectionReason: null }
          : { status: EvaluationStatus.REJECTED, approvedById: auth.user.id, approvedAt: new Date(), rejectionReason },
        include: evaluationInclude,
      })
      await recordActivityLog({
        entity: 'evaluation',
        entityId: id,
        action: action === 'approve' ? 'APPROVE' : 'REJECT',
        actor: auth.user.email || auth.user.name,
        changes: { from: current.status, to: evaluation.status, rejectionReason },
      })
      return NextResponse.json({ success: true, data: evaluation })
    }

    if (!canEditEvaluation(auth.user, current)) {
      return NextResponse.json({ success: false, message: 'لا يمكنك تعديل هذا التقييم في حالته الحالية' }, { status: 403 })
    }

    const score = numeric(body.score, current.score)
    const maxScore = numeric(body.maxScore, current.maxScore) || current.maxScore
    if (score !== null && (score < 0 || score > maxScore)) {
      return NextResponse.json({ success: false, message: 'النتيجة يجب أن تكون بين صفر والدرجة القصوى' }, { status: 400 })
    }
    const commonData: Prisma.EvaluationUpdateInput = {
      score,
      maxScore,
      feedback: nullable(body.feedback),
      recommendations: nullable(body.recommendations),
      evaluatedAt: body.evaluatedAt ? new Date(String(body.evaluatedAt)) : current.evaluatedAt,
      rejectionReason: action === 'submit' ? null : current.rejectionReason,
    }

    if (MANAGEMENT_ROLES.has(auth.user.role)) {
      const title = String(body.title || current.title).trim()
      const target = await resolveTarget(body, auth.user)
      const evaluatorUser = await resolveEvaluator(body, auth.user)
      Object.assign(commonData, {
        title,
        evaluator: evaluatorUser.fullName,
        evaluatorRole: nullable(body.evaluatorRole) || current.evaluatorRole,
        evaluatorUser: { connect: { id: evaluatorUser.id } },
        platform: { connect: { id: target.platformId } },
        program: target.programId ? { connect: { id: target.programId } } : { disconnect: true },
        activity: target.activityId ? { connect: { id: target.activityId } } : { disconnect: true },
        project: target.projectId ? { connect: { id: target.projectId } } : { disconnect: true },
        type: target.type,
      })
    }
    if (action === 'submit') {
      if (score === null || !nullable(body.feedback)) {
        return NextResponse.json({ success: false, message: 'الدرجة والملاحظات مطلوبتان قبل الإرسال للمراجعة' }, { status: 400 })
      }
      commonData.status = EvaluationStatus.SUBMITTED
      commonData.submittedAt = new Date()
      commonData.approvedBy = { disconnect: true }
      commonData.approvedAt = null
    } else if (current.status === EvaluationStatus.REJECTED) {
      commonData.status = EvaluationStatus.DRAFT
      commonData.approvedBy = { disconnect: true }
      commonData.approvedAt = null
    }

    const evaluation = await prisma.evaluation.update({ where: { id }, data: commonData, include: evaluationInclude })
    await recordActivityLog({
      entity: 'evaluation',
      entityId: evaluation.id,
      action: action === 'submit' ? 'STATUS_SUBMITTED' : 'UPDATE',
      actor: auth.user.email || auth.user.name,
      changes: { score, status: evaluation.status },
    })
    return NextResponse.json({ success: true, data: evaluation })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطأ في الخادم'
    logger.error('Evaluations PUT error', error)
    return NextResponse.json({ success: false, message }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireEvaluationsAccess()
  if (!auth.ok) return auth.error
  if (!MANAGEMENT_ROLES.has(auth.user.role)) {
    return NextResponse.json({ success: false, message: 'حذف التقييمات من صلاحيات إدارة النظام فقط' }, { status: 403 })
  }

  try {
    const id = new URL(request.url).searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })
    const evaluation = await prisma.evaluation.findUnique({ where: { id }, select: { status: true, title: true } })
    if (!evaluation) return NextResponse.json({ success: false, message: 'التقييم غير موجود' }, { status: 404 })
    if (!canDeleteEvaluation(auth.user.role, evaluation.status)) {
      return NextResponse.json({ success: false, message: 'لا يمكن حذف تقييم مرسل أو معتمد' }, { status: 409 })
    }
    await prisma.evaluation.delete({ where: { id } })
    await recordActivityLog({
      entity: 'evaluation',
      entityId: id,
      action: 'DELETE',
      actor: auth.user.email || auth.user.name,
      metadata: { title: evaluation.title },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Evaluations DELETE error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}
