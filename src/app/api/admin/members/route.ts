import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { Prisma } from '@prisma/client'
import { UnifiedMemberSchema } from '@/lib/validations/member'
import { z } from 'zod'

async function checkAuth() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })
  }
  return null
}

function typeWhere(type: string): Prisma.BeneficiaryWhereInput['type'] | undefined {
  if (type === 'BENEFICIARY') return { in: ['BENEFICIARY', 'BOTH'] }
  if (type === 'TEAM') return { in: ['TEAM', 'BOTH'] }
  return undefined
}

function nullable(value?: string | null) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function parseDate(value?: string | null) {
  return value ? new Date(value) : null
}

function toMemberData(input: z.infer<typeof UnifiedMemberSchema>) {
  const isTeamLike = input.type === 'TEAM' || input.type === 'BOTH'

  return {
    code: input.code,
    firstName: input.firstName,
    lastName: input.lastName,
    email: nullable(input.email),
    phone: nullable(input.phone),
    gender: nullable(input.gender) as 'MALE' | 'FEMALE' | null,
    birthDate: parseDate(input.birthDate),
    nationality: nullable(input.nationality),
    country: nullable(input.country),
    city: nullable(input.city),
    educationLevel: nullable(input.educationLevel) as
      | 'HIGH_SCHOOL'
      | 'DIPLOMA'
      | 'BACHELOR'
      | 'MASTER'
      | 'DOCTORATE'
      | 'OTHER'
      | null,
    bio: nullable(input.bio),
    avatar: nullable(input.avatar),
    status: input.status,
    type: input.type,
    role: nullable(input.role),
    slug: nullable(input.slug),
    linkedinUrl: nullable(input.linkedinUrl),
    sortOrder: input.sortOrder,
    interests: nullable(input.interests),
    memberSince: isTeamLike ? new Date() : null,
  }
}

function mapMember(
  m: Prisma.BeneficiaryGetPayload<{
    include: {
      _count: { select: { enrollments: true; participations: true } }
      beneficiaryJourneyStages: true
    }
  }>
) {
  return {
    id: m.id,
    code: m.code,
    firstName: m.firstName,
    lastName: m.lastName,
    name: `${m.firstName} ${m.lastName}`.trim(),
    email: m.email,
    phone: m.phone,
    gender: m.gender,
    birthDate: m.birthDate,
    educationLevel: m.educationLevel,
    nationality: m.nationality,
    country: m.country,
    city: m.city,
    bio: m.bio,
    avatar: m.avatar,
    status: m.status,
    registeredAt: m.registeredAt,
    type: m.type,
    role: m.role,
    slug: m.slug,
    linkedinUrl: m.linkedinUrl,
    memberSince: m.memberSince,
    sortOrder: m.sortOrder,
    interests: m.interests,
    currentStage: m.beneficiaryJourneyStages[0]?.stage || null,
    currentStageStartedAt: m.beneficiaryJourneyStages[0]?.startedAt || null,
    enrollmentsCount: m._count.enrollments,
    participationsCount: m._count.participations,
  }
}

export async function GET(request: NextRequest) {
  const authError = await checkAuth()
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || '' // BENEFICIARY, TEAM, or '' for all
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const stage = searchParams.get('stage') || ''

    const where: Prisma.BeneficiaryWhereInput = {}

    const typeFilter = typeWhere(type)
    if (typeFilter) where.type = typeFilter

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { role: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (status) {
      where.status = status as Prisma.BeneficiaryWhereInput['status']
    }

    const members = await prisma.beneficiary.findMany({
      where,
      orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }, { registeredAt: 'desc' }],
      include: {
        _count: { select: { enrollments: true, participations: true } },
        beneficiaryJourneyStages: {
          orderBy: { stage: 'desc' },
          take: 1,
        },
      },
    })

    const mapped = members.map(mapMember).filter(m => !stage || m.currentStage === stage)

    return NextResponse.json({ success: true, data: mapped })
  } catch (error) {
    console.error('Members GET error:', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authError = await checkAuth()
  if (authError) return authError

  try {
    const input = UnifiedMemberSchema.parse(await request.json())
    const member = await prisma.beneficiary.create({
      data: toMemberData(input),
      include: {
        _count: { select: { enrollments: true, participations: true } },
        beneficiaryJourneyStages: true,
      },
    })

    await prisma.beneficiaryJourneyStage.createMany({
      data: [
        {
          beneficiaryId: member.id,
          stage: 'DISCOVERY',
          startedAt: new Date(),
          completedAt: new Date(),
          notes: 'تم إنشاء الملف الموحد للعضو',
        },
        {
          beneficiaryId: member.id,
          stage: 'APPLICATION',
          startedAt: new Date(),
          notes: 'بدأ العضو مسار الانضمام والتطور',
        },
      ],
    })

    return NextResponse.json({ success: true, data: mapMember(member) }, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, errors: error.flatten() }, { status: 400 })
    }
    const e = error as { code?: string }
    if (e.code === 'P2002') {
      return NextResponse.json({ success: false, message: 'الكود أو البريد أو الرابط المختصر مستخدم مسبقاً' }, { status: 409 })
    }
    console.error('Members POST error:', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const authError = await checkAuth()
  if (authError) return authError

  try {
    const body = await request.json()
    const id = body.id
    if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })

    const input = UnifiedMemberSchema.parse(body)
    const previous = await prisma.beneficiary.findUnique({ where: { id }, select: { memberSince: true } })
    const data = toMemberData(input)
    const isTeamLike = input.type === 'TEAM' || input.type === 'BOTH'

    const member = await prisma.beneficiary.update({
      where: { id },
      data: {
        ...data,
        memberSince: isTeamLike ? previous?.memberSince || new Date() : null,
      },
      include: {
        _count: { select: { enrollments: true, participations: true } },
        beneficiaryJourneyStages: {
          orderBy: { stage: 'desc' },
          take: 1,
        },
      },
    })

    return NextResponse.json({ success: true, data: mapMember(member) })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, errors: error.flatten() }, { status: 400 })
    }
    const e = error as { code?: string }
    if (e.code === 'P2002') {
      return NextResponse.json({ success: false, message: 'الكود أو البريد أو الرابط المختصر مستخدم مسبقاً' }, { status: 409 })
    }
    console.error('Members PUT error:', error)
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
  } catch (error) {
    console.error('Members DELETE error:', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}
