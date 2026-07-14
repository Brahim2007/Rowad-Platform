import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, verifyPlatformOwnership } from '@/lib/auth-helpers'
import { logger } from '@/lib/logger'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error

  try {
    const { slug } = await params
    const activity = await prisma.activity.findUnique({
      where: { slug },
      include: {
        program: {
          include: {
            platform: {
              select: { id: true, name: true, slug: true, color: true, logo: true },
            },
          },
        },
        participations: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            status: true,
            attendedAt: true,
            score: true,
            feedback: true,
            certificateUrl: true,
            createdAt: true,
            beneficiary: {
              select: {
                id: true,
                code: true,
                firstName: true,
                lastName: true,
                email: true,
                country: true,
                city: true,
                avatar: true,
              },
            },
          },
        },
        evaluations: {
          orderBy: { evaluatedAt: 'desc' },
          select: {
            id: true,
            title: true,
            evaluator: true,
            evaluatorRole: true,
            type: true,
            score: true,
            maxScore: true,
            feedback: true,
            recommendations: true,
            status: true,
            evaluatedAt: true,
          },
        },
        _count: {
          select: {
            participations: true,
            evaluations: true,
          },
        },
      },
    })

    if (!activity) {
      return NextResponse.json({ success: false, message: 'النشاط غير موجود' }, { status: 404 })
    }
    if (!(await verifyPlatformOwnership(auth.user, activity.program.platform.id))) {
      return NextResponse.json({ success: false, message: 'غير مصرح — خارج نطاق المنصة' }, { status: 403 })
    }

    const participationStats = {
      total: activity._count.participations,
      registered: activity.participations.filter(p => p.status === 'REGISTERED').length,
      attended: activity.participations.filter(p => p.status === 'ATTENDED').length,
      completed: activity.participations.filter(p => p.status === 'COMPLETED').length,
      absent: activity.participations.filter(p => p.status === 'ABSENT').length,
    }

    return NextResponse.json({
      success: true,
      data: {
        ...activity,
        participationStats,
        program: {
          ...activity.program,
          platform: activity.program.platform,
        },
      },
    })
  } catch (error) {
    logger.error('Activity detail API error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}
