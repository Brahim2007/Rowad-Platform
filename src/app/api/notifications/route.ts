import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.AUTH_SECRET || 'member-secret-dev'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || ''      // ADMIN or MEMBER
    const limit = Math.min(Number(searchParams.get('limit')) || 30, 100)

    let userId = ''

    if (type === 'MEMBER' || !type) {
      const token = request.cookies.get('member_token')?.value
      if (token) {
        try { const p: any = jwt.verify(token, JWT_SECRET); userId = p.id } catch {}
      }
    }

    if (!userId) {
      const session = await auth()
      if (session?.user) userId = (session.user as any).id
    }

    if (!userId) {
      return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })
    }

    const notifications = await (prisma as any).notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    const unreadCount = await (prisma as any).notification.count({
      where: { recipientId: userId, isRead: false },
    })

    return NextResponse.json({
      success: true,
      data: notifications.map((n: any) => ({
        id: n.id, type: n.type, title: n.title, body: n.body,
        link: n.link, isRead: n.isRead,
        createdAt: n.createdAt instanceof Date ? n.createdAt.toISOString() : n.createdAt,
        senderName: n.senderName,
      })),
      unreadCount,
    })
  } catch (error) {
    console.error('Notifications GET error:', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, readAll, userId } = body

    let targetUserId = userId || ''

    if (!targetUserId) {
      const token = request.cookies.get('member_token')?.value
      if (token) {
        try { const p: any = jwt.verify(token, JWT_SECRET); targetUserId = p.id } catch {}
      }
      if (!targetUserId) {
        const session = await auth()
        if (session?.user) targetUserId = (session.user as any).id
      }
    }

    if (!targetUserId) {
      return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })
    }

    if (readAll) {
      await (prisma as any).notification.updateMany({
        where: { recipientId: targetUserId, isRead: false },
        data: { isRead: true, readAt: new Date() },
      })
      return NextResponse.json({ success: true })
    }

    if (id) {
      await (prisma as any).notification.update({
        where: { id },
        data: { isRead: true, readAt: new Date() },
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: false, message: 'معرّف الإشعار مطلوب' }, { status: 400 })
  } catch (error) {
    console.error('Notifications PUT error:', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}
