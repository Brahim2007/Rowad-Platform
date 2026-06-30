/**
 * API: إدارة كتالوج أنواع الأنشطة (Impact Actions Catalog)
 * المسارات: GET /api/admin/impact/actions
 *           POST /api/admin/impact/actions  — إضافة
 *           PUT /api/admin/impact/actions  — تعديل
 *           DELETE /api/admin/impact/actions?id=...  — حذف
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

    const action = await prisma.impactAction.create({
      data: {
        name,
        points: Number(body.points) || 0,
        category: String(body.category || 'DIGITAL_ACTIVITY') as any,
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

export async function DELETE(request: NextRequest) {
  const authError = await checkAuth()
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })

    await prisma.impactAction.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('ImpactActions DELETE error:', error)
    return NextResponse.json({ success: false, message: 'خطأ في الحذف' }, { status: 500 })
  }
}
