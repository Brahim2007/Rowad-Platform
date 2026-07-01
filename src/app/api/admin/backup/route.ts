/**
 * نسخ احتياطي كامل — للإدارة العليا فقط
 * GET /api/admin/backup — تصدير JSON كامل لجميع البيانات
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSuperAdmin } from '@/lib/auth-helpers'

export async function GET() {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return auth.error

  try {
    const [
      beneficiaries, impactActions, impactLogs, impactAwards, impactGates,
      platforms, adminUsers, documents, broadcasts,
    ] = await Promise.all([
      (prisma as any).beneficiary.findMany({ take: 5000 }),
      (prisma as any).impactAction.findMany(),
      (prisma as any).impactLog.findMany({ take: 10000, include: { action: true } }),
      (prisma as any).impactAward.findMany(),
      (prisma as any).impactGate.findMany(),
      (prisma as any).platform.findMany(),
      (prisma as any).adminUser.findMany({ select: { id: true, email: true, fullName: true, role: true, isActive: true, platformId: true } }),
      (prisma as any).document.findMany({ where: { status: { not: 'ARCHIVED' } }, take: 1000 }),
      (prisma as any).broadcast.findMany({ take: 500 }),
    ])

    const backup = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      summary: {
        beneficiaries: beneficiaries.length,
        impactActions: impactActions.length,
        impactLogs: impactLogs.length,
        impactAwards: impactAwards.length,
        platforms: platforms.length,
        adminUsers: adminUsers.length,
        documents: documents.length,
      },
      data: {
        beneficiaries: beneficiaries.map((b: any) => ({ ...b, passwordHash: undefined })),
        impactActions,
        impactLogs: impactLogs.map((l: any) => ({ ...l, beneficiary: undefined })),
        impactAwards,
        impactGates,
        platforms,
        adminUsers,
        documents,
        broadcasts,
      },
    }

    const filename = `rowad-backup-${new Date().toISOString().slice(0, 10)}.json`
    return new NextResponse(JSON.stringify(backup, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Backup error:', error)
    return NextResponse.json({ success: false, message: 'خطأ في تصدير النسخة الاحتياطية' }, { status: 500 })
  }
}
