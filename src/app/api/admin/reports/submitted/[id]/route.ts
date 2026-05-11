import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

async function checkAuth() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })
  }
  return null
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await checkAuth()
  if (authError) return authError

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

    return NextResponse.json({ success: true, data: report })
  } catch (error) {
    console.error('Submitted report GET by id error:', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}
