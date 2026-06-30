/**
 * API: سجل الأنشطة والمساهمات (Impact Log)
 * المسارات: GET  /api/admin/impact/logs — عرض السجل
 *           POST /api/admin/impact/logs — تسجيل نشاط جديد
 *           PUT  /api/admin/impact/logs — تعديل
 *           DELETE /api/admin/impact/logs?id=... — حذف
 */

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

export async function GET(request: NextRequest) {
  const authError = await checkAuth()
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const beneficiaryId = searchParams.get('beneficiaryId') || ''
    const status = searchParams.get('status') || ''
    const category = searchParams.get('category') || ''
    const limit = Math.min(Number(searchParams.get('limit')) || 500, 2000)

    const logs = await prisma.impactLog.findMany({
      where: {
        ...(beneficiaryId && { beneficiaryId }),
        ...(status && { status: status as any }),
        ...(category && { action: { category: category as any } }),
      },
      orderBy: { date: 'desc' },
      take: limit,
      include: {
        action: true,
        platform: { select: { id: true, name: true, slug: true } },
        program: { select: { id: true, name: true, slug: true } },
        activity: { select: { id: true, name: true, slug: true } },
        enrollment: { select: { id: true, status: true } },
        participation: { select: { id: true, status: true } },
        report: { select: { id: true, status: true } },
        evaluation: { select: { id: true, title: true, status: true } },
        beneficiary: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            code: true,
            networkRole: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, data: logs })
  } catch (error) {
    console.error('ImpactLogs GET error:', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authError = await checkAuth()
  if (authError) return authError

  try {
    const body = await request.json()
    const beneficiaryId = String(body.beneficiaryId || '').trim()
    const actionId = String(body.actionId || '').trim()

    if (!beneficiaryId || !actionId) {
      return NextResponse.json({ success: false, message: 'العضو ونوع النشاط مطلوبان' }, { status: 400 })
    }

    const log = await prisma.impactLog.create({
      data: {
        beneficiaryId,
        actionId,
        sourceType: String(body.sourceType || 'MANUAL') as any,
        sourceId: body.sourceId ? String(body.sourceId).trim() : null,
        count: Number(body.count) || 1,
        quality: String(body.quality || 'ACCEPTABLE') as any,
        status: String(body.status || 'PENDING_REVIEW') as any,
        date: body.date ? new Date(String(body.date)) : new Date(),
        link: body.link?.trim() || null,
        note: body.note?.trim() || null,
        pointsSnapshot: body.pointsSnapshot === undefined || body.pointsSnapshot === null || body.pointsSnapshot === ''
          ? null
          : Number(body.pointsSnapshot),
        createdBy: body.createdBy?.trim() || null,
        platformId: body.platformId || null,
        programId: body.programId || null,
        activityId: body.activityId || null,
        enrollmentId: body.enrollmentId || null,
        participationId: body.participationId || null,
        reportId: body.reportId || null,
        evaluationId: body.evaluationId || null,
      },
      include: { action: true, beneficiary: { select: { firstName: true, lastName: true } } },
    })

    const session = await auth()
    await recordActivityLog({
      entity: 'impactLog',
      entityId: log.id,
      action: 'CREATE',
      actor: session?.user?.email || session?.user?.name,
      changes: body,
    })

    return NextResponse.json({ success: true, data: log }, { status: 201 })
  } catch (error: any) {
    console.error('ImpactLogs POST error:', error)
    return NextResponse.json({ success: false, message: error.message || 'خطأ في الحفظ' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const authError = await checkAuth()
  if (authError) return authError

  try {
    const body = await request.json()
    const id = String(body.id || '')
    if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })

    const log = await prisma.impactLog.update({
      where: { id },
      data: {
        actionId: body.actionId || undefined,
        sourceType: body.sourceType || undefined,
        sourceId: body.sourceId !== undefined ? (body.sourceId ? String(body.sourceId).trim() : null) : undefined,
        count: body.count !== undefined ? Number(body.count) : undefined,
        quality: body.quality || undefined,
        status: body.status || undefined,
        date: body.date ? new Date(String(body.date)) : undefined,
        link: body.link?.trim() ?? undefined,
        note: body.note?.trim() ?? undefined,
        pointsSnapshot: body.pointsSnapshot !== undefined
          ? (body.pointsSnapshot === null || body.pointsSnapshot === '' ? null : Number(body.pointsSnapshot))
          : undefined,
        platformId: body.platformId !== undefined ? body.platformId || null : undefined,
        programId: body.programId !== undefined ? body.programId || null : undefined,
        activityId: body.activityId !== undefined ? body.activityId || null : undefined,
        enrollmentId: body.enrollmentId !== undefined ? body.enrollmentId || null : undefined,
        participationId: body.participationId !== undefined ? body.participationId || null : undefined,
        reportId: body.reportId !== undefined ? body.reportId || null : undefined,
        evaluationId: body.evaluationId !== undefined ? body.evaluationId || null : undefined,
      },
      include: { action: true, beneficiary: { select: { firstName: true, lastName: true } } },
    })

    const session = await auth()
    await recordActivityLog({
      entity: 'impactLog',
      entityId: log.id,
      action: 'UPDATE',
      actor: session?.user?.email || session?.user?.name,
      changes: body,
    })

    return NextResponse.json({ success: true, data: log })
  } catch (error: any) {
    console.error('ImpactLogs PUT error:', error)
    return NextResponse.json({ success: false, message: error.message || 'خطأ في التحديث' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const authError = await checkAuth()
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })

    await prisma.impactLog.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('ImpactLogs DELETE error:', error)
    return NextResponse.json({ success: false, message: 'خطأ في الحذف' }, { status: 500 })
  }
}
