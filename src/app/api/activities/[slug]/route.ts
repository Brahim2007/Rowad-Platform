import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const activity = await prisma.activity.findUnique({
      where: { slug },
      include: {
        program: {
          include: {
            platform: true,
            activities: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    })

    if (!activity || !activity.isActive || !activity.program.isActive || !activity.program.platform.isActive) {
      return NextResponse.json(
        { success: false, message: 'الدورة غير موجودة' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { activity },
    })
  } catch {
    return NextResponse.json(
      { success: false, message: 'خطأ في الخادم' },
      { status: 500 }
    )
  }
}
