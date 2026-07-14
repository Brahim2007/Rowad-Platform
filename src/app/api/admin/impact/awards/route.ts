/**
 * API: إدارة الدروع والمكافآت (Impact Awards)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ImpactAwardType } from '@prisma/client'
import { getPlatformScope, requireAuth, verifyPlatformOwnership, type SessionUser } from '@/lib/auth-helpers'
import { logger } from '@/lib/logger'

function parseAwardType(value: unknown): ImpactAwardType | null {
  const type = String(value || '')
  return type === 'SHIELD' || type === 'REWARD' ? type : null
}

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
    const type = parseAwardType(searchParams.get('type'))

    const awards = await prisma.impactAward.findMany({
      where: {
        ...(beneficiaryId && { beneficiaryId }),
        ...(type && { type }),
        ...(scope.filterId && { beneficiary: { platformId: scope.filterId } }),
      },
      orderBy: { date: 'desc' },
      include: {
        beneficiary: {
          select: { id: true, firstName: true, lastName: true, code: true },
        },
      },
    })

    return NextResponse.json({ success: true, data: awards })
  } catch (error) {
    logger.error('ImpactAwards GET error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error

  try {
    const body = await request.json()
    const beneficiaryId = String(body.beneficiaryId || '').trim()
    const title = String(body.title || '').trim()

    if (!beneficiaryId || !title) {
      return NextResponse.json({ success: false, message: 'العضو واسم الدرع/المكافأة مطلوبان' }, { status: 400 })
    }
    const scopeError = await verifyBeneficiaryScope(auth.user, beneficiaryId)
    if (scopeError) return scopeError
    const type = parseAwardType(body.type || 'SHIELD')
    if (!type) return NextResponse.json({ success: false, message: 'نوع الدرع/المكافأة غير صحيح' }, { status: 400 })

    const award = await prisma.impactAward.create({
      data: {
        beneficiaryId,
        type,
        title,
        value: Number(body.value) || 0,
        date: body.date ? new Date(String(body.date)) : new Date(),
        note: body.note?.trim() || null,
      },
      include: {
        beneficiary: { select: { firstName: true, lastName: true } },
      },
    })

    return NextResponse.json({ success: true, data: award }, { status: 201 })
  } catch (error) {
    logger.error('ImpactAwards POST error', error)
    const message = error instanceof Error ? error.message : 'خطأ في الحفظ'
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })
    const award = await prisma.impactAward.findUnique({
      where: { id },
      select: { beneficiary: { select: { platformId: true } } },
    })
    if (!award) return NextResponse.json({ success: false, message: 'العنصر غير موجود' }, { status: 404 })
    if (!(await verifyPlatformOwnership(auth.user, award.beneficiary.platformId))) {
      return NextResponse.json({ success: false, message: 'غير مصرح — خارج نطاق المنصة' }, { status: 403 })
    }

    await prisma.impactAward.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('ImpactAwards DELETE error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الحذف' }, { status: 500 })
  }
}
