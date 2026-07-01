/**
 * API: إدارة كتالوج أنواع الأنشطة (Impact Actions Catalog)
 * GET    /api/admin/impact/actions — عرض
 * POST   /api/admin/impact/actions — إضافة
 * PUT    /api/admin/impact/actions — تعديل
 * DELETE /api/admin/impact/actions?id=... — تعطيل (لا حذف إن كان مستخدماً)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

const VALID_CATEGORIES = ['DIGITAL_ACTIVITY', 'SCIENTIFIC_EVENTS', 'INITIATIVES', 'DISCIPLINE']

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
    const category = searchParams.get('category') || ''
    const onlyActive = searchParams.get('activeOnly') !== 'false'

    const actions = await prisma.impactAction.findMany({
      where: {
        ...(category && { category: category as any }),
        ...(onlyActive && { isActive: true }),
      },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    })

    return NextResponse.json({ success: true, data: actions })
  } catch (error) {
    console.error('ImpactActions GET error:', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authError = await checkAuth()
  if (authError) return authError

  try {
    const body = await request.json()
    const name = String(body.name || '').trim()
    if (!name) return NextResponse.json({ success: false, message: 'الاسم مطلوب' }, { status: 400 })

    const points = Number(body.points)
    const category = String(body.category || 'DIGITAL_ACTIVITY')

    // Validation
    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ success: false, message: 'المحور غير صحيح' }, { status: 400 })
    }
    if (points < 0) {
      return NextResponse.json({ success: false, message: 'النقاط لا يمكن أن تكون سالبة — استخدم القيم الموجبة فقط' }, { status: 400 })
    }
    if (name.length < 2 || name.length > 200) {
      return NextResponse.json({ success: false, message: 'اسم النشاط يجب أن يكون بين 2 و 200 حرف' }, { status: 400 })
    }

    const action = await prisma.impactAction.create({
      data: {
        name,
        points,
        category: category as any,
        note: body.note?.trim() || null,
        sortOrder: Number(body.sortOrder) || 0,
      },
    })

    return NextResponse.json({ success: true, data: action }, { status: 201 })
  } catch (error) {
    console.error('ImpactActions POST error:', error)
    return NextResponse.json({ success: false, message: 'خطأ في الحفظ' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const authError = await checkAuth()
  if (authError) return authError

  try {
    const body = await request.json()
    const id = String(body.id || '')
    if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })

    // Validation إن مررت القيم الجديدة
    if (body.points !== undefined && Number(body.points) < 0) {
      return NextResponse.json({ success: false, message: 'النقاط لا يمكن أن تكون سالبة' }, { status: 400 })
    }
    if (body.category && !VALID_CATEGORIES.includes(body.category)) {
      return NextResponse.json({ success: false, message: 'المحور غير صحيح' }, { status: 400 })
    }
    if (body.name !== undefined && (body.name.trim().length < 2 || body.name.trim().length > 200)) {
      return NextResponse.json({ success: false, message: 'اسم النشاط يجب أن يكون بين 2 و 200 حرف' }, { status: 400 })
    }

    const action = await prisma.impactAction.update({
      where: { id },
      data: {
        name: body.name?.trim(),
        points: body.points !== undefined ? Number(body.points) : undefined,
        category: body.category || undefined,
        note: body.note?.trim() ?? undefined,
        sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : undefined,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
      },
    })

    return NextResponse.json({ success: true, data: action })
  } catch (error: any) {
    console.error('ImpactActions PUT error:', error)
    return NextResponse.json({ success: false, message: error.message || 'خطأ في التحديث' }, { status: 500 })
  }
}

/** DELETE = تعطيل لا حذف فعلي إن كان النوع مستخدماً في سجلات */
export async function DELETE(request: NextRequest) {
  const authError = await checkAuth()
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })

    // فحص إن كان النوع مستخدماً في سجلات أثر
    const usageCount = await prisma.impactLog.count({ where: { actionId: id } })

    if (usageCount > 0) {
      // تعطيل بدل الحذف
      await prisma.impactAction.update({ where: { id }, data: { isActive: false } })
      return NextResponse.json({ success: true, message: `تم تعطيل النوع (مستخدم في ${usageCount} سجل)` })
    }

    // لا يوجد سجلات — حذف فعلي
    await prisma.impactAction.delete({ where: { id } })
    return NextResponse.json({ success: true, message: 'تم حذف النوع' })
  } catch (error: any) {
    console.error('ImpactActions DELETE error:', error)
    return NextResponse.json({ success: false, message: error.message || 'خطأ في الحذف' }, { status: 500 })
  }
}
