import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireActiveMember } from '@/lib/member-auth'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireActiveMember(request)
    if (!auth.ok) return auth.error

    const actions = await prisma.impactAction.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
      select: {
        id: true,
        name: true,
        points: true,
        category: true,
        note: true,
        isActive: true,
        sortOrder: true,
      },
    })

    return NextResponse.json({ success: true, data: actions })
  } catch (error) {
    logger.error('Member impact actions GET error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}
