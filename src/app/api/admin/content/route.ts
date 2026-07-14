import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminRole } from '@/lib/auth-helpers'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const ContentPageSchema = z.object({
  title: z.string().min(1, 'عنوان الصفحة مطلوب').max(255).trim(),
  slug: z.string().min(1, 'الرابط المختصر مطلوب').max(255).trim(),
  content: z.string().min(1, 'المحتوى مطلوب'),
  metaDesc: z.string().max(300).optional().or(z.literal('')),
  isPublished: z.boolean().default(false),
})

export async function GET() {
  const auth = await requireAdminRole()
  if (!auth.ok) return auth.error

  try {
    const pages = await prisma.contentPage.findMany({
      orderBy: { updatedAt: 'desc' },
    })
    return NextResponse.json({ success: true, data: pages })
  } catch (error) {
    logger.error('Content pages GET error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminRole()
  if (!auth.ok) return auth.error

  try {
    const body = await request.json()
    const validated = ContentPageSchema.parse(body)
    const page = await prisma.contentPage.create({ data: validated })
    return NextResponse.json({ success: true, data: page }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, errors: error.flatten() }, { status: 400 })
    }
    logger.error('Content pages POST error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdminRole()
  if (!auth.ok) return auth.error

  try {
    const body = await request.json()
    const { id, ...data } = body
    if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })
    const validated = ContentPageSchema.partial().parse(data)
    const page = await prisma.contentPage.update({ where: { id }, data: validated })
    return NextResponse.json({ success: true, data: page })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, errors: error.flatten() }, { status: 400 })
    }
    logger.error('Content pages PUT error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdminRole()
  if (!auth.ok) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })
    await prisma.contentPage.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Content pages DELETE error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}
