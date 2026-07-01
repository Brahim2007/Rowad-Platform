/**
 * API وثائق الأرشيف
 * GET    /api/admin/documents — عرض الوثائق
 * POST   /api/admin/documents — رفع وثيقة جديدة
 * PUT    /api/admin/documents — تعديل
 * DELETE /api/admin/documents?id= — أرشفة
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getPlatformScope, type SessionUser } from '@/lib/auth-helpers'

// ═══════════════════════════════════════════════════
// GET — عرض الوثائق مع الفلترة
// ═══════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })

  const user = session.user as any
  if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN' && user.role !== 'PLATFORM_MANAGER') {
    return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || ''
    const platformId = searchParams.get('platformId') || (user.role === 'PLATFORM_MANAGER' ? user.platformId : '')
    const status = searchParams.get('status') || ''
    const search = searchParams.get('search') || ''
    const year = searchParams.get('year') || ''
    const month = searchParams.get('month') || ''
    const limit = Math.min(Number(searchParams.get('limit')) || 200, 500)

    const where: any = {}
    if (type) where.type = type
    if (status) where.status = status
    if (platformId) where.platformId = platformId
    if (year) where.periodYear = Number(year)
    if (month) where.periodMonth = Number(month)
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { contains: search, mode: 'insensitive' } },
      ]
    }
    // ARCHIVED لا يُعرض إلا عند الطلب
    if (!status) where.status = { not: 'ARCHIVED' }

    const [docs, total] = await Promise.all([
      (prisma as any).document.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          platform: { select: { id: true, name: true } },
          _count: { select: { versions: true } },
        },
      }),
      (prisma as any).document.count({ where }),
    ])

    const data = docs.map((d: any) => ({
      id: d.id,
      title: d.title,
      type: d.type,
      typeLabel: DOC_TYPE_LABELS[d.type] || 'أخرى',
      description: d.description,
      tags: d.tags ? d.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
      periodYear: d.periodYear,
      periodMonth: d.periodMonth,
      fileUrl: d.fileUrl,
      fileType: d.fileType,
      fileSize: d.fileSize,
      platformId: d.platformId,
      platformName: d.platform?.name || null,
      uploadedBy: d.uploadedBy,
      uploadedAt: d.createdAt instanceof Date ? d.createdAt.toISOString() : d.createdAt,
      lastEditedBy: d.lastEditedBy,
      lastEditedAt: d.lastEditedAt instanceof Date ? d.lastEditedAt.toISOString() : d.lastEditedAt,
      status: d.status,
      versionsCount: d._count?.versions || 0,
    }))

    return NextResponse.json({ success: true, data, total })
  } catch (error) {
    console.error('Documents GET error:', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

// ═══════════════════════════════════════════════════
// POST — رفع وثيقة جديدة
// ═══════════════════════════════════════════════════

const DOC_TYPE_LABELS: Record<string, string> = {
  REPORT: 'تقرير', BUDGET: 'ميزانية', MEETING_MINUTES: 'محضر اجتماع',
  WORK_PLAN: 'خطة عمل', ANNOUNCEMENT: 'إعلان', NEWSLETTER: 'نشرة', OTHER: 'أخرى',
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })

  const user = session.user as any
  if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN' && user.role !== 'PLATFORM_MANAGER') {
    return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { title, type, description, tags, periodYear, periodMonth, fileUrl, fileType, fileSize, platformId } = body

    if (!title?.trim()) {
      return NextResponse.json({ success: false, message: 'عنوان الوثيقة مطلوب' }, { status: 400 })
    }
    if (!fileUrl?.trim()) {
      return NextResponse.json({ success: false, message: 'رابط الملف مطلوب' }, { status: 400 })
    }

    const actor = user.name || user.email || 'مستخدم'
    const doc = await (prisma as any).document.create({
      data: {
        title: title.trim(),
        type: type || 'OTHER',
        description: description?.trim() || null,
        tags: tags?.trim() || null,
        periodYear: periodYear || null,
        periodMonth: periodMonth || null,
        fileUrl: fileUrl.trim(),
        fileType: fileType || null,
        fileSize: fileSize || null,
        platformId: platformId || (user.role === 'PLATFORM_MANAGER' ? user.platformId : null),
        uploadedBy: actor,
        uploadedById: user.id,
        status: 'APPROVED',
      },
    })

    // إنشاء النسخة الأولى
    await (prisma as any).documentVersion.create({
      data: {
        documentId: doc.id,
        version: 1,
        fileUrl: fileUrl.trim(),
        editedBy: actor,
        changeNote: 'الرفع الأولي',
      },
    })

    return NextResponse.json({ success: true, data: doc }, { status: 201 })
  } catch (error) {
    console.error('Documents POST error:', error)
    return NextResponse.json({ success: false, message: 'خطأ في الحفظ' }, { status: 500 })
  }
}

// ═══════════════════════════════════════════════════
// PUT — تعديل وثيقة
// ═══════════════════════════════════════════════════

export async function PUT(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })

  const user = session.user as any
  if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN' && user.role !== 'PLATFORM_MANAGER') {
    return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 403 })
  }

  try {
    const { id, title, type, description, tags, periodYear, periodMonth, fileUrl, fileType, fileSize, status, status: newStatus } = await request.json()
    if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })

    const actor = user.name || user.email || 'مستخدم'
    const current = await (prisma as any).document.findUnique({ where: { id } })
    if (!current) return NextResponse.json({ success: false, message: 'الوثيقة غير موجودة' }, { status: 404 })

    // إنشاء نسخة جديدة إن تغيّر الملف
    if (fileUrl && fileUrl !== current.fileUrl) {
      const lastVersion = await (prisma as any).documentVersion.findFirst({
        where: { documentId: id },
        orderBy: { version: 'desc' },
      })
      await (prisma as any).documentVersion.create({
        data: {
          documentId: id,
          version: (lastVersion?.version || 1) + 1,
          fileUrl,
          editedBy: actor,
          changeNote: 'تحديث الملف',
        },
      })
    }

    const doc = await (prisma as any).document.update({
      where: { id },
      data: {
        title: title?.trim(),
        type: type,
        description: description?.trim(),
        tags: tags?.trim(),
        periodYear: periodYear,
        periodMonth: periodMonth,
        fileUrl: fileUrl?.trim(),
        fileType: fileType,
        fileSize: fileSize,
        status: status,
        lastEditedBy: actor,
        lastEditedAt: new Date(),
      } as any,
    })

    return NextResponse.json({ success: true, data: doc })
  } catch (error) {
    console.error('Documents PUT error:', error)
    return NextResponse.json({ success: false, message: 'خطأ في التحديث' }, { status: 500 })
  }
}

// ═══════════════════════════════════════════════════
// DELETE — أرشفة (لا حذف نهائي)
// ═══════════════════════════════════════════════════

export async function DELETE(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })

  const user = session.user as any
  if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, message: 'غير مصرح — الإدارة العليا فقط' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })

    // أرشفة لا حذف
    await (prisma as any).document.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    })

    return NextResponse.json({ success: true, message: 'تمت أرشفة الوثيقة' })
  } catch (error) {
    console.error('Documents DELETE error:', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}
