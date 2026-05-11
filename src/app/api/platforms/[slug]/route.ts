import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const platform = await prisma.platform.findUnique({
      where: { slug },
      include: {
        programs: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            activities: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    })

    if (!platform) {
      return NextResponse.json(
        { success: false, message: 'المنصة غير موجودة' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { platform, programs: platform.programs },
    })
  } catch {
    return NextResponse.json(
      { success: false, message: 'خطأ في الخادم' },
      { status: 500 }
    )
  }
}
