import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

async function checkAuth() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })
  }
  return null
}

export async function GET(request: NextRequest) {
  const authError = await checkAuth()
  if (authError) return authError

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
    console.error('Activity log GET error:', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}
