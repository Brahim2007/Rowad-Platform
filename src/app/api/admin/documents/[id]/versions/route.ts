import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })

  try {
    const { id } = await params
    const versions = await (prisma as any).documentVersion.findMany({
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
    console.error('Versions GET error:', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}
