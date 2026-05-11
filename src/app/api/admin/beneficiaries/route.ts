import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { Prisma } from '@prisma/client'

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
    const search = searchParams.get('search') || ''
    const country = searchParams.get('country') || ''
    const status = searchParams.get('status') || ''
    const stage = searchParams.get('stage') || ''

    const where: Prisma.BeneficiaryWhereInput = {
      type: { in: ['BENEFICIARY', 'BOTH'] },
    }
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (country) where.country = country
    if (status) where.status = status as Prisma.EnumBeneficiaryStatusFilter

    const beneficiaries = await prisma.beneficiary.findMany({
      where,
      orderBy: { registeredAt: 'desc' },
      include: {
        _count: { select: { enrollments: true, participations: true } },
        beneficiaryJourneyStages: {
          orderBy: { stage: 'desc' },
          take: 1,
        },
        enrollments: {
          where: { status: 'COMPLETED' },
          select: { id: true, programId: true },
          take: 5,
        },
      },
    })

    // Journey stage filter (post-filter since it's on related data)
    let filtered = beneficiaries
    if (stage) {
      filtered = beneficiaries.filter(b => {
        const currentStage = b.beneficiaryJourneyStages[0]?.stage
        return currentStage === stage
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        beneficiaries: filtered.map(b => ({
          id: b.id,
          code: b.code,
          firstName: b.firstName,
          lastName: b.lastName,
          email: b.email,
          phone: b.phone,
          gender: b.gender,
          birthDate: b.birthDate,
          educationLevel: b.educationLevel,
          nationality: b.nationality,
          country: b.country,
          city: b.city,
          status: b.status,
          registeredAt: b.registeredAt,
          currentStage: b.beneficiaryJourneyStages[0]?.stage || null,
          currentStageStartedAt: b.beneficiaryJourneyStages[0]?.startedAt || null,
          completedPrograms: b.enrollments.length,
          _count: b._count,
        })),
        total: filtered.length,
      },
    })
  } catch {
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authError = await checkAuth()
  if (authError) return authError

  try {
    const body = await request.json()
    const { code, firstName, lastName, email, phone, gender, birthDate, educationLevel, nationality, country, city } = body

    if (!code || !firstName || !lastName) {
      return NextResponse.json({ success: false, message: 'الكود والاسم مطلوبان' }, { status: 400 })
    }

    // Create the beneficiary
    const beneficiary = await prisma.beneficiary.create({
      data: {
        code, firstName, lastName,
        email: email || null, phone: phone || null,
        gender: gender || null, birthDate: birthDate ? new Date(birthDate) : null,
        educationLevel: educationLevel || null, nationality: nationality || null,
        country: country || null, city: city || null,
      },
    })

    // Auto-create the first journey stage (DISCOVERY → APPLICATION)
    await prisma.beneficiaryJourneyStage.create({
      data: {
        beneficiaryId: beneficiary.id,
        stage: 'APPLICATION',
        startedAt: new Date(),
        notes: 'تم تسجيل المستفيد — مرحلة التقديم',
      },
    })

    // Also mark DISCOVERY as completed
    await prisma.beneficiaryJourneyStage.create({
      data: {
        beneficiaryId: beneficiary.id,
        stage: 'DISCOVERY',
        startedAt: new Date(),
        completedAt: new Date(),
        notes: 'اكتشف المنصة وقدم طلب التسجيل',
      },
    })

    return NextResponse.json({ success: true, data: beneficiary }, { status: 201 })
  } catch (error: unknown) {
    const e = error as { code?: string }
    if (e.code === 'P2002') {
      return NextResponse.json({ success: false, error: 'الكود أو البريد الإلكتروني مستخدم مسبقاً' }, { status: 409 })
    }
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const authError = await checkAuth()
  if (authError) return authError

  try {
    const body = await request.json()
    const { id, code, firstName, lastName, email, phone, gender, birthDate, educationLevel, nationality, country, city, status } = body

    if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })

    const beneficiary = await prisma.beneficiary.update({
      where: { id },
      data: {
        ...(code && { code }),
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        email: email || null,
        phone: phone || null,
        gender: gender || null,
        birthDate: birthDate ? new Date(birthDate) : null,
        educationLevel: educationLevel || null,
        nationality: nationality || null,
        country: country || null,
        city: city || null,
        ...(status && { status }),
      },
    })

    return NextResponse.json({ success: true, data: beneficiary })
  } catch (error: unknown) {
    const e = error as { code?: string }
    if (e.code === 'P2002') {
      return NextResponse.json({ success: false, error: 'الكود أو البريد الإلكتروني مستخدم مسبقاً' }, { status: 409 })
    }
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const authError = await checkAuth()
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })
    await prisma.beneficiary.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}
