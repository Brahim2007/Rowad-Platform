/**
 * نسخ احتياطي كامل — للإدارة العليا فقط
 * GET /api/admin/backup — تصدير JSON كامل لجميع البيانات
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSuperAdmin } from '@/lib/auth-helpers'
import { logger } from '@/lib/logger'

export async function GET() {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return auth.error

  try {
    const [
      beneficiaries, impactActions, impactLogs, impactAwards, impactGates,
      platforms, adminUsers, documents, broadcasts,
    ] = await Promise.all([
      prisma.beneficiary.findMany(),
      prisma.impactAction.findMany(),
      prisma.impactLog.findMany({ include: { action: true } }),
      prisma.impactAward.findMany(),
      prisma.impactGate.findMany(),
      prisma.platform.findMany(),
      prisma.adminUser.findMany({ select: { id: true, email: true, fullName: true, role: true, isActive: true, platformId: true } }),
      prisma.document.findMany(),
      prisma.broadcast.findMany(),
    ])

    const backup = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      complete: true,
      scope: 'core-platform-data',
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
        beneficiaries: beneficiaries.map((b) => ({ ...b, passwordHash: undefined })),
        impactActions,
        impactLogs: impactLogs.map((l) => ({ ...l, beneficiary: undefined })),
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
        'Cache-Control': 'no-store, private',
      },
    })
  } catch (error) {
    logger.error('Backup error', error)
    return NextResponse.json({ success: false, message: 'خطأ في تصدير النسخة الاحتياطية' }, { status: 500 })
  }
}
