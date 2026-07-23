import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { requireActiveMember } from '@/lib/member-auth'
import { logger } from '@/lib/logger'
import { ensureMonthlyPlatformReportReminders } from '@/lib/monthly-platform-report-reminders'

type RecipientContext = 'ADMIN' | 'PLATFORM_MANAGER' | 'MEMBER'

async function currentRecipientId(request: NextRequest, type: RecipientContext): Promise<string> {
  if (type === 'MEMBER') {
    const member = await requireActiveMember(request)
    return member.ok ? member.member.id : ''
  }

  const session = await auth()
  if (session?.user) return (session.user as { id?: string }).id || ''
  return ''
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const limit = Math.min(Number(searchParams.get('limit')) || 30, 100)

    if (type !== 'ADMIN' && type !== 'PLATFORM_MANAGER' && type !== 'MEMBER') {
      return NextResponse.json({ success: false, message: 'نوع المستلم مطلوب' }, { status: 400 })
    }
    const userId = await currentRecipientId(request, type)

    if (!userId) {
      return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })
    }

    if (type === 'ADMIN') {
      const session = await auth()
      const role = (session?.user as { role?: string } | undefined)?.role
      if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
        await ensureMonthlyPlatformReportReminders(userId)
      }
    }

    const notifications = await prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    const unreadCount = await prisma.notification.count({
      where: { recipientId: userId, isRead: false },
    })

    return NextResponse.json({
      success: true,
      data: notifications.map(n => ({
        id: n.id, type: n.type, title: n.title, body: n.body,
        link: n.link, isRead: n.isRead,
        createdAt: n.createdAt instanceof Date ? n.createdAt.toISOString() : n.createdAt,
        senderName: n.senderName,
      })),
      unreadCount,
    })
  } catch (error) {
    logger.error('Notifications GET error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, readAll, type } = body
    if (type !== 'ADMIN' && type !== 'PLATFORM_MANAGER' && type !== 'MEMBER') {
      return NextResponse.json({ success: false, message: 'نوع المستلم مطلوب' }, { status: 400 })
    }
    const targetUserId = await currentRecipientId(request, type)

    if (!targetUserId) {
      return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })
    }

    if (readAll) {
      await prisma.notification.updateMany({
        where: { recipientId: targetUserId, isRead: false },
        data: { isRead: true, readAt: new Date() },
      })
      return NextResponse.json({ success: true })
    }

    if (id) {
      await prisma.notification.update({
        where: { id, recipientId: targetUserId },
        data: { isRead: true, readAt: new Date() },
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: false, message: 'معرّف الإشعار مطلوب' }, { status: 400 })
  } catch (error) {
    logger.error('Notifications PUT error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}
