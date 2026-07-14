import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, verifyPlatformOwnership } from '@/lib/auth-helpers'
import { logger } from '@/lib/logger'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error

  try {
    const { id } = await params
    const document = await prisma.document.findUnique({ where: { id }, select: { platformId: true } })
    if (!document) return NextResponse.json({ success: false, message: 'الوثيقة غير موجودة' }, { status: 404 })
    if (!(await verifyPlatformOwnership(auth.user, document.platformId))) {
      return NextResponse.json({ success: false, message: 'غير مصرح — خارج نطاق المنصة' }, { status: 403 })
    }

    const versions = await prisma.documentVersion.findMany({
      where: { documentId: id },
      orderBy: { version: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: versions.map((v: any) => ({
        id: v.id,
        version: v.version,
        fileUrl: v.fileUrl,
        editedBy: v.editedBy,
        editedAt: v.editedAt instanceof Date ? v.editedAt.toISOString() : v.editedAt,
        changeNote: v.changeNote,
      })),
    })
  } catch (error) {
    logger.error('Document versions GET error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}
