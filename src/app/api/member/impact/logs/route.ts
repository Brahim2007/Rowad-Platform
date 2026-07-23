import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireActiveMember } from '@/lib/member-auth'
import { notifyNewSubmission } from '@/lib/notifications'
import { recordActivityLog } from '@/lib/activity-log'
import { logger } from '@/lib/logger'
import { sendActivitySubmittedEmail } from '@/lib/email'
import { normalizeEvidenceUrl } from '@/lib/evidence-url'

function optionalText(value: unknown, maxLength: number): string | null {
  const text = String(value || '').trim()
  return text ? text.slice(0, maxLength) : null
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireActiveMember(request)
    if (!auth.ok) return auth.error

    const body = await request.json()
    const actionId = String(body.actionId || '').trim()
    const count = Number(body.count)
    const date = body.date ? new Date(String(body.date)) : new Date()
    const link = normalizeEvidenceUrl(body.link)

    if (!actionId) {
      return NextResponse.json({ success: false, message: 'نوع النشاط مطلوب' }, { status: 400 })
    }
    if (!Number.isFinite(count) || count <= 0 || count > 10_000) {
      return NextResponse.json({ success: false, message: 'العدد يجب أن يكون أكبر من صفر' }, { status: 400 })
    }
    if (Number.isNaN(date.getTime())) {
      return NextResponse.json({ success: false, message: 'تاريخ النشاط غير صالح' }, { status: 400 })
    }
    if (link === undefined) {
      return NextResponse.json({ success: false, message: 'رابط الدليل يجب أن يبدأ بـ http أو https' }, { status: 400 })
    }

    const action = await prisma.impactAction.findFirst({
      where: { id: actionId, isActive: true },
      select: { id: true, name: true },
    })
    if (!action) {
      return NextResponse.json({ success: false, message: 'نوع النشاط غير متاح' }, { status: 400 })
    }

    const memberName = `${auth.member.firstName} ${auth.member.lastName}`.trim()
    const log = await prisma.impactLog.create({
      data: {
        beneficiaryId: auth.member.id,
        actionId: action.id,
        sourceType: 'MANUAL',
        count,
        quality: 'ACCEPTABLE',
        status: 'PENDING_REVIEW',
        date,
        link,
        note: optionalText(body.note, 4_000),
        pointsSnapshot: null,
        createdBy: auth.member.email || memberName || 'عضو',
        platformId: auth.member.platformId,
      },
      include: {
        action: { select: { id: true, name: true, category: true, points: true } },
      },
    })

    try {
      await recordActivityLog({
        entity: 'impactLog',
        entityId: log.id,
        action: 'MEMBER_SUBMISSION',
        actor: auth.member.email || memberName || auth.member.id,
        changes: {
          actionId: action.id,
          count,
          date: date.toISOString(),
          platformId: auth.member.platformId,
        },
      })
    } catch (error) {
      logger.error('Member submission audit log error', error)
    }

    if (auth.member.platformId) {
      try {
        await notifyNewSubmission({
          beneficiaryId: auth.member.id,
          beneficiaryName: memberName || 'عضو',
          activityName: action.name,
          platformId: auth.member.platformId,
        })
      } catch (error) {
        logger.error('Member submission notification error', error)
      }
    }

    if (auth.member.email) {
      try {
        await sendActivitySubmittedEmail({
          to: auth.member.email,
          memberName: memberName || 'عضو',
          activityName: action.name,
          evidenceUrl: link,
          platformId: auth.member.platformId,
        })
      } catch (error) {
        logger.error('Member submission confirmation email error', error)
      }
    }

    return NextResponse.json({ success: true, data: log }, { status: 201 })
  } catch (error) {
    logger.error('Member impact logs POST error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الحفظ' }, { status: 500 })
  }
}
