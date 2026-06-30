/**
 * API: البوابات الشهرية (Monthly Gates)
 * GET  — جلب بوابات عضو أو كل البوابات لشهر/سنة
 * POST — تعيين/تعديل حالة بوابة
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
    const year = searchParams.get('year') || ''
    const month = searchParams.get('month') || ''

    const gates = await prisma.impactGate.findMany({
      where: {
        ...(beneficiaryId && { beneficiaryId }),
        ...(year && { year: Number(year) }),
        ...(month && { month: Number(month) }),
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    })

    return NextResponse.json({ success: true, data: gates })
  } catch (error) {
    console.error('ImpactGates GET error:', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authError = await checkAuth()
  if (authError) return authError

  try {
    const body = await request.json()
    const beneficiaryId = String(body.beneficiaryId || '').trim()
    const year = Number(body.year)
    const month = Number(body.month)

    if (!beneficiaryId || !year || !month) {
      return NextResponse.json({ success: false, message: 'العضو والسنة والشهر مطلوبة' }, { status: 400 })
    }

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
  } catch (error: any) {
    console.error('ImpactGates POST error:', error)
    return NextResponse.json({ success: false, message: error.message || 'خطأ في الحفظ' }, { status: 500 })
  }
}
