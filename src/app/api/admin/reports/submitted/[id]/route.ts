import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, verifyPlatformOwnership } from '@/lib/auth-helpers'
import { logger } from '@/lib/logger'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error

  try {
    const { id } = await params
    const report = await prisma.submittedReport.findUnique({
      where: { id },
      include: {
        template: { select: { title: true, description: true, category: true, sections: true } },
        platform: { select: { id: true, name: true } },
        program: { select: { id: true, name: true } },
        project: { select: { id: true, title: true } },
      },
    })

    if (!report) {
      return NextResponse.json({ success: false, message: 'التقرير غير موجود' }, { status: 404 })
    }
    if (!(await verifyPlatformOwnership(auth.user, report.platformId))) {
      return NextResponse.json({ success: false, message: 'غير مصرح — خارج نطاق المنصة' }, { status: 403 })
    }

    return NextResponse.json({ success: true, data: report })
  } catch (error) {
    logger.error('Submitted report GET by id error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}
