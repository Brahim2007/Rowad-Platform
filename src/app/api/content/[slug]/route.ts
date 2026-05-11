import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const page = await prisma.contentPage.findFirst({
      where: { slug, isPublished: true },
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        metaDesc: true,
        updatedAt: true,
      },
    })

    if (!page) {
      return NextResponse.json(
        { success: false, message: 'المحتوى غير موجود' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: page })
  } catch {
    return NextResponse.json(
      { success: false, message: 'خطأ في الخادم' },
      { status: 500 }
    )
  }
}
