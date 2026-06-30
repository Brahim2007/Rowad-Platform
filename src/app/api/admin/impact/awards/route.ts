/**
 * API: إدارة الدروع والمكافآت (Impact Awards)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

async function checkAuth() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })
  }
  return null
}

export async function GET(request: NextRequest) {
  const authError = await checkAuth()
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const beneficiaryId = searchParams.get('beneficiaryId') || ''
    const type = searchParams.get('type') || '' // SHIELD | REWARD

    const awards = await prisma.impactAward.findMany({
      where: {
        ...(beneficiaryId && { beneficiaryId }),
        ...(type && { type: type as any }),
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
    console.error('ImpactAwards GET error:', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authError = await checkAuth()
  if (authError) return authError

  try {
    const body = await request.json()
    const beneficiaryId = String(body.beneficiaryId || '').trim()
    const title = String(body.title || '').trim()

    if (!beneficiaryId || !title) {
      return NextResponse.json({ success: false, message: 'العضو واسم الدرع/المكافأة مطلوبان' }, { status: 400 })
    }

    const award = await prisma.impactAward.create({
      data: {
        beneficiaryId,
        type: String(body.type || 'SHIELD') as any,
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
  } catch (error: any) {
    console.error('ImpactAwards POST error:', error)
    return NextResponse.json({ success: false, message: error.message || 'خطأ في الحفظ' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const authError = await checkAuth()
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })

    await prisma.impactAward.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('ImpactAwards DELETE error:', error)
    return NextResponse.json({ success: false, message: 'خطأ في الحذف' }, { status: 500 })
  }
}
