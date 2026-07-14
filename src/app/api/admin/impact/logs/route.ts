/**
 * API: سجل الأنشطة والمساهمات (Impact Log)
 * المسارات: GET  /api/admin/impact/logs — عرض السجل
 *           POST /api/admin/impact/logs — تسجيل نشاط جديد
 *           PUT  /api/admin/impact/logs — تعديل
 *           DELETE /api/admin/impact/logs?id=... — حذف
 */

import { NextRequest, NextResponse } from 'next/server'
import { ImpactApprovalStatus, ImpactCategory, ImpactQuality, ImpactSourceType, Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { recordActivityLog } from '@/lib/activity-log'
import { sendActivityApprovedEmail, sendActivityRejectedEmail } from '@/lib/email'
import { notifyNewSubmission, notifyActivityApproved, notifyActivityRejected } from '@/lib/notifications'
import { getPlatformScope, platformWhere, requireAuth, verifyPlatformOwnership, type SessionUser } from '@/lib/auth-helpers'
import { logger } from '@/lib/logger'

async function requireImpactAccess() {
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

async function resolveScopedPlatformId(user: SessionUser, beneficiaryId: string, requestedPlatformId?: string | null) {
  const beneficiary = await prisma.beneficiary.findUnique({
    where: { id: beneficiaryId },
    select: { platformId: true },
  })
  if (!beneficiary) return { ok: false as const, error: NextResponse.json({ success: false, message: 'العضو غير موجود' }, { status: 404 }) }
  if (!(await verifyPlatformOwnership(user, beneficiary.platformId))) {
    return { ok: false as const, error: NextResponse.json({ success: false, message: 'غير مصرح — خارج نطاق المنصة' }, { status: 403 }) }
  }
  if (user.role === 'PLATFORM_MANAGER') {
    return { ok: true as const, platformId: user.platformId }
  }
  return { ok: true as const, platformId: requestedPlatformId || beneficiary.platformId || null }
}

function enumValue<T extends Record<string, string>>(enumObject: T, value: unknown): T[keyof T] | undefined {
  const text = String(value || '')
  return Object.values(enumObject).includes(text) ? text as T[keyof T] : undefined
}

function parseStatus(value: unknown, fallback = ImpactApprovalStatus.PENDING_REVIEW) {
  return enumValue(ImpactApprovalStatus, value) ?? fallback
}

function parseQuality(value: unknown) {
  return enumValue(ImpactQuality, value) ?? ImpactQuality.ACCEPTABLE
}

function parseSourceType(value: unknown) {
  return enumValue(ImpactSourceType, value) ?? ImpactSourceType.MANUAL
}

export async function GET(request: NextRequest) {
  const auth = await requireImpactAccess()
  if (!auth.ok) return auth.error

  try {
    const scope = getPlatformScope(auth.user)
    const { searchParams } = new URL(request.url)
    const beneficiaryId = searchParams.get('beneficiaryId') || ''
    const status = enumValue(ImpactApprovalStatus, searchParams.get('status'))
    const category = enumValue(ImpactCategory, searchParams.get('category'))
    const page = Math.max(1, Number(searchParams.get('page')) || 1)
    const pageSizeParam = Number(searchParams.get('pageSize') || searchParams.get('limit')) || 50
    const pageSize = Math.min(Math.max(1, pageSizeParam), 50)
    const includeTotal = searchParams.get('includeTotal') === '1'
    const compact = searchParams.get('compact') === '1'
    const skip = (page - 1) * pageSize

    const where: Prisma.ImpactLogWhereInput = {
      ...platformWhere(scope),
      ...(beneficiaryId && { beneficiaryId }),
      ...(status && { status }),
      ...(category && { action: { category } }),
    }

    if (compact) {
      const clauses = [
        scope.filterId ? Prisma.sql`l."platformId" = ${scope.filterId}` : null,
        beneficiaryId ? Prisma.sql`l."beneficiaryId" = ${beneficiaryId}` : null,
        status ? Prisma.sql`l.status = ${status}::"ImpactApprovalStatus"` : null,
        category ? Prisma.sql`a.category = ${category}::"ImpactCategory"` : null,
      ].filter(Boolean) as Prisma.Sql[]
      const whereSql = clauses.length ? Prisma.sql`WHERE ${Prisma.join(clauses, ' AND ')}` : Prisma.empty
      const rows = await prisma.$queryRaw<Array<{
        id: string
        beneficiaryId: string
        actionId: string
        count: number
        quality: ImpactQuality
        status: ImpactApprovalStatus
        date: Date
        link: string | null
        note: string | null
        createdBy: string | null
        platformId: string | null
        rejectionReason: string | null
        sourceType: ImpactSourceType
        action_id: string | null
        action_name: string | null
        action_points: number | null
        action_category: ImpactCategory | null
        action_note: string | null
        action_isActive: boolean | null
        action_sortOrder: number | null
        beneficiary_id: string | null
        beneficiary_firstName: string | null
        beneficiary_lastName: string | null
        beneficiary_code: string | null
        beneficiary_networkRole: string | null
      }>>(Prisma.sql`
        SELECT
          l.id,
          l."beneficiaryId",
          l."actionId",
          l.count,
          l.quality,
          l.status,
          l.date,
          l.link,
          l.note,
          l."createdBy",
          l."platformId",
          l."rejectionReason",
          l."sourceType",
          a.id AS "action_id",
          a.name AS "action_name",
          a.points AS "action_points",
          a.category AS "action_category",
          a.note AS "action_note",
          a."isActive" AS "action_isActive",
          a."sortOrder" AS "action_sortOrder",
          b.id AS "beneficiary_id",
          b."firstName" AS "beneficiary_firstName",
          b."lastName" AS "beneficiary_lastName",
          b.code AS "beneficiary_code",
          b."networkRole" AS "beneficiary_networkRole"
        FROM "impact_logs" l
        LEFT JOIN "impact_actions" a ON a.id = l."actionId"
        LEFT JOIN "beneficiaries" b ON b.id = l."beneficiaryId"
        ${whereSql}
        ORDER BY l.date DESC
        LIMIT ${pageSize + 1}
        OFFSET ${skip}
      `)
      const hasMore = rows.length > pageSize
      const logs = (hasMore ? rows.slice(0, pageSize) : rows).map(row => ({
        id: row.id,
        beneficiaryId: row.beneficiaryId,
        actionId: row.actionId,
        count: row.count,
        quality: row.quality,
        status: row.status,
        date: row.date,
        link: row.link,
        note: row.note,
        createdBy: row.createdBy,
        platformId: row.platformId,
        rejectionReason: row.rejectionReason,
        sourceType: row.sourceType,
        action: row.action_id ? {
          id: row.action_id,
          name: row.action_name,
          points: row.action_points,
          category: row.action_category,
          note: row.action_note,
          isActive: row.action_isActive,
          sortOrder: row.action_sortOrder,
        } : null,
        beneficiary: row.beneficiary_id ? {
          id: row.beneficiary_id,
          firstName: row.beneficiary_firstName,
          lastName: row.beneficiary_lastName,
          code: row.beneficiary_code,
          networkRole: row.beneficiary_networkRole,
        } : null,
      }))
      const total = includeTotal ? await prisma.impactLog.count({ where }) : null

      return NextResponse.json({
        success: true,
        data: logs,
        pagination: {
          page,
          pageSize,
          limit: pageSize,
          hasMore,
          total,
          totalPages: total === null ? null : Math.ceil(total / pageSize),
        },
      })
    }

    const relationArgs: Prisma.ImpactLogFindManyArgs = {
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
    }

    const rows = await prisma.impactLog.findMany({
      where,
      orderBy: { date: 'desc' },
      skip,
      take: pageSize + 1,
      ...relationArgs,
    })

    const hasMore = rows.length > pageSize
    const logs = hasMore ? rows.slice(0, pageSize) : rows
    const total = includeTotal ? await prisma.impactLog.count({ where }) : null

    return NextResponse.json({
      success: true,
      data: logs,
      pagination: {
        page,
        pageSize,
        limit: pageSize,
        hasMore,
        total,
        totalPages: total === null ? null : Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    logger.error('ImpactLogs GET error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireImpactAccess()
  if (!auth.ok) return auth.error

  try {
    const body = await request.json()
    const beneficiaryId = String(body.beneficiaryId || '').trim()
    const actionId = String(body.actionId || '').trim()

    if (!beneficiaryId || !actionId) {
      return NextResponse.json({ success: false, message: 'العضو ونوع النشاط مطلوبان' }, { status: 400 })
    }

    const status = parseStatus(body.status)
    const actor = auth.user.email || auth.user.name || null
    const scopedPlatform = await resolveScopedPlatformId(auth.user, beneficiaryId, body.platformId || null)
    if (!scopedPlatform.ok) return scopedPlatform.error

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
        sourceType: parseSourceType(body.sourceType),
        sourceId: body.sourceId ? String(body.sourceId).trim() : null,
        count: Number(body.count) || 1,
        quality: parseQuality(body.quality),
        status,
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
        platformId: scopedPlatform.platformId,
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
      actor,
      changes: body,
    })

    // إشعار داخلي للمشرفين عند إنشاء نشاط جديد
    try {
      const beneficiary = log.beneficiary
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
  } catch (error: unknown) {
    logger.error('ImpactLogs POST error', error)
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'خطأ في الحفظ' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireImpactAccess()
  if (!auth.ok) return auth.error

  try {
    const body = await request.json()
    const id = String(body.id || '')
    if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })

    const previous = await prisma.impactLog.findUnique({ where: { id }, select: { status: true, platformId: true, beneficiaryId: true } })
    if (!previous) return NextResponse.json({ success: false, message: 'السجل غير موجود' }, { status: 404 })
    if (!(await verifyPlatformOwnership(auth.user, previous.platformId))) {
      return NextResponse.json({ success: false, message: 'غير مصرح — خارج نطاق المنصة' }, { status: 403 })
    }
    const newStatus = enumValue(ImpactApprovalStatus, body.status)

    // EDITOR لا يمكنه الاعتماد أو الرفض
    if (newStatus && (newStatus === 'APPROVED' || newStatus === 'REJECTED')) {
      // requireImpactAccess منع EDITOR مسبقاً. نُبقي هذا الحاجز لتوضيح السياسة.
    }

    // التحقق من سبب الرفض عند تغيير الحالة إلى مرفوض
    if (newStatus === 'REJECTED' && !body.rejectionReason?.trim() && previous?.status !== 'REJECTED') {
      return NextResponse.json({
        success: false,
        message: 'سبب الرفض مطلوب عند رفض النشاط',
      }, { status: 400 })
    }

    const actor = auth.user.email || auth.user.name || null
    const targetBeneficiaryId = body.beneficiaryId ? String(body.beneficiaryId).trim() : previous.beneficiaryId
    const scopedPlatform = await resolveScopedPlatformId(auth.user, targetBeneficiaryId, body.platformId !== undefined ? body.platformId || null : previous.platformId)
    if (!scopedPlatform.ok) return scopedPlatform.error

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
        beneficiaryId: body.beneficiaryId ? String(body.beneficiaryId).trim() : undefined,
        sourceType: body.sourceType !== undefined ? parseSourceType(body.sourceType) : undefined,
        sourceId: body.sourceId !== undefined ? (body.sourceId ? String(body.sourceId).trim() : null) : undefined,
        count: body.count !== undefined ? Number(body.count) : undefined,
        quality: body.quality !== undefined ? parseQuality(body.quality) : undefined,
        status: newStatus,
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
        platformId: body.platformId !== undefined || auth.user.role === 'PLATFORM_MANAGER' ? scopedPlatform.platformId : undefined,
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
      if (beneficiary.email) {
        const memberName = `${beneficiary.firstName} ${beneficiary.lastName}`.trim()
        const activityName = log.action?.name || 'نشاط'

        if (log.status === 'APPROVED') {
          await sendActivityApprovedEmail({
            to: beneficiary.email,
            memberName,
            activityName,
            points: log.pointsSnapshot ?? 0,
            note: log.note ?? undefined,
          })
        } else if (log.status === 'REJECTED') {
          await sendActivityRejectedEmail({
            to: beneficiary.email,
            memberName,
            activityName,
            reason: log.rejectionReason || 'لم يذكر سبب',
          })
        }
      }
    } catch (e) {
      logger.error('[email] failed to send approval/rejection email', e)
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
  } catch (error: unknown) {
    logger.error('ImpactLogs PUT error', error)
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'خطأ في التحديث' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireImpactAccess()
  if (!auth.ok) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })

    const log = await prisma.impactLog.findUnique({ where: { id }, select: { platformId: true } })
    if (!log) return NextResponse.json({ success: false, message: 'السجل غير موجود' }, { status: 404 })
    if (!(await verifyPlatformOwnership(auth.user, log.platformId))) {
      return NextResponse.json({ success: false, message: 'غير مصرح — خارج نطاق المنصة' }, { status: 403 })
    }

    await prisma.impactLog.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('ImpactLogs DELETE error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الحذف' }, { status: 500 })
  }
}
