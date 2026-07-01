/**
 * استيراد جماعي للأنشطة عبر CSV
 * POST /api/admin/impact/logs/import
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })

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

        const beneficiary = await (prisma as any).beneficiary.findUnique({ where: { code: beneficiaryCode } })
        if (!beneficiary) {
          results.push({ row: i + 2, status: 'error', message: `العضو ${beneficiaryCode} غير موجود` })
          continue
        }

        let action = await (prisma as any).impactAction.findFirst({ where: { name: actionName } })
        if (!action) {
          action = await (prisma as any).impactAction.findFirst({ where: { name: { contains: actionName, mode: 'insensitive' } } })
        }
        if (!action) {
          results.push({ row: i + 2, status: 'error', message: `النشاط "${actionName}" غير موجود في الكتالوج` })
          continue
        }

        await (prisma as any).impactLog.create({
          data: {
            beneficiaryId: beneficiary.id,
            actionId: action.id,
            count: Math.max(1, count),
            quality,
            date: new Date(date),
            note: note || null,
            status: 'PENDING_REVIEW',
            sourceType: 'MANUAL',
            platformId: beneficiary.platformId || null,
          },
        })

        results.push({ row: i + 2, status: 'created', message: `${beneficiary.firstName}: ${action.name}` })
        created++
      } catch (e: any) {
        results.push({ row: i + 2, status: 'error', message: e?.message || 'خطأ' })
      }
    }

    return NextResponse.json({ success: true, data: { created, total: rows.length, results } }, { status: 201 })
  } catch (error) {
    console.error('Activity import error:', error)
    return NextResponse.json({ success: false, message: 'خطأ في الاستيراد' }, { status: 500 })
  }
}
