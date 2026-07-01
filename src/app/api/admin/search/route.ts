import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim() || ''
    if (q.length < 2) return NextResponse.json({ success: true, data: { members: [], activities: [], documents: [] } })

    const [members, activities, documents] = await Promise.all([
      (prisma as any).beneficiary.findMany({
        where: {
          OR: [
            { firstName: { contains: q, mode: 'insensitive' } },
            { lastName: { contains: q, mode: 'insensitive' } },
            { code: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { id: true, code: true, firstName: true, lastName: true, networkRole: true, platform: { select: { name: true } } },
        take: 10,
      }),
      (prisma as any).impactLog.findMany({
        where: {
          OR: [
            { note: { contains: q, mode: 'insensitive' } },
            { action: { name: { contains: q, mode: 'insensitive' } } },
            { beneficiary: { firstName: { contains: q, mode: 'insensitive' } } },
            { beneficiary: { lastName: { contains: q, mode: 'insensitive' } } },
          ],
        },
        include: {
          action: { select: { name: true } },
          beneficiary: { select: { firstName: true, lastName: true, code: true } },
        },
        take: 10,
        orderBy: { date: 'desc' },
      }),
      (prisma as any).document.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { tags: { contains: q, mode: 'insensitive' } },
          ],
          status: { not: 'ARCHIVED' },
        },
        select: { id: true, title: true, type: true, platform: { select: { name: true } } },
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        members: members.map((m: any) => ({
          id: m.id, code: m.code, name: `${m.firstName} ${m.lastName}`.trim(),
          networkRole: m.networkRole, platformName: m.platform?.name,
          type: 'member' as const,
        })),
        activities: activities.map((l: any) => ({
          id: l.id, title: l.action?.name || 'نشاط',
          name: l.beneficiary ? `${l.beneficiary.firstName} ${l.beneficiary.lastName}` : '—',
          code: l.beneficiary?.code, status: l.status, date: l.date,
          type: 'activity' as const,
        })),
        documents: documents.map((d: any) => ({
          id: d.id, title: d.title, docType: d.type, platformName: d.platform?.name,
          type: 'document' as const,
        })),
      },
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}
