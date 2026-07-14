import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'
import { logger } from '@/lib/logger'

async function requireActivityLogAccess() {
  const auth = await requireAuth()
  if (!auth.ok) return auth
  if (auth.user.role !== 'SUPER_ADMIN' && auth.user.role !== 'ADMIN') {
    return {
      ok: false as const,
      error: NextResponse.json({ success: false, message: 'غير مصرح — سجل النشاط متاح للإدارة فقط' }, { status: 403 }),
    }
  }
  return auth
}

export async function GET(request: NextRequest) {
  const auth = await requireActivityLogAccess()
  if (!auth.ok) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const entity = searchParams.get('entity') || ''
    const action = searchParams.get('action') || ''
    const limit = Math.min(100, Math.max(10, Number(searchParams.get('limit') || 50)))

    const logs = await prisma.activityLog.findMany({
      where: {
        ...(entity && { entity }),
        ...(action && { action }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({ success: true, data: logs })
  } catch (error) {
    logger.error('Activity log GET error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}
