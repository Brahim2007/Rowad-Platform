import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPlatformScope, requireAuth } from '@/lib/auth-helpers'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error
  if (auth.user.role === 'PLATFORM_MANAGER' && !auth.user.platformId) {
    return NextResponse.json({ success: false, message: 'مدير المنصة غير مرتبط بمنصة' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '50')))
    const scope = getPlatformScope(auth.user)

    const programs = await prisma.program.findMany({
      where: scope.filterAll ? undefined : { platformId: scope.filterId || '__UNASSIGNED_PLATFORM__' },
      take: limit,
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        platformId: true,
      },
    })

    return NextResponse.json({ success: true, data: { programs } })
  } catch (error) {
    logger.error('Programs GET error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}
