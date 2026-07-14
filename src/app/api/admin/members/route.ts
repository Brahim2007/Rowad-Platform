import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { UnifiedMemberSchema } from '@/lib/validations/member'
import { sendWelcomeEmail } from '@/lib/email'
import { z } from 'zod'
import { getPlatformScope, platformWhere, requireAuth, verifyPlatformOwnership, type SessionUser } from '@/lib/auth-helpers'
import { logger } from '@/lib/logger'

async function requireMembersAccess() {
  const auth = await requireAuth()
  if (!auth.ok) return auth
  if (auth.user.role === 'EDITOR') {
    return {
      ok: false as const,
      error: NextResponse.json({ success: false, message: 'غير مصرح — الصلاحية محدودة' }, { status: 403 }),
    }
  }
  if (auth.user.role === 'PLATFORM_MANAGER' && !auth.user.platformId) {
    return {
      ok: false as const,
      error: NextResponse.json({ success: false, message: 'مدير المنصة غير مرتبط بمنصة' }, { status: 403 }),
    }
  }
  return auth
}

function scopedMemberData(input: z.infer<typeof UnifiedMemberSchema>, user: SessionUser) {
  const data = toMemberData(input)
  if (user.role === 'PLATFORM_MANAGER') {
    data.platformId = user.platformId
  }
  return data
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
    // حقول الأثر
    networkRole: nullable(input.networkRole),
    joinDate: parseDate(input.joinDate),
    impactNote: nullable(input.impactNote),
    platformId: nullable(input.platformId),
  }
}

type MemberWithAdminIncludes = Prisma.BeneficiaryGetPayload<{
  include: {
    _count: { select: { enrollments: true; participations: true } }
    beneficiaryJourneyStages: true
    platform: { select: { id: true; name: true } }
  }
}>

