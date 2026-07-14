import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ContactSchema } from '@/lib/validations/contact'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth-helpers'
import { clientIp, rateLimit, rateLimitResponse } from '@/lib/rate-limit'

export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error
  if (auth.user.role !== 'SUPER_ADMIN' && auth.user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 403 })
  }

  try {
    const messages = await prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    return NextResponse.json({ success: true, data: messages })
  } catch {
    return NextResponse.json(
      { success: false, message: 'خطأ في الخادم' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request)
    if (ip !== 'unknown') {
      const ipLimit = rateLimit(`contact:ip:${ip}`, 5, 10 * 60 * 1000)
      if (!ipLimit.success) {
        return rateLimitResponse('طلبات كثيرة — حاول بعد قليل', ipLimit.retryAfter)
      }
    }

    const body = await request.json()
    const validated = ContactSchema.parse(body)
    const emailLimit = rateLimit(`contact:email:${validated.email.toLowerCase()}`, 3, 30 * 60 * 1000)
    if (!emailLimit.success) {
      return rateLimitResponse('طلبات كثيرة لهذا البريد — حاول لاحقاً', emailLimit.retryAfter)
    }

    const message = await prisma.contactMessage.create({
      data: validated,
    })

    return NextResponse.json(
      { success: true, data: { id: message.id } },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: error.flatten() },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, message: 'خطأ في الخادم' },
      { status: 500 }
    )
  }
}
