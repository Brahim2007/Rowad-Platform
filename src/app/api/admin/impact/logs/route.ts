/**
 * API: سجل الأنشطة والمساهمات (Impact Log)
 * المسارات: GET  /api/admin/impact/logs — عرض السجل
 *           POST /api/admin/impact/logs — تسجيل نشاط جديد
 *           PUT  /api/admin/impact/logs — تعديل
 *           DELETE /api/admin/impact/logs?id=... — حذف
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { recordActivityLog } from '@/lib/activity-log'

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
    const status = searchParams.get('status') || ''
    const category = searchParams.get('category') || ''
    const limit = Math.min(Number(searchParams.get('limit')) || 500, 2000)

    const logs = await prisma.impactLog.findMany({
      where: {
        ...(beneficiaryId && { beneficiaryId }),
        ...(status && { status: status as any }),
        ...(category && { action: { category: category as any } }),
      },
      orderBy: { date: 'desc' },
      take: limit,
      include: {
        action: true,
        beneficiary: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            code: true,
            networkRole: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, data: logs })
  } catch (error) {
    console.error('ImpactLogs GET error:', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authError = await checkAuth()
  if (authError) return authError

  try {
    const body = await request.json()
    const beneficiaryId = String(body.beneficiaryId || '').trim()
    const actionId = String(body.actionId || '').trim()

    if (!beneficiaryId || !actionId) {
      return NextResponse.json({ success: false, message: 'العضو ونوع النشاط مطلوبان' }, { status: 400 })
    }

    const log = await prisma.impactLog.create({
      data: {
        beneficiaryId,
        actionId,
        count: Number(body.count) || 1,
        quality: String(body.quality || 'ACCEPTABLE') as any,
        status: String(body.status || 'PENDING_REVIEW') as any,
        date: body.date ? new Date(String(body.date)) : new Date(),
        link: body.link?.trim() || null,
        note: body.note?.trim() || null,
        createdBy: body.createdBy?.trim() || null,
      },
      include: { action: true, beneficiary: { select: { firstName: true, lastName: true } } },
    })

    const session = await auth()
    await recordActivityLog({
      entity: 'impactLog',
      entityId: log.id,
      action: 'CREATE',
      actor: session?.user?.email || session?.user?.name,
      changes: body,
    })

    return NextResponse.json({ success: true, data: log }, { status: 201 })
  } catch (error: any) {
    console.error('ImpactLogs POST error:', error)
    return NextResponse.json({ success: false, message: error.message || 'خطأ في الحفظ' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const authError = await checkAuth()
  if (authError) return authError

  try {
    const body = await request.json()
    const id = String(body.id || '')
    if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })

    const log = await prisma.impactLog.update({
      where: { id },
      data: {
        actionId: body.actionId || undefined,
        count: body.count !== undefined ? Number(body.count) : undefined,
        quality: body.quality || undefined,
        status: body.status || undefined,
        date: body.date ? new Date(String(body.date)) : undefined,
        link: body.link?.trim() ?? undefined,
        note: body.note?.trim() ?? undefined,
      },
      include: { action: true, beneficiary: { select: { firstName: true, lastName: true } } },
    })

    const session = await auth()
    await recordActivityLog({
      entity: 'impactLog',
      entityId: log.id,
      action: 'UPDATE',
      actor: session?.user?.email || session?.user?.name,
      changes: body,
    })

    return NextResponse.json({ success: true, data: log })
  } catch (error: any) {
    console.error('ImpactLogs PUT error:', error)
    return NextResponse.json({ success: false, message: error.message || 'خطأ في التحديث' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const authError = await checkAuth()
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })

    await prisma.impactLog.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('ImpactLogs DELETE error:', error)
    return NextResponse.json({ success: false, message: 'خطأ في الحذف' }, { status: 500 })
  }
}
