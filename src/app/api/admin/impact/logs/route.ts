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
import { sendActivityApprovedEmail, sendActivityRejectedEmail } from '@/lib/email'
import { createNotification, notifyNewSubmission, notifyActivityApproved, notifyActivityRejected } from '@/lib/notifications'

async function checkAuth() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })
  }
  return null
}

function getRole() {
  return auth().then(s => (s?.user as any)?.role || 'EDITOR')
}

async function rejectIfEditor(action: string) {
  const role = await getRole()
  if (role === 'EDITOR') {
    return NextResponse.json({ success: false, message: 'غير مصرح — الصلاحية محدودة' }, { status: 403 })
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
    const page = Math.max(1, Number(searchParams.get('page')) || 1)
    const pageSizeParam = Number(searchParams.get('pageSize') || searchParams.get('limit')) || 50
    const pageSize = Math.min(Math.max(1, pageSizeParam), 50)
    const skip = (page - 1) * pageSize

    const where = {
      ...(beneficiaryId && { beneficiaryId }),
      ...(status && { status: status as any }),
      ...(category && { action: { category: category as any } }),
    }

    const [logs, total] = await Promise.all([
      prisma.impactLog.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: pageSize,
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
              id: true, firstName: true, lastName: true, code: true, networkRole: true,
            },
          },
        },
      }),
      prisma.impactLog.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: logs,
      pagination: { page, pageSize, limit: pageSize, total, totalPages: Math.ceil(total / pageSize) },
    })
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

    const status = String(body.status || 'PENDING_REVIEW')
    const session = await auth()
    const actor = session?.user?.email || session?.user?.name || null

    // التحقق من وجود سبب الرفض عند الرفض
    if (status === 'REJECTED' && !body.rejectionReason?.trim()) {
      return NextResponse.json({
        success: false,
        message: 'سبب الرفض مطلوب عند رفض النشاط',
      }, { status: 400 })
    }

    const log = await prisma.impactLog.create({
      data: {
        beneficiaryId,
        actionId,
        sourceType: String(body.sourceType || 'MANUAL') as any,
        sourceId: body.sourceId ? String(body.sourceId).trim() : null,
        count: Number(body.count) || 1,
        quality: String(body.quality || 'ACCEPTABLE') as any,
        status: status as any,
        date: body.date ? new Date(String(body.date)) : new Date(),
        link: body.link?.trim() || null,
        note: body.note?.trim() || null,
        pointsSnapshot: body.pointsSnapshot === undefined || body.pointsSnapshot === null || body.pointsSnapshot === ''
          ? null
          : Number(body.pointsSnapshot),
        createdBy: body.createdBy?.trim() || actor,
        approvedBy: status === 'APPROVED' ? (body.approvedBy?.trim() || actor) : null,
        approvedAt: status === 'APPROVED' ? new Date() : null,
        rejectionReason: status === 'REJECTED' ? (body.rejectionReason?.trim() || null) : null,
        platformId: body.platformId || null,
        programId: body.programId || null,
        activityId: body.activityId || null,
        enrollmentId: body.enrollmentId || null,
        participationId: body.participationId || null,
        reportId: body.reportId || null,
        evaluationId: body.evaluationId || null,
      },
      include: { action: true, beneficiary: { select: { firstName: true, lastName: true, email: true } } },
    })

    await recordActivityLog({
      entity: 'impactLog',
      entityId: log.id,
      action: 'CREATE',
      actor: session?.user?.email || session?.user?.name,
      changes: body,
    })

    // إشعار داخلي للمشرفين عند إنشاء نشاط جديد
    try {
      const beneficiary = log.beneficiary as any
      if (log.platformId && beneficiary) {
        await notifyNewSubmission({
          beneficiaryId: log.beneficiaryId,
          beneficiaryName: beneficiary.firstName ? `${beneficiary.firstName} ${beneficiary.lastName}` : 'عضو',
          activityName: log.action?.name || 'نشاط جديد',
          platformId: log.platformId,
        })
      }
    } catch { /* silent */ }

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

    const previous = await prisma.impactLog.findUnique({ where: { id }, select: { status: true } })
    const newStatus = body.status || undefined

    // EDITOR لا يمكنه الاعتماد أو الرفض
    if (newStatus && (newStatus === 'APPROVED' || newStatus === 'REJECTED')) {
      const session = await auth()
      const role = (session?.user as any)?.role || 'EDITOR'
      if (role === 'EDITOR') {
        return NextResponse.json({ success: false, message: 'غير مصرح — لا يمكن للمحرر الاعتماد أو الرفض' }, { status: 403 })
      }
    }

    // التحقق من سبب الرفض عند تغيير الحالة إلى مرفوض
    if (newStatus === 'REJECTED' && !body.rejectionReason?.trim() && previous?.status !== 'REJECTED') {
      return NextResponse.json({
        success: false,
        message: 'سبب الرفض مطلوب عند رفض النشاط',
      }, { status: 400 })
    }

    const session = await auth()
    const actor = session?.user?.email || session?.user?.name || null

    // منطق الاعتماد: إذا تغيّرت الحالة إلى APPROVED، سجّل المعتمد والوقت
    const approvedByField = newStatus === 'APPROVED' && previous?.status !== 'APPROVED'
      ? (body.approvedBy?.trim() || actor)
      : undefined
    const approvedAtField = newStatus === 'APPROVED' && previous?.status !== 'APPROVED'
      ? new Date()
      : undefined

    // إذا تغيّرت الحالة من APPROVED أو REJECTED إلى PENDING_REVIEW، امسح حقول الاعتماد/الرفض
    const isResetting = newStatus === 'PENDING_REVIEW' && previous?.status !== 'PENDING_REVIEW'

    const log = await prisma.impactLog.update({
      where: { id },
      data: {
        actionId: body.actionId || undefined,
        sourceType: body.sourceType || undefined,
        sourceId: body.sourceId !== undefined ? (body.sourceId ? String(body.sourceId).trim() : null) : undefined,
        count: body.count !== undefined ? Number(body.count) : undefined,
        quality: body.quality || undefined,
        status: newStatus as any,
        date: body.date ? new Date(String(body.date)) : undefined,
        link: body.link?.trim() ?? undefined,
        note: body.note?.trim() ?? undefined,
        pointsSnapshot: body.pointsSnapshot !== undefined
          ? (body.pointsSnapshot === null || body.pointsSnapshot === '' ? null : Number(body.pointsSnapshot))
          : undefined,
        approvedBy: isResetting ? null : (approvedByField ?? undefined),
        approvedAt: isResetting ? null : (approvedAtField ?? undefined),
        rejectionReason: newStatus === 'REJECTED'
          ? (body.rejectionReason?.trim() || null)
          : (isResetting || newStatus === 'APPROVED' ? null : undefined),
        platformId: body.platformId !== undefined ? body.platformId || null : undefined,
        programId: body.programId !== undefined ? body.programId || null : undefined,
        activityId: body.activityId !== undefined ? body.activityId || null : undefined,
        enrollmentId: body.enrollmentId !== undefined ? body.enrollmentId || null : undefined,
        participationId: body.participationId !== undefined ? body.participationId || null : undefined,
        reportId: body.reportId !== undefined ? body.reportId || null : undefined,
        evaluationId: body.evaluationId !== undefined ? body.evaluationId || null : undefined,
      },
      include: { action: true, beneficiary: { select: { firstName: true, lastName: true, email: true } } },
    })

    await recordActivityLog({
      entity: 'impactLog',
      entityId: log.id,
      action: 'UPDATE',
      actor: actor,
      changes: body,
    })

    // إرسال بريد إلكتروني عند الاعتماد أو الرفض
    try {
      const beneficiary = log.beneficiary
      if ((beneficiary as any)?.email) {
        const memberName = `${beneficiary.firstName} ${beneficiary.lastName}`.trim()
        const activityName = log.action?.name || 'نشاط'

        if (log.status === 'APPROVED') {
          await sendActivityApprovedEmail({
            to: (beneficiary as any).email!,
            memberName,
            activityName,
            points: log.pointsSnapshot ?? 0,
            note: log.note ?? undefined,
          })
        } else if (log.status === 'REJECTED') {
          await sendActivityRejectedEmail({
            to: (beneficiary as any).email!,
            memberName,
            activityName,
            reason: log.rejectionReason || 'لم يذكر سبب',
          })
        }
      }
    } catch (e) {
      console.error('[email] failed to send approval/rejection email:', e)
    }

    // إشعار داخلي للعضو عند الاعتماد أو الرفض
    try {
      const beneficiary = log.beneficiary
      const memberName = `${beneficiary.firstName} ${beneficiary.lastName}`.trim()
      const activityName = log.action?.name || 'نشاط'

      if (log.status === 'APPROVED') {
        await notifyActivityApproved({
          beneficiaryId: log.beneficiaryId,
          beneficiaryName: memberName,
          activityName,
          points: log.pointsSnapshot ?? 0,
        })
      } else if (log.status === 'REJECTED') {
        await notifyActivityRejected({
          beneficiaryId: log.beneficiaryId,
          beneficiaryName: memberName,
          activityName,
          reason: log.rejectionReason || 'لم يذكر سبب',
        })
      }
    } catch { /* silent */ }

    return NextResponse.json({ success: true, data: log })
  } catch (error: any) {
    console.error('ImpactLogs PUT error:', error)
    return NextResponse.json({ success: false, message: error.message || 'خطأ في التحديث' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const authError = await checkAuth()
  if (authError) return authError

  const editorError = await rejectIfEditor('حذف')
  if (editorError) return editorError

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
