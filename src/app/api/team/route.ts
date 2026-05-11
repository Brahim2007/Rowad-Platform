import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const team = await prisma.beneficiary.findMany({
      where: { type: { in: ['TEAM', 'BOTH'] }, status: 'ACTIVE' },
      orderBy: { sortOrder: 'asc' },
    })

    const mapped = team.map(m => ({
      id: m.id,
      name: `${m.firstName} ${m.lastName}`,
      role: m.role || '',
      bio: m.bio,
      avatar: m.avatar,
      linkedinUrl: m.linkedinUrl,
    }))

    return NextResponse.json({ success: true, data: mapped })
  } catch {
    return NextResponse.json(
      { success: false, message: 'خطأ في الخادم' },
      { status: 500 }
    )
  }
}
