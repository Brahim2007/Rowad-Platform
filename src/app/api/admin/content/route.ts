import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const ContentPageSchema = z.object({
  title: z.string().min(1, 'عنوان الصفحة مطلوب').max(255).trim(),
  slug: z.string().min(1, 'الرابط المختصر مطلوب').max(255).trim(),
  content: z.string().min(1, 'المحتوى مطلوب'),
  metaDesc: z.string().max(300).optional().or(z.literal('')),
  isPublished: z.boolean().default(false),
})

async function checkAuth() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })
  }
  return null
}

export async function GET() {
  const authError = await checkAuth()
  if (authError) return authError

  try {
    const pages = await prisma.contentPage.findMany({
      orderBy: { updatedAt: 'desc' },
    })
    return NextResponse.json({ success: true, data: pages })
  } catch {
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authError = await checkAuth()
  if (authError) return authError

  try {
    const body = await request.json()
    const validated = ContentPageSchema.parse(body)
    const page = await prisma.contentPage.create({ data: validated })
    return NextResponse.json({ success: true, data: page }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, errors: error.flatten() }, { status: 400 })
    }
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const authError = await checkAuth()
  if (authError) return authError

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
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const authError = await checkAuth()
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })
    await prisma.contentPage.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}
