/**
 * API الرسائل الجماعية
 * POST /api/admin/broadcasts — إرسال رسالة جديدة
 * GET  /api/admin/broadcasts — سجل الرسائل
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'
import { requireAuth, verifyPlatformOwnership } from '@/lib/auth-helpers'
import { logger } from '@/lib/logger'

type RecipientType = 'ADMIN' | 'PLATFORM_MANAGER' | 'MEMBER'

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error
  const user = auth.user
  if (user.role !== 'SUPER_ADMIN' && user.role !== 'PLATFORM_MANAGER') {
    return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 403 })
  }
  if (user.role === 'PLATFORM_MANAGER' && !user.platformId) {
    return NextResponse.json({ success: false, message: 'مدير المنصة غير مرتبط بمنصة' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { subject, body: msgBody, targetRole, targetMemberId, channel } = body
    const targetType = user.role === 'PLATFORM_MANAGER' && body.targetType === 'ALL' ? 'PLATFORM' : body.targetType
    const targetPlatformId = user.role === 'PLATFORM_MANAGER' ? user.platformId : body.targetPlatformId

    if (!subject?.trim() || !msgBody?.trim()) {
      return NextResponse.json({ success: false, message: 'الموضوع والمحتوى مطلوبان' }, { status: 400 })
    }

    // تحديد مستقبلي الإشعارات
    const recipients: Array<{ id: string; type: RecipientType; name: string }> = []

    if (targetType === 'ALL') {
      if (user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ success: false, message: 'الإرسال لكل الشبكة متاح للإدارة العليا فقط' }, { status: 403 })
      }
      const members = await prisma.beneficiary.findMany({ where: { status: 'ACTIVE' }, select: { id: true, firstName: true, lastName: true } })
      members.forEach((m) => recipients.push({ id: m.id, type: 'MEMBER', name: `${m.firstName} ${m.lastName}` }))
      const admins = await prisma.adminUser.findMany({ where: { isActive: true }, select: { id: true, fullName: true, role: true } })
      admins.forEach((a) => recipients.push({ id: a.id, type: a.role === 'PLATFORM_MANAGER' ? 'PLATFORM_MANAGER' : 'ADMIN', name: a.fullName }))
    } else if (targetType === 'PLATFORM' && targetPlatformId) {
      if (!(await verifyPlatformOwnership(user, targetPlatformId))) {
        return NextResponse.json({ success: false, message: 'غير مصرح — خارج نطاق المنصة' }, { status: 403 })
      }
      const members = await prisma.beneficiary.findMany({ where: { platformId: targetPlatformId, status: 'ACTIVE' }, select: { id: true, firstName: true, lastName: true } })
      members.forEach((m) => recipients.push({ id: m.id, type: 'MEMBER', name: `${m.firstName} ${m.lastName}` }))
      const managers = await prisma.adminUser.findMany({ where: { platformId: targetPlatformId, isActive: true }, select: { id: true, fullName: true, role: true } })
      managers.forEach((a) => recipients.push({ id: a.id, type: 'PLATFORM_MANAGER', name: a.fullName }))
    } else if (targetType === 'ROLE' && targetRole) {
      const members = await prisma.beneficiary.findMany({
        where: {
          networkRole: targetRole,
          status: 'ACTIVE',
          ...(user.role === 'PLATFORM_MANAGER' ? { platformId: user.platformId } : {}),
        },
        select: { id: true, firstName: true, lastName: true },
      })
      members.forEach((m) => recipients.push({ id: m.id, type: 'MEMBER', name: `${m.firstName} ${m.lastName}` }))
    } else if (targetType === 'INDIVIDUAL' && targetMemberId) {
      const member = await prisma.beneficiary.findUnique({ where: { id: targetMemberId }, select: { id: true, firstName: true, lastName: true, platformId: true } })
      if (member && !(await verifyPlatformOwnership(user, member.platformId))) {
        return NextResponse.json({ success: false, message: 'غير مصرح — خارج نطاق المنصة' }, { status: 403 })
      }
      if (member) recipients.push({ id: member.id, type: 'MEMBER', name: `${member.firstName} ${member.lastName}` })
    } else {
      return NextResponse.json({ success: false, message: 'نوع الهدف غير صحيح أو البيانات ناقصة' }, { status: 400 })
    }

    // حفظ الرسالة
    const broadcast = await prisma.broadcast.create({
      data: {
        senderId: user.id,
        senderName: user.name || user.email,
        targetType, targetPlatformId, targetRole, targetMemberId,
        subject: subject.trim(),
        body: msgBody.trim(),
        channel: channel || 'IN_APP',
        status: 'SENT',
        sentAt: new Date(),
      },
    })

    // إرسال إشعارات داخلية
    for (const r of recipients.slice(0, 500)) { // حد أقصى للسلامة
      await createNotification({
        recipientId: r.id,
        recipientType: r.type,
        type: 'BROADCAST',
        title: subject.trim(),
        body: msgBody.trim(),
        senderId: user.id,
        senderName: user.name || user.email,
      })
    }

    return NextResponse.json({ success: true, data: { broadcast, recipientsCount: recipients.length } }, { status: 201 })
  } catch (error) {
    logger.error('Broadcast POST error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function GET(_request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error

  try {
    const user = auth.user
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN' && user.role !== 'PLATFORM_MANAGER') {
      return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 403 })
    }
    if (user.role === 'PLATFORM_MANAGER' && !user.platformId) {
      return NextResponse.json({ success: false, message: 'مدير المنصة غير مرتبط بمنصة' }, { status: 403 })
    }
    const broadcasts = await prisma.broadcast.findMany({
      where: user.role === 'PLATFORM_MANAGER'
        ? {
            OR: [
              { targetPlatformId: user.platformId },
              { senderId: user.id },
            ],
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({
      success: true,
      data: broadcasts.map((b: any) => ({
        id: b.id, subject: b.subject, targetType: b.targetType,
        targetPlatformId: b.targetPlatformId, targetRole: b.targetRole,
        channel: b.channel, status: b.status,
        sentAt: b.sentAt instanceof Date ? b.sentAt.toISOString() : b.sentAt,
        senderName: b.senderName,
      })),
    })
  } catch (error) {
    logger.error('Broadcasts GET error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}
