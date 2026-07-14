import { NextRequest, NextResponse } from 'next/server'
import { EvaluationStatus, EvaluationType } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { recordActivityLog } from '@/lib/activity-log'
import { getPlatformScope, platformWhere, requireAuth, verifyPlatformOwnership, type SessionUser } from '@/lib/auth-helpers'
import { logger } from '@/lib/logger'

async function requireEvaluationsAccess() {
  const auth = await requireAuth()
  if (!auth.ok) return auth
  if (auth.user.role === 'EDITOR') {
    return {
      ok: false as const,
      error: NextResponse.json({ success: false, message: 'غير مصرح — الصلاحية محدودة' }, { status: 403 }),
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

function nullable(value?: string | null) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function parseEvaluationType(value: unknown) {
  const type = String(value || EvaluationType.PROGRAM)
  return Object.values(EvaluationType).includes(type as EvaluationType) ? type as EvaluationType : EvaluationType.PROGRAM
}

function parseEvaluationStatus(value: unknown) {
  const status = String(value || EvaluationStatus.DRAFT)
  return Object.values(EvaluationStatus).includes(status as EvaluationStatus) ? status as EvaluationStatus : EvaluationStatus.DRAFT
}

function evaluationData(body: Record<string, unknown>, user: SessionUser) {
  const title = String(body.title || '').trim()
  const evaluator = String(body.evaluator || '').trim()
  if (!title || !evaluator) throw new Error('عنوان التقييم واسم المقيم مطلوبان')

  return {
    title,
    evaluator,
    evaluatorRole: nullable(body.evaluatorRole as string | undefined),
    type: parseEvaluationType(body.type),
    score: body.score === undefined || body.score === null || body.score === '' ? null : Number(body.score),
    maxScore: body.maxScore === undefined || body.maxScore === null || body.maxScore === '' ? 100 : Number(body.maxScore),
    feedback: nullable(body.feedback as string | undefined),
    recommendations: nullable(body.recommendations as string | undefined),
    status: parseEvaluationStatus(body.status),
    evaluatedAt: body.evaluatedAt ? new Date(String(body.evaluatedAt)) : new Date(),
    platformId: user.role === 'PLATFORM_MANAGER' ? user.platformId : nullable(body.platformId as string | undefined),
    programId: nullable(body.programId as string | undefined),
    activityId: nullable(body.activityId as string | undefined),
    projectId: nullable(body.projectId as string | undefined),
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireEvaluationsAccess()
  if (!auth.ok) return auth.error

  try {
    const scope = getPlatformScope(auth.user)
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || ''
    const status = searchParams.get('status') || ''

    const evaluations = await prisma.evaluation.findMany({
      where: {
        ...platformWhere(scope),
        ...(type && { type: parseEvaluationType(type) }),
        ...(status && { status: parseEvaluationStatus(status) }),
      },
      orderBy: { evaluatedAt: 'desc' },
      include: {
        platform: { select: { id: true, name: true, slug: true } },
        program: { select: { id: true, name: true, slug: true } },
        activity: { select: { id: true, name: true, slug: true } },
        project: { select: { id: true, title: true, slug: true } },
      },
    })

    return NextResponse.json({ success: true, data: evaluations })
  } catch (error) {
    logger.error('Evaluations GET error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireEvaluationsAccess()
  if (!auth.ok) return auth.error

  try {
    const body = await request.json()
    const evaluation = await prisma.evaluation.create({ data: evaluationData(body, auth.user) })

    await recordActivityLog({
      entity: 'evaluation',
      entityId: evaluation.id,
      action: 'CREATE',
      actor: auth.user.email || auth.user.name,
      changes: evaluation,
    })

    return NextResponse.json({ success: true, data: evaluation }, { status: 201 })
  } catch (error: unknown) {
    const e = error as { message?: string }
    logger.error('Evaluations POST error', error)
    return NextResponse.json({ success: false, message: e.message || 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireEvaluationsAccess()
  if (!auth.ok) return auth.error

  try {
    const body = await request.json()
    const id = String(body.id || '')
    if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })
    const current = await prisma.evaluation.findUnique({ where: { id }, select: { platformId: true } })
    if (!current) return NextResponse.json({ success: false, message: 'التقييم غير موجود' }, { status: 404 })
    if (!(await verifyPlatformOwnership(auth.user, current.platformId))) {
      return NextResponse.json({ success: false, message: 'غير مصرح — خارج نطاق المنصة' }, { status: 403 })
    }

    const evaluation = await prisma.evaluation.update({
      where: { id },
      data: evaluationData(body, auth.user),
    })

    await recordActivityLog({
      entity: 'evaluation',
      entityId: evaluation.id,
      action: 'UPDATE',
      actor: auth.user.email || auth.user.name,
      changes: body,
    })

    return NextResponse.json({ success: true, data: evaluation })
  } catch (error: unknown) {
    const e = error as { message?: string }
    logger.error('Evaluations PUT error', error)
    return NextResponse.json({ success: false, message: e.message || 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireEvaluationsAccess()
  if (!auth.ok) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })
    const evaluation = await prisma.evaluation.findUnique({ where: { id }, select: { platformId: true } })
    if (!evaluation) return NextResponse.json({ success: false, message: 'التقييم غير موجود' }, { status: 404 })
    if (!(await verifyPlatformOwnership(auth.user, evaluation.platformId))) {
      return NextResponse.json({ success: false, message: 'غير مصرح — خارج نطاق المنصة' }, { status: 403 })
    }

    await prisma.evaluation.delete({ where: { id } })

    await recordActivityLog({
      entity: 'evaluation',
      entityId: id,
      action: 'DELETE',
      actor: auth.user.email || auth.user.name,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Evaluations DELETE error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}
