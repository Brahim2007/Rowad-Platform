import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const platforms = await prisma.platform.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        programs: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            activities: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    })

    return NextResponse.json({ success: true, data: { platforms } })
  } catch {
    return NextResponse.json(
      { success: false, message: 'خطأ في الخادم' },
      { status: 500 }
    )
  }
}
