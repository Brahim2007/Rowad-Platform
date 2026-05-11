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

function nullable(value?: string | null) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function evaluationData(body: Record<string, unknown>) {
  const title = String(body.title || '').trim()
  const evaluator = String(body.evaluator || '').trim()
  if (!title || !evaluator) throw new Error('عنوان التقييم واسم المقيم مطلوبان')

  return {
    title,
    evaluator,
    evaluatorRole: nullable(body.evaluatorRole as string | undefined),
    type: String(body.type || 'PROGRAM') as any,
    score: body.score === undefined || body.score === null || body.score === '' ? null : Number(body.score),
    maxScore: body.maxScore === undefined || body.maxScore === null || body.maxScore === '' ? 100 : Number(body.maxScore),
    feedback: nullable(body.feedback as string | undefined),
    recommendations: nullable(body.recommendations as string | undefined),
    status: String(body.status || 'DRAFT') as any,
    evaluatedAt: body.evaluatedAt ? new Date(String(body.evaluatedAt)) : new Date(),
    platformId: nullable(body.platformId as string | undefined),
    programId: nullable(body.programId as string | undefined),
    activityId: nullable(body.activityId as string | undefined),
    projectId: nullable(body.projectId as string | undefined),
  }
}

export async function GET(request: NextRequest) {
  const authError = await checkAuth()
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || ''
    const status = searchParams.get('status') || ''

    const evaluations = await prisma.evaluation.findMany({
      where: {
        ...(type && { type: type as any }),
        ...(status && { status: status as any }),
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
    console.error('Evaluations GET error:', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authError = await checkAuth()
  if (authError) return authError

  try {
    const body = await request.json()
    const evaluation = await prisma.evaluation.create({ data: evaluationData(body) })

    const session = await auth()
    await recordActivityLog({
      entity: 'evaluation',
      entityId: evaluation.id,
      action: 'CREATE',
      actor: session?.user?.email || session?.user?.name,
      changes: evaluation,
    })

    return NextResponse.json({ success: true, data: evaluation }, { status: 201 })
  } catch (error: unknown) {
    const e = error as { message?: string }
    console.error('Evaluations POST error:', error)
    return NextResponse.json({ success: false, message: e.message || 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const authError = await checkAuth()
  if (authError) return authError

  try {
    const body = await request.json()
    const id = String(body.id || '')
    if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })

    const evaluation = await prisma.evaluation.update({
      where: { id },
      data: evaluationData(body),
    })

    const session = await auth()
    await recordActivityLog({
      entity: 'evaluation',
      entityId: evaluation.id,
      action: 'UPDATE',
      actor: session?.user?.email || session?.user?.name,
      changes: body,
    })

    return NextResponse.json({ success: true, data: evaluation })
  } catch (error: unknown) {
    const e = error as { message?: string }
    console.error('Evaluations PUT error:', error)
    return NextResponse.json({ success: false, message: e.message || 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const authError = await checkAuth()
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })

    await prisma.evaluation.delete({ where: { id } })

    const session = await auth()
    await recordActivityLog({
      entity: 'evaluation',
      entityId: id,
      action: 'DELETE',
      actor: session?.user?.email || session?.user?.name,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Evaluations DELETE error:', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}
