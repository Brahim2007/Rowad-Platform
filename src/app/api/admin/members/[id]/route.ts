import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, verifyPlatformOwnership } from '@/lib/auth-helpers'
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

const STAGE_ORDER = ['DISCOVERY', 'APPLICATION', 'ONBOARDING', 'ACTIVE', 'ADVANCED', 'GRADUATED', 'ALUMNI', 'CHAMPION']

function latestStage(stages: { stage: string }[]) {
  return stages.reduce<string | null>((latest, item) => {
    const latestIdx = latest ? STAGE_ORDER.indexOf(latest) : -1
    const itemIdx = STAGE_ORDER.indexOf(item.stage)
    return itemIdx > latestIdx ? item.stage : latest
  }, null)
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireMembersAccess()
  if (!auth.ok) return auth.error

  try {
    const { id } = await params

    const member = await prisma.beneficiary.findUnique({
      where: { id },
      include: {
        _count: { select: { enrollments: true, participations: true } },
        beneficiaryJourneyStages: {
          orderBy: [{ startedAt: 'asc' }, { createdAt: 'asc' }],
        },
        enrollments: {
          orderBy: { enrolledAt: 'desc' },
          include: {
            program: {
              select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                startDate: true,
                endDate: true,
                platform: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    color: true,
                  },
                },
              },
            },
          },
        },
        participations: {
          orderBy: { createdAt: 'desc' },
          include: {
            enrollment: {
              select: {
                id: true,
                status: true,
                programId: true,
              },
            },
            activity: {
              select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                type: true,
                location: true,
                isOnline: true,
                startDate: true,
                endDate: true,
                program: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    platform: {
                      select: {
                        id: true,
                        name: true,
                        slug: true,
                        color: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!member) {
      return NextResponse.json({ success: false, message: 'العضو غير موجود' }, { status: 404 })
    }
    if (!(await verifyPlatformOwnership(auth.user, member.platformId))) {
      return NextResponse.json({ success: false, message: 'غير مصرح — خارج نطاق المنصة' }, { status: 403 })
    }

    const currentStage = latestStage(member.beneficiaryJourneyStages)
    const currentStageRecord = [...member.beneficiaryJourneyStages].reverse().find(stage => stage.stage === currentStage) || null
    const completedEnrollments = member.enrollments.filter(enrollment => enrollment.status === 'COMPLETED').length
    const activeEnrollments = member.enrollments.filter(enrollment => enrollment.status === 'ACTIVE').length
    const attendedParticipations = member.participations.filter(participation =>
      participation.status === 'ATTENDED' || participation.status === 'COMPLETED'
    ).length
    const certificatesCount = member.participations.filter(participation => participation.certificateUrl).length

    const platforms = new Map<string, { id: string; name: string; slug: string; color: string | null }>()
    for (const enrollment of member.enrollments) {
      const platform = enrollment.program.platform
      platforms.set(platform.id, platform)
    }
    for (const participation of member.participations) {
      const platform = participation.activity.program.platform
      platforms.set(platform.id, platform)
    }

    return NextResponse.json({
      success: true,
      data: {
        member: {
          id: member.id,
          code: member.code,
          firstName: member.firstName,
          lastName: member.lastName,
          name: `${member.firstName} ${member.lastName}`.trim(),
          email: member.email,
          phone: member.phone,
          gender: member.gender,
          birthDate: member.birthDate,
          educationLevel: member.educationLevel,
          nationality: member.nationality,
          country: member.country,
          city: member.city,
          bio: member.bio,
          avatar: member.avatar,
          status: member.status,
          registeredAt: member.registeredAt,
          createdAt: member.createdAt,
          updatedAt: member.updatedAt,
          type: member.type,
          role: member.role,
          slug: member.slug,
          linkedinUrl: member.linkedinUrl,
          memberSince: member.memberSince,
          sortOrder: member.sortOrder,
          interests: member.interests,
          platformId: member.platformId,
          currentStage,
          currentStageStartedAt: currentStageRecord?.startedAt || null,
        },
        stats: {
          enrollments: member._count.enrollments,
          activeEnrollments,
          completedEnrollments,
          participations: member._count.participations,
          attendedParticipations,
          certificatesCount,
          platforms: platforms.size,
        },
        platforms: Array.from(platforms.values()),
        journeyStages: member.beneficiaryJourneyStages.map(stage => ({
          id: stage.id,
          stage: stage.stage,
          startedAt: stage.startedAt,
          completedAt: stage.completedAt,
          notes: stage.notes,
        })),
        enrollments: member.enrollments.map(enrollment => ({
          id: enrollment.id,
          status: enrollment.status,
          enrolledAt: enrollment.enrolledAt,
          completedAt: enrollment.completedAt,
          notes: enrollment.notes,
          program: enrollment.program,
        })),
        participations: member.participations.map(participation => ({
          id: participation.id,
          status: participation.status,
          attendedAt: participation.attendedAt,
          score: participation.score,
          feedback: participation.feedback,
          certificateUrl: participation.certificateUrl,
          createdAt: participation.createdAt,
          enrollment: participation.enrollment,
          activity: participation.activity,
        })),
      },
    })
  } catch (error) {
    logger.error('Member detail GET error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

/** تحديث حقول أثر العضو: networkRole, joinDate, impactNote, platformId */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireMembersAccess()
  if (!auth.ok) return auth.error

  try {
    const { id } = await params
    const body = await request.json()
    const current = await prisma.beneficiary.findUnique({ where: { id }, select: { platformId: true } })
    if (!current) return NextResponse.json({ success: false, message: 'العضو غير موجود' }, { status: 404 })
    if (!(await verifyPlatformOwnership(auth.user, current.platformId))) {
      return NextResponse.json({ success: false, message: 'غير مصرح — خارج نطاق المنصة' }, { status: 403 })
    }

    // السماح بتحديث الحقول الأساسية للعضو + حقول الأثر
    const updated = await prisma.beneficiary.update({
      where: { id },
      data: {
        ...(body.firstName !== undefined && { firstName: body.firstName }),
        ...(body.lastName !== undefined && { lastName: body.lastName }),
        ...(body.email !== undefined && { email: body.email || null }),
        ...(body.phone !== undefined && { phone: body.phone || null }),
        ...(body.code !== undefined && { code: body.code }),
        ...(body.status !== undefined && { status: body.status }),
        // حقول الأثر
        ...(body.networkRole !== undefined && { networkRole: body.networkRole || null }),
        ...(body.joinDate !== undefined && { joinDate: body.joinDate ? new Date(body.joinDate) : null }),
        ...(body.impactNote !== undefined && { impactNote: body.impactNote || null }),
        ...(body.platformId !== undefined && {
          platformId: auth.user.role === 'PLATFORM_MANAGER' ? auth.user.platformId : body.platformId || null,
        }),
      },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    const e = error as { code?: string }
    if (e.code === 'P2002') {
      return NextResponse.json({ success: false, message: 'الكود أو البريد مستخدم مسبقاً' }, { status: 409 })
    }
    logger.error('Member PUT error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}
