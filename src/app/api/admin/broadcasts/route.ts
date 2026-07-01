/**
 * API الرسائل الجماعية
 * POST /api/admin/broadcasts — إرسال رسالة جديدة
 * GET  /api/admin/broadcasts — سجل الرسائل
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { createNotification } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })

  const user = session.user as any
  if (user.role !== 'SUPER_ADMIN' && user.role !== 'PLATFORM_MANAGER') {
    return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { subject, body: msgBody, targetType, targetPlatformId, targetRole, targetMemberId, channel } = body

    if (!subject?.trim() || !msgBody?.trim()) {
      return NextResponse.json({ success: false, message: 'الموضوع والمحتوى مطلوبان' }, { status: 400 })
    }

    // تحديد مستقبلي الإشعارات
    const recipients: Array<{ id: string; type: string; name: string }> = []

    if (targetType === 'ALL') {
      const members = await (prisma as any).beneficiary.findMany({ where: { status: 'ACTIVE' }, select: { id: true, firstName: true, lastName: true } })
      members.forEach((m: any) => recipients.push({ id: m.id, type: 'MEMBER', name: `${m.firstName} ${m.lastName}` }))
      const admins = await (prisma as any).adminUser.findMany({ where: { isActive: true }, select: { id: true, fullName: true, role: true } })
      admins.forEach((a: any) => recipients.push({ id: a.id, type: a.role === 'PLATFORM_MANAGER' ? 'PLATFORM_MANAGER' : 'ADMIN', name: a.fullName }))
    } else if (targetType === 'PLATFORM' && targetPlatformId) {
      const members = await (prisma as any).beneficiary.findMany({ where: { platformId: targetPlatformId, status: 'ACTIVE' }, select: { id: true, firstName: true, lastName: true } })
      members.forEach((m: any) => recipients.push({ id: m.id, type: 'MEMBER', name: `${m.firstName} ${m.lastName}` }))
      const managers = await (prisma as any).adminUser.findMany({ where: { platformId: targetPlatformId, isActive: true }, select: { id: true, fullName: true, role: true } })
      managers.forEach((a: any) => recipients.push({ id: a.id, type: 'PLATFORM_MANAGER', name: a.fullName }))
    } else if (targetType === 'ROLE' && targetRole) {
      const members = await (prisma as any).beneficiary.findMany({ where: { networkRole: targetRole, status: 'ACTIVE' }, select: { id: true, firstName: true, lastName: true } })
      members.forEach((m: any) => recipients.push({ id: m.id, type: 'MEMBER', name: `${m.firstName} ${m.lastName}` }))
    } else if (targetType === 'INDIVIDUAL' && targetMemberId) {
      const member = await (prisma as any).beneficiary.findUnique({ where: { id: targetMemberId }, select: { id: true, firstName: true, lastName: true } })
      if (member) recipients.push({ id: member.id, type: 'MEMBER', name: `${member.firstName} ${member.lastName}` })
    } else {
      return NextResponse.json({ success: false, message: 'نوع الهدف غير صحيح أو البيانات ناقصة' }, { status: 400 })
    }

    // حفظ الرسالة
    const broadcast = await (prisma as any).broadcast.create({
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
        recipientType: r.type as any,
        type: 'BROADCAST',
        title: subject.trim(),
        body: msgBody.trim(),
        senderId: user.id,
        senderName: user.name || user.email,
      })
    }

    return NextResponse.json({ success: true, data: { broadcast, recipientsCount: recipients.length } }, { status: 201 })
  } catch (error) {
    console.error('Broadcast POST error:', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })

  try {
    const broadcasts = await (prisma as any).broadcast.findMany({
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
    console.error('Broadcasts GET error:', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}
