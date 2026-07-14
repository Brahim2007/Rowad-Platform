/**
 * API: البوابات الشهرية (Monthly Gates)
 * GET  — جلب بوابات عضو أو كل البوابات لشهر/سنة
 * POST — تعيين/تعديل حالة بوابة
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPlatformScope, requireAuth, verifyPlatformOwnership, type SessionUser } from '@/lib/auth-helpers'
import { logger } from '@/lib/logger'

async function verifyBeneficiaryScope(user: SessionUser, beneficiaryId: string) {
  const beneficiary = await prisma.beneficiary.findUnique({ where: { id: beneficiaryId }, select: { platformId: true } })
  if (!beneficiary) return NextResponse.json({ success: false, message: 'العضو غير موجود' }, { status: 404 })
  if (!(await verifyPlatformOwnership(user, beneficiary.platformId))) {
    return NextResponse.json({ success: false, message: 'غير مصرح — خارج نطاق المنصة' }, { status: 403 })
  }
  return null
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error

  try {
    const scope = getPlatformScope(auth.user)
    const { searchParams } = new URL(request.url)
    const beneficiaryId = searchParams.get('beneficiaryId') || ''
    const year = searchParams.get('year') || ''
    const month = searchParams.get('month') || ''

    const gates = await prisma.impactGate.findMany({
      where: {
        ...(beneficiaryId && { beneficiaryId }),
        ...(year && { year: Number(year) }),
        ...(month && { month: Number(month) }),
        ...(scope.filterId && { beneficiary: { platformId: scope.filterId } }),
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    })

    return NextResponse.json({ success: true, data: gates })
  } catch (error) {
    logger.error('ImpactGates GET error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error

  try {
    const body = await request.json()
    const beneficiaryId = String(body.beneficiaryId || '').trim()
    const year = Number(body.year)
    const month = Number(body.month)

    if (!beneficiaryId || !year || !month) {
      return NextResponse.json({ success: false, message: 'العضو والسنة والشهر مطلوبة' }, { status: 400 })
    }
    const scopeError = await verifyBeneficiaryScope(auth.user, beneficiaryId)
    if (scopeError) return scopeError

    // Upsert: ينشئ إذا لم يوجد، ويعدّل إذا وجد
    const gate = await prisma.impactGate.upsert({
      where: {
        beneficiaryId_year_month: {
          beneficiaryId,
          year,
          month,
        },
      },
      create: {
        beneficiaryId,
        year,
        month,
        passed: body.passed !== undefined ? Boolean(body.passed) : true,
      },
      update: {
        passed: body.passed !== undefined ? Boolean(body.passed) : true,
      },
    })

    return NextResponse.json({ success: true, data: gate })
  } catch (error) {
    logger.error('ImpactGates POST error', error)
    const message = error instanceof Error ? error.message : 'خطأ في الحفظ'
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}
