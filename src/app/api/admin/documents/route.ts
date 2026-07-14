/**
 * API وثائق الأرشيف
 * GET    /api/admin/documents — عرض الوثائق
 * POST   /api/admin/documents — رفع وثيقة جديدة
 * PUT    /api/admin/documents — تعديل
 * DELETE /api/admin/documents?id= — أرشفة
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, type SessionUser, verifyPlatformOwnership } from '@/lib/auth-helpers'
import { logger } from '@/lib/logger'

function requireDocumentAccess(user: SessionUser) {
  if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'PLATFORM_MANAGER') return null
  return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 403 })
}

// ═══════════════════════════════════════════════════
// GET — عرض الوثائق مع الفلترة
// ═══════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error
  const authError = requireDocumentAccess(auth.user)
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || ''
    const platformId = auth.user.role === 'PLATFORM_MANAGER'
      ? auth.user.platformId
      : (searchParams.get('platformId') || '')
    const status = searchParams.get('status') || ''
    const search = searchParams.get('search') || ''
    const year = searchParams.get('year') || ''
    const month = searchParams.get('month') || ''
    const limit = Math.min(Number(searchParams.get('limit')) || 200, 500)

    const where: Record<string, unknown> = {}
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
      prisma.document.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          platform: { select: { id: true, name: true } },
          _count: { select: { versions: true } },
        },
      }),
      prisma.document.count({ where }),
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
    logger.error('Documents GET error', error)
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
  const auth = await requireAuth()
  if (!auth.ok) return auth.error
  const authError = requireDocumentAccess(auth.user)
  if (authError) return authError

  try {
    const body = await request.json()
    const { title, type, description, tags, periodYear, periodMonth, fileUrl, fileType, fileSize, platformId } = body

    if (!title?.trim()) {
      return NextResponse.json({ success: false, message: 'عنوان الوثيقة مطلوب' }, { status: 400 })
    }
    if (!fileUrl?.trim()) {
      return NextResponse.json({ success: false, message: 'رابط الملف مطلوب' }, { status: 400 })
    }

    const actor = auth.user.name || auth.user.email || 'مستخدم'
    const scopedPlatformId = auth.user.role === 'PLATFORM_MANAGER' ? auth.user.platformId : (platformId || null)
    if (auth.user.role === 'PLATFORM_MANAGER' && !scopedPlatformId) {
      return NextResponse.json({ success: false, message: 'مدير المنصة غير مرتبط بمنصة' }, { status: 403 })
    }
    if (scopedPlatformId && !(await verifyPlatformOwnership(auth.user, scopedPlatformId))) {
      return NextResponse.json({ success: false, message: 'غير مصرح — خارج نطاق المنصة' }, { status: 403 })
    }
    const doc = await prisma.document.create({
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
        platformId: scopedPlatformId,
        uploadedBy: actor,
        uploadedById: auth.user.id,
        status: 'APPROVED',
      },
    })

    // إنشاء النسخة الأولى
    await prisma.documentVersion.create({
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
    logger.error('Documents POST error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الحفظ' }, { status: 500 })
  }
}

// ═══════════════════════════════════════════════════
// PUT — تعديل وثيقة
// ═══════════════════════════════════════════════════

export async function PUT(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error
  const authError = requireDocumentAccess(auth.user)
  if (authError) return authError

  try {
    const { id, title, type, description, tags, periodYear, periodMonth, fileUrl, fileType, fileSize, status } = await request.json()
    if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })

    const actor = auth.user.name || auth.user.email || 'مستخدم'
    const current = await prisma.document.findUnique({ where: { id } })
    if (!current) return NextResponse.json({ success: false, message: 'الوثيقة غير موجودة' }, { status: 404 })
    if (!(await verifyPlatformOwnership(auth.user, current.platformId))) {
      return NextResponse.json({ success: false, message: 'غير مصرح — خارج نطاق المنصة' }, { status: 403 })
    }

    // إنشاء نسخة جديدة إن تغيّر الملف
    if (fileUrl && fileUrl !== current.fileUrl) {
      const lastVersion = await prisma.documentVersion.findFirst({
        where: { documentId: id },
        orderBy: { version: 'desc' },
      })
      await prisma.documentVersion.create({
        data: {
          documentId: id,
          version: (lastVersion?.version || 1) + 1,
          fileUrl,
          editedBy: actor,
          changeNote: 'تحديث الملف',
        },
      })
    }

    const doc = await prisma.document.update({
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
        ...(auth.user.role === 'PLATFORM_MANAGER' ? { platformId: auth.user.platformId } : {}),
        lastEditedBy: actor,
        lastEditedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, data: doc })
  } catch (error) {
    logger.error('Documents PUT error', error)
    return NextResponse.json({ success: false, message: 'خطأ في التحديث' }, { status: 500 })
  }
}

// ═══════════════════════════════════════════════════
// DELETE — أرشفة (لا حذف نهائي)
// ═══════════════════════════════════════════════════

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error
  if (auth.user.role !== 'SUPER_ADMIN' && auth.user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, message: 'غير مصرح — الإدارة العليا فقط' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })
    const document = await prisma.document.findUnique({ where: { id }, select: { platformId: true } })
    if (!document) return NextResponse.json({ success: false, message: 'الوثيقة غير موجودة' }, { status: 404 })
    if (!(await verifyPlatformOwnership(auth.user, document.platformId))) {
      return NextResponse.json({ success: false, message: 'غير مصرح — خارج نطاق المنصة' }, { status: 403 })
    }

    // أرشفة لا حذف
    await prisma.document.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    })

    return NextResponse.json({ success: true, message: 'تمت أرشفة الوثيقة' })
  } catch (error) {
    logger.error('Documents DELETE error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}