function mapMember(m: MemberWithAdminIncludes) {
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
    // حقول الأثر
    networkRole: m.networkRole ?? null,
    joinDate: m.joinDate ?? null,
    impactNote: m.impactNote ?? null,
    platformId: m.platformId ?? null,
    platformName: m.platform?.name ?? null,
    currentStage: m.beneficiaryJourneyStages?.[0]?.stage || null,
    currentStageStartedAt: m.beneficiaryJourneyStages?.[0]?.startedAt || null,
    enrollmentsCount: m._count?.enrollments ?? 0,
    participationsCount: m._count?.participations ?? 0,
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireMembersAccess()
  if (!auth.ok) return auth.error

  try {
    const scope = getPlatformScope(auth.user)
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || '' // BENEFICIARY, TEAM, or '' for all
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const stage = searchParams.get('stage') || ''
    const page = Math.max(1, Number(searchParams.get('page')) || 1)
    const pageSizeParam = Number(searchParams.get('pageSize') || searchParams.get('limit')) || 50
    const pageSize = Math.min(Math.max(1, pageSizeParam), 50)
    const includeTotal = searchParams.get('includeTotal') === '1'
    const compact = searchParams.get('compact') === '1'
    const skip = (page - 1) * pageSize

    const where: Prisma.BeneficiaryWhereInput = {
      ...platformWhere(scope),
    }

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

    if (compact) {
      const searchPattern = `%${search}%`
      const clauses = [
        scope.filterId ? Prisma.sql`b."platformId" = ${scope.filterId}` : null,
        type === 'BENEFICIARY' ? Prisma.sql`b.type IN ('BENEFICIARY'::"MemberType", 'BOTH'::"MemberType")` : null,
        type === 'TEAM' ? Prisma.sql`b.type IN ('TEAM'::"MemberType", 'BOTH'::"MemberType")` : null,
        status ? Prisma.sql`b.status = ${status}::"BeneficiaryStatus"` : null,
        search ? Prisma.sql`(
          b."firstName" ILIKE ${searchPattern} OR
          b."lastName" ILIKE ${searchPattern} OR
          b.code ILIKE ${searchPattern} OR
          b.email ILIKE ${searchPattern} OR
          b.role ILIKE ${searchPattern}
        )` : null,
      ].filter(Boolean) as Prisma.Sql[]
      const whereSql = clauses.length ? Prisma.sql`WHERE ${Prisma.join(clauses, ' AND ')}` : Prisma.empty
      const rows = await prisma.$queryRaw<Array<{
        id: string
        code: string
        firstName: string
        lastName: string
        email: string | null
        phone: string | null
        status: string
        registeredAt: Date
        type: string
        networkRole: string | null
        joinDate: Date | null
        impactNote: string | null
        platformId: string | null
        platformName: string | null
      }>>(Prisma.sql`
        SELECT
          b.id,
          b.code,
          b."firstName",
          b."lastName",
          b.email,
          b.phone,
          b.status,
          b."registeredAt",
          b.type,
          b."networkRole",
          b."joinDate",
          b."impactNote",
          b."platformId",
          p.name AS "platformName"
        FROM "beneficiaries" b
        LEFT JOIN "platforms" p ON p.id = b."platformId"
        ${whereSql}
        ORDER BY b.type ASC, b."sortOrder" ASC, b."registeredAt" DESC
        LIMIT ${pageSize + 1}
        OFFSET ${skip}
      `)
      const hasMore = rows.length > pageSize
      const members = (hasMore ? rows.slice(0, pageSize) : rows)
        .map(row => ({
          id: row.id,
          code: row.code,
          firstName: row.firstName,
          lastName: row.lastName,
          name: `${row.firstName} ${row.lastName}`.trim(),
          email: row.email,
          phone: row.phone,
          status: row.status,
          registeredAt: row.registeredAt,
          type: row.type,
          networkRole: row.networkRole,
          joinDate: row.joinDate,
          impactNote: row.impactNote,
          platformId: row.platformId,
          platformName: row.platformName,
          currentStage: null,
          currentStageStartedAt: null,
          enrollmentsCount: 0,
          participationsCount: 0,
        }))
        .filter((m) => !stage || m.currentStage === stage)
      const total = includeTotal ? await prisma.beneficiary.count({ where }) : null

      return NextResponse.json({
        success: true,
        data: members,
        pagination: {
          page,
          pageSize,
          limit: pageSize,
          hasMore,
          total,
          totalPages: total === null ? null : Math.ceil(total / pageSize),
        },
      })
    }

    const relationArgs = Prisma.validator<Prisma.BeneficiaryDefaultArgs>()({
      include: {
        _count: { select: { enrollments: true, participations: true } },
        beneficiaryJourneyStages: {
          orderBy: { stage: 'desc' },
          take: 1,
        },
        platform: { select: { id: true, name: true } },
      },
    })

    const rows = await prisma.beneficiary.findMany({
      where,
      orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }, { registeredAt: 'desc' }],
      skip,
      take: pageSize + 1,
      ...relationArgs,
    })

    const hasMore = rows.length > pageSize
    const members = hasMore ? rows.slice(0, pageSize) : rows
    const total = includeTotal ? await prisma.beneficiary.count({ where }) : null
    const mapped = members.map(mapMember).filter((m) => !stage || m.currentStage === stage)

    return NextResponse.json({
      success: true,
      data: mapped,
      pagination: {
        page,
        pageSize,
        limit: pageSize,
        hasMore,
        total,
        totalPages: total === null ? null : Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    logger.error('Members GET error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireMembersAccess()
  if (!auth.ok) return auth.error

  try {
    const input = UnifiedMemberSchema.parse(await request.json())
    // توليد كلمة مرور مؤقتة إن وُجد بريد إلكتروني
    const memberEmail = input.email?.trim() || null
    const tempPassword = memberEmail ? (Math.random().toString(36).slice(2, 10) + 'A1!') : null
    const passwordHash = tempPassword ? await bcrypt.hash(tempPassword, 12) : null

    const member = await prisma.beneficiary.create({
      data: {
        ...scopedMemberData(input, auth.user),
        ...(passwordHash ? { passwordHash, mustChangePassword: true } : {}),
      },
      include: {
        _count: { select: { enrollments: true, participations: true } },
        beneficiaryJourneyStages: true,
        platform: { select: { id: true, name: true } },
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

    // إرسال بريد ترحيبي إن وُجد بريد إلكتروني للعضو
    if (member.email && tempPassword) {
      try {
        const platformName = member.platform?.name || 'شبكة رواد'
        const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/ar/member/login`
        await sendWelcomeEmail({
          to: member.email,
          memberName: `${member.firstName} ${member.lastName}`.trim(),
          platformName,
          tempPassword,
          loginUrl,
        })
      } catch (e) {
        logger.error('[email] failed to send welcome email', e)
      }
    }

    return NextResponse.json({ success: true, data: mapMember(member) }, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, errors: error.flatten() }, { status: 400 })
    }
    const e = error as { code?: string }
    if (e.code === 'P2002') {
      return NextResponse.json({ success: false, message: 'الكود أو البريد أو الرابط المختصر مستخدم مسبقاً' }, { status: 409 })
    }
    logger.error('Members POST error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireMembersAccess()
  if (!auth.ok) return auth.error

  try {
    const body = await request.json()
    const id = body.id
    if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })

    const input = UnifiedMemberSchema.parse(body)
    const previous = await prisma.beneficiary.findUnique({ where: { id }, select: { memberSince: true, platformId: true } })
    if (!previous) return NextResponse.json({ success: false, message: 'العضو غير موجود' }, { status: 404 })
    if (!(await verifyPlatformOwnership(auth.user, previous.platformId))) {
      return NextResponse.json({ success: false, message: 'غير مصرح — خارج نطاق المنصة' }, { status: 403 })
    }
    const data = scopedMemberData(input, auth.user)
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
        platform: { select: { id: true, name: true } },
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
    logger.error('Members PUT error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireMembersAccess()
  if (!auth.ok) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })

    const member = await prisma.beneficiary.findUnique({ where: { id }, select: { platformId: true } })
    if (!member) return NextResponse.json({ success: false, message: 'العضو غير موجود' }, { status: 404 })
    if (!(await verifyPlatformOwnership(auth.user, member.platformId))) {
      return NextResponse.json({ success: false, message: 'غير مصرح — خارج نطاق المنصة' }, { status: 403 })
    }

    await prisma.beneficiary.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Members DELETE error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}
