import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const [platformsCount, projectsCount, partnersCount, beneficiariesCount] = await Promise.all([
      prisma.platform.count({ where: { isActive: true } }),
      prisma.project.count({ where: { status: 'ACTIVE' } }),
      prisma.partner.count({ where: { isActive: true } }),
      prisma.beneficiary.count({ where: { status: 'ACTIVE', type: { in: ['BENEFICIARY', 'BOTH'] } } }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        platforms: platformsCount,
        projects: projectsCount,
        partners: partnersCount,
        beneficiaries: beneficiariesCount,
      },
    })
  } catch {
    return NextResponse.json(
      { success: false, message: 'خطأ في الخادم' },
      { status: 500 }
    )
  }
}
