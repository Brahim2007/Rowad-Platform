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
  { params }: { params: Promise<{ slug: string }> }
) {
  const authError = await checkAuth()
  if (authError) return authError

  try {
    const { slug } = await params
    const platform = await prisma.platform.findUnique({
      where: { slug },
      include: {
        programs: {
          orderBy: { sortOrder: 'asc' },
          include: {
            activities: { orderBy: { sortOrder: 'asc' } },
            _count: {
              select: {
                enrollments: true,
                projects: true,
                knowledgeItems: true,
                submittedReports: true,
              },
            },
          },
        },
        projects: {
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
          select: {
            id: true,
            title: true,
            slug: true,
            category: true,
            status: true,
            isFeatured: true,
            programId: true,
            program: { select: { id: true, name: true, slug: true } },
          },
        },
        platformIndicators: {
          orderBy: { recordedAt: 'desc' },
          take: 8,
        },
      },
    })

    if (!platform) {
      return NextResponse.json({ success: false, message: 'المنصة غير موجودة' }, { status: 404 })
    }

    const programIds = platform.programs.map(program => program.id)
    const activityIds = platform.programs.flatMap(program => program.activities.map(activity => activity.id))

    const [enrollments, participations] = await Promise.all([
      programIds.length
        ? prisma.enrollment.findMany({
            where: { programId: { in: programIds } },
            orderBy: { enrolledAt: 'desc' },
            include: {
              program: { select: { id: true, name: true, slug: true } },
              beneficiary: {
                select: {
                  id: true,
                  code: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  country: true,
                  city: true,
                  status: true,
                  type: true,
                  role: true,
                  beneficiaryJourneyStages: {
                    select: { stage: true },
                  },
                },
              },
            },
          })
        : Promise.resolve([]),
      activityIds.length
        ? prisma.participation.findMany({
            where: { activityId: { in: activityIds } },
            include: {
              beneficiary: {
                select: {
                  id: true,
                  code: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  country: true,
                  city: true,
                  status: true,
                  type: true,
                  role: true,
                  beneficiaryJourneyStages: {
                    select: { stage: true },
                  },
                },
              },
              activity: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  program: { select: { id: true, name: true, slug: true } },
                },
              },
            },
          })
        : Promise.resolve([]),
    ])

    const members = new Map<string, {
      id: string
      code: string
      name: string
      email: string | null
      country: string | null
      city: string | null
      status: string
      type: string
      role: string | null
      currentStage: string | null
      programs: Map<string, { id: string; name: string; slug: string }>
      enrollmentsCount: number
      completedEnrollments: number
      participationsCount: number
      attendedParticipations: number
    }>()

    for (const enrollment of enrollments) {
      const beneficiary = enrollment.beneficiary
      if (!members.has(beneficiary.id)) {
        members.set(beneficiary.id, {
          id: beneficiary.id,
          code: beneficiary.code,
          name: `${beneficiary.firstName} ${beneficiary.lastName}`.trim(),
          email: beneficiary.email,
          country: beneficiary.country,
          city: beneficiary.city,
          status: beneficiary.status,
          type: beneficiary.type,
          role: beneficiary.role,
          currentStage: latestStage(beneficiary.beneficiaryJourneyStages),
          programs: new Map(),
          enrollmentsCount: 0,
          completedEnrollments: 0,
          participationsCount: 0,
          attendedParticipations: 0,
        })
      }

      const member = members.get(beneficiary.id)!
      member.programs.set(enrollment.program.id, enrollment.program)
      member.enrollmentsCount += 1
      if (enrollment.status === 'COMPLETED') member.completedEnrollments += 1
    }

    for (const participation of participations) {
      const beneficiary = participation.beneficiary
      if (!members.has(beneficiary.id)) {
        members.set(beneficiary.id, {
          id: beneficiary.id,
          code: beneficiary.code,
          name: `${beneficiary.firstName} ${beneficiary.lastName}`.trim(),
          email: beneficiary.email,
          country: beneficiary.country,
          city: beneficiary.city,
          status: beneficiary.status,
          type: beneficiary.type,
          role: beneficiary.role,
          currentStage: latestStage(beneficiary.beneficiaryJourneyStages),
          programs: new Map(),
          enrollmentsCount: 0,
          completedEnrollments: 0,
          participationsCount: 0,
          attendedParticipations: 0,
        })
      }

      const member = members.get(beneficiary.id)!
      member.programs.set(participation.activity.program.id, participation.activity.program)
      member.participationsCount += 1
      if (participation.status === 'ATTENDED' || participation.status === 'COMPLETED') {
        member.attendedParticipations += 1
      }
    }

    const membersList = Array.from(members.values()).map(member => ({
      ...member,
      programs: Array.from(member.programs.values()),
    }))

    return NextResponse.json({
      success: true,
      data: {
        platform,
        stats: {
          programs: platform.programs.length,
          activities: platform.programs.reduce((sum, program) => sum + program.activities.length, 0),
          members: membersList.length,
          activeMembers: membersList.filter(member => member.status === 'ACTIVE').length,
          enrollments: enrollments.length,
          completedEnrollments: enrollments.filter(enrollment => enrollment.status === 'COMPLETED').length,
          participations: participations.length,
          projects: platform.projects.length,
        },
        members: membersList,
      },
    })
  } catch (error) {
    console.error('Platform detail API error:', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}
