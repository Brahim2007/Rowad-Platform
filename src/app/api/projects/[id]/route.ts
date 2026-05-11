import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    let project = await prisma.project.findUnique({
      where: { id },
      include: {
        platform: { select: { id: true, name: true, slug: true } },
        program: { select: { id: true, name: true, slug: true } },
      },
    })

    if (!project) {
      project = await prisma.project.findUnique({
        where: { slug: id },
        include: {
          platform: { select: { id: true, name: true, slug: true } },
          program: { select: { id: true, name: true, slug: true } },
        },
      })
    }

    if (!project) {
      return NextResponse.json(
        { success: false, message: 'المشروع غير موجود' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: project })
  } catch {
    return NextResponse.json(
      { success: false, message: 'خطأ في الخادم' },
      { status: 500 }
    )
  }
}
