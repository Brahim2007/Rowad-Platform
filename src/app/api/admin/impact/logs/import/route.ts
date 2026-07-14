/**
 * استيراد جماعي للأنشطة عبر CSV
 * POST /api/admin/impact/logs/import
 */

import { NextRequest, NextResponse } from 'next/server'
import { ImpactQuality } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireAuth, verifyPlatformOwnership } from '@/lib/auth-helpers'
import { logger } from '@/lib/logger'

function parseQuality(value: string): ImpactQuality {
  return Object.values(ImpactQuality).includes(value as ImpactQuality)
    ? value as ImpactQuality
    : ImpactQuality.ACCEPTABLE
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error
  if (auth.user.role !== 'SUPER_ADMIN' && auth.user.role !== 'ADMIN' && auth.user.role !== 'PLATFORM_MANAGER') {
    return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 403 })
  }

  try {
    const { rows } = await request.json()
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ success: false, message: 'الملف فارغ' }, { status: 400 })
    }
    if (rows.length > 100) {
      return NextResponse.json({ success: false, message: 'الحد الأقصى 100 نشاط في المرة' }, { status: 400 })
    }

    const results: Array<{ row: number; status: string; message: string }> = []
    let created = 0

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      try {
        const beneficiaryCode = String(row.beneficiaryCode || row.code || row['كود العضو'] || '').trim()
        const actionName = String(row.actionName || row.action || row['النشاط'] || '').trim()
        const count = Number(row.count || row['العدد'] || 1)
        const quality = String(row.quality || row['الجودة'] || 'ACCEPTABLE').trim()
        const date = String(row.date || row['التاريخ'] || new Date().toISOString().slice(0, 10)).trim()
        const note = String(row.note || row['ملاحظات'] || '').trim()

        if (!beneficiaryCode || !actionName) {
          results.push({ row: i + 2, status: 'error', message: 'كود العضو والنشاط مطلوبان' })
          continue
        }

        const beneficiary = await prisma.beneficiary.findUnique({ where: { code: beneficiaryCode } })
        if (!beneficiary) {
          results.push({ row: i + 2, status: 'error', message: `العضو ${beneficiaryCode} غير موجود` })
          continue
        }
        if (!(await verifyPlatformOwnership(auth.user, beneficiary.platformId))) {
          results.push({ row: i + 2, status: 'error', message: `العضو ${beneficiaryCode} خارج نطاق المنصة` })
          continue
        }

        let action = await prisma.impactAction.findFirst({ where: { name: actionName } })
        if (!action) {
          action = await prisma.impactAction.findFirst({ where: { name: { contains: actionName, mode: 'insensitive' } } })
        }
        if (!action) {
          results.push({ row: i + 2, status: 'error', message: `النشاط "${actionName}" غير موجود في الكتالوج` })
          continue
        }

        await prisma.impactLog.create({
          data: {
            beneficiaryId: beneficiary.id,
            actionId: action.id,
            count: Math.max(1, count),
            quality: parseQuality(quality),
            date: new Date(date),
            note: note || null,
            status: 'PENDING_REVIEW',
            sourceType: 'MANUAL',
            platformId: beneficiary.platformId || null,
          },
        })

        results.push({ row: i + 2, status: 'created', message: `${beneficiary.firstName}: ${action.name}` })
        created++
      } catch (e: unknown) {
        results.push({ row: i + 2, status: 'error', message: e instanceof Error ? e.message : 'خطأ' })
      }
    }

    return NextResponse.json({ success: true, data: { created, total: rows.length, results } }, { status: 201 })
  } catch (error) {
    logger.error('Impact logs import error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الاستيراد' }, { status: 500 })
  }
}
