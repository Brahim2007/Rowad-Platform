import { NextRequest, NextResponse } from 'next/server'
import { JourneyStage } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getPlatformScope, requireAuth, verifyPlatformOwnership } from '@/lib/auth-helpers'
import { logger } from '@/lib/logger'
import {
  buildActionMap,
  memberTotal,
  type ImpactActionItem,
  type ImpactLogEntry,
} from '@/lib/impact-scoring'

// ─── Stage order and labels ───
const STAGE_ORDER = ['DISCOVERY', 'APPLICATION', 'ONBOARDING', 'ACTIVE', 'ADVANCED', 'GRADUATED', 'ALUMNI', 'CHAMPION']

const STAGE_LABELS: Record<string, string> = {
  DISCOVERY: 'اكتشاف', APPLICATION: 'تقديم', ONBOARDING: 'تأهيل',
  ACTIVE: 'نشط', ADVANCED: 'متقدم', GRADUATED: 'متخرج',
  ALUMNI: 'خريج', CHAMPION: 'سفير',
}

// ─── Auto-advance logic based on activity ───
function determineStage(beneficiary: {
  status: string
  enrollmentsCount: number
  completedEnrollments: number
  participationsCount: number
  attendedParticipations: number
  impactTotal: number
  impactActiveMonths: number
  hasExcellentImpact: boolean
  hasChampionRole: boolean
}): { stage: string; notes: string } {
  if (beneficiary.status === 'INACTIVE' || beneficiary.status === 'SUSPENDED') {
    return { stage: 'DISCOVERY', notes: 'مستخدم غير نشط — في مرحلة الاكتشاف' }
  }

  // Champion (أعلى مرحلة)
  if (
    beneficiary.hasChampionRole ||
    (beneficiary.impactTotal >= 2000 && beneficiary.impactActiveMonths >= 6 && beneficiary.hasExcellentImpact)
  ) {
    return { stage: 'CHAMPION', notes: `سفير معتمد — أثر تراكمي ${beneficiary.impactTotal} نقطة` }
  }

  // Alumni (خريج نشط في شبكة الخريجين)
  if (
    (beneficiary.completedEnrollments >= 2 && beneficiary.participationsCount >= 10 && beneficiary.attendedParticipations >= 8) ||
    (beneficiary.completedEnrollments >= 1 && beneficiary.impactTotal >= 1000 && beneficiary.impactActiveMonths >= 4)
  ) {
    return { stage: 'ALUMNI', notes: `خريج نشط — أثر مستمر عبر ${beneficiary.impactActiveMonths} أشهر` }
  }

  // Graduated (أكمل برنامجين على الأقل)
  if (beneficiary.completedEnrollments >= 2) {
    return { stage: 'GRADUATED', notes: `متخرج — أكمل ${beneficiary.completedEnrollments} برامج` }
  }

  // Advanced (أكمل برنامجاً واحداً أو مشاركات كثيرة)
  if (beneficiary.completedEnrollments >= 1 || beneficiary.participationsCount >= 5 || beneficiary.impactTotal >= 300) {
    return { stage: 'ADVANCED', notes: `متقدم — ${beneficiary.participationsCount} مشاركات و${beneficiary.impactTotal} نقطة أثر` }
  }

  // Active (مسجل في برنامج ولديه مشاركات)
  if (beneficiary.enrollmentsCount > 0 && beneficiary.participationsCount > 0) {
    return { stage: 'ACTIVE', notes: `نشط — مسجل في ${beneficiary.enrollmentsCount} برامج` }
  }

  // Onboarding (مسجل في برنامج)
  if (beneficiary.enrollmentsCount > 0) {
    return { stage: 'ONBOARDING', notes: 'في مرحلة التأهيل — تم التسجيل في برنامج' }
  }

  // Application (مسجل كعضو)
  return { stage: 'APPLICATION', notes: 'قدّم طلباً — بانتظار التسجيل في برنامج' }
}

function activeImpactMonths(entries: ImpactLogEntry[]) {
  const months = new Set<string>()
  for (const entry of entries) {
    if (entry.status !== 'APPROVED') continue
    const d = new Date(entry.date)
    if (Number.isNaN(d.getTime())) continue
    months.add(`${d.getFullYear()}-${d.getMonth() + 1}`)
  }
  return months.size
}

// ─── GET: Fetch journey for a beneficiary ───
export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const beneficiaryId = searchParams.get('beneficiaryId')
    const scope = getPlatformScope(auth.user)

    if (beneficiaryId) {
      const beneficiary = await prisma.beneficiary.findUnique({ where: { id: beneficiaryId }, select: { platformId: true } })
      if (!beneficiary) return NextResponse.json({ success: false, message: 'العضو غير موجود' }, { status: 404 })
      if (!(await verifyPlatformOwnership(auth.user, beneficiary.platformId))) {
        return NextResponse.json({ success: false, message: 'غير مصرح — خارج نطاق المنصة' }, { status: 403 })
      }
      const stages = await prisma.beneficiaryJourneyStage.findMany({
        where: { beneficiaryId },
        orderBy: { stage: 'asc' },
      })
      return NextResponse.json({ success: true, data: stages })
    }

    // Return all stages grouped by beneficiary
    const allStages = await prisma.beneficiaryJourneyStage.findMany({
      where: scope.filterId ? { beneficiary: { platformId: scope.filterId } } : undefined,
      include: {
        beneficiary: { select: { firstName: true, lastName: true, code: true } },
      },
      orderBy: { startedAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: allStages })
  } catch (error) {
    logger.error('Journey GET error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

// ─── POST: Auto-advance beneficiary journey ───
export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error

  try {
    const { beneficiaryId } = await request.json()
    if (!beneficiaryId) {
      return NextResponse.json({ success: false, message: 'معرف العضو مطلوب' }, { status: 400 })
    }

    // Fetch beneficiary with activity counts
    const [beneficiary, actions] = await Promise.all([
      prisma.beneficiary.findUnique({
        where: { id: beneficiaryId },
        include: {
          _count: {
            select: {
              enrollments: true,
              participations: true,
            },
          },
          enrollments: {
            where: { status: 'COMPLETED' },
            select: { id: true },
          },
          participations: {
            where: { status: { in: ['ATTENDED', 'COMPLETED'] } },
            select: { id: true, status: true },
          },
          impactLogs: {
            where: { status: 'APPROVED' },
            include: { action: true },
          },
        },
      }),
      prisma.impactAction.findMany({ where: { isActive: true } }),
    ])

    if (!beneficiary) {
      return NextResponse.json({ success: false, message: 'العضو غير موجود' }, { status: 404 })
    }
    if (!(await verifyPlatformOwnership(auth.user, beneficiary.platformId))) {
      return NextResponse.json({ success: false, message: 'غير مصرح — خارج نطاق المنصة' }, { status: 403 })
    }

    const hasChampionRole = false // Could be extended with a champion flag
    const actionMap = buildActionMap(actions as ImpactActionItem[])
    const impactEntries = beneficiary.impactLogs.map(log => ({
      ...log,
      action: log.action as ImpactActionItem,
    })) as ImpactLogEntry[]
    const persistedImpactSources = new Set(
      impactEntries
        .filter(e => e.sourceType && e.sourceId)
        .map(e => `${e.sourceType}:${e.sourceId}:${e.actionId}`)
    )
    const operationalImpactTotal =
      beneficiary.participations.reduce((sum, p) => {
        const actionId = p.status === 'COMPLETED' ? '__participation_completed' : '__participation_attended'
        return persistedImpactSources.has(`PARTICIPATION:${p.id}:${actionId}`)
          ? sum
          : sum + (p.status === 'COMPLETED' ? 20 : 10)
      }, 0) +
      beneficiary.enrollments.reduce((sum, e) => (
        persistedImpactSources.has(`ENROLLMENT:${e.id}:__enrollment_completed`) ? sum : sum + 75
      ), 0)
    const impactTotal = memberTotal(impactEntries, actionMap) + operationalImpactTotal

    const { stage: newStage, notes } = determineStage({
      status: beneficiary.status,
      enrollmentsCount: beneficiary._count.enrollments,
      completedEnrollments: beneficiary.enrollments.length,
      participationsCount: beneficiary._count.participations,
      attendedParticipations: beneficiary.participations.length,
      impactTotal,
      impactActiveMonths: activeImpactMonths(impactEntries),
      hasExcellentImpact: impactEntries.some(e => e.quality === 'EXCELLENT' || e.quality === 'EXCEPTIONAL'),
      hasChampionRole,
    })

    // Check current stage
    const currentStages = await prisma.beneficiaryJourneyStage.findMany({
      where: { beneficiaryId },
      orderBy: { stage: 'desc' },
      take: 1,
    })

    const currentStage = currentStages[0]?.stage || null
    const currentStageIdx = currentStage ? STAGE_ORDER.indexOf(currentStage) : -1
    const newStageIdx = STAGE_ORDER.indexOf(newStage)

    // If beneficiary is at a higher stage, don't go back
    if (currentStageIdx >= newStageIdx && currentStage !== null) {
      return NextResponse.json({
        success: true,
        data: {
          stage: currentStage,
          label: STAGE_LABELS[currentStage] || currentStage,
          notes: currentStage === newStage ? notes : currentStages[0]?.notes,
          message: currentStage === newStage ? 'المسار محدث حسب النشاط' : 'العضو بالفعل في مرحلة متقدمة',
        },
      })
    }

    // Create the new stage
    const stage = await prisma.beneficiaryJourneyStage.create({
      data: {
        beneficiaryId,
        stage: newStage as JourneyStage,
        startedAt: new Date(),
        notes,
      },
    })

    // Complete the previous stage
    if (currentStages[0] && !currentStages[0]?.completedAt) {
      await prisma.beneficiaryJourneyStage.update({
        where: { id: currentStages[0].id },
        data: { completedAt: new Date() },
      })
    }

    return NextResponse.json({
      success: true,
      data: { stage: stage.stage, label: STAGE_LABELS[stage.stage] || stage.stage, notes: stage.notes },
    })
  } catch (error) {
    logger.error('Journey API error', error)
    return NextResponse.json({ success: false, message: 'خطأ في تحديث مسار الرحلة' }, { status: 500 })
  }
}

// ─── PUT: Manually set journey stage ───
export async function PUT(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error

  try {
    const body = await request.json()
    const { beneficiaryId, stage, notes } = body

    if (!beneficiaryId || !stage) {
      return NextResponse.json({ success: false, message: 'معرف العضو والمرحلة مطلوبان' }, { status: 400 })
    }

    if (!STAGE_ORDER.includes(stage)) {
      return NextResponse.json({ success: false, message: 'مرحلة غير صالحة' }, { status: 400 })
    }
    const beneficiary = await prisma.beneficiary.findUnique({ where: { id: beneficiaryId }, select: { platformId: true } })
    if (!beneficiary) return NextResponse.json({ success: false, message: 'العضو غير موجود' }, { status: 404 })
    if (!(await verifyPlatformOwnership(auth.user, beneficiary.platformId))) {
      return NextResponse.json({ success: false, message: 'غير مصرح — خارج نطاق المنصة' }, { status: 403 })
    }

    // Complete all existing stages up to and including the new one
    const existingStages = await prisma.beneficiaryJourneyStage.findMany({
      where: { beneficiaryId },
    })

    const newStageIdx = STAGE_ORDER.indexOf(stage)

    for (const existing of existingStages) {
      const existingIdx = STAGE_ORDER.indexOf(existing.stage)
      if (existingIdx <= newStageIdx && !existing.completedAt) {
        await prisma.beneficiaryJourneyStage.update({
          where: { id: existing.id },
          data: { completedAt: new Date() },
        })
      }
    }

    // Check if stage already exists
    const existingStage = existingStages.find(s => s.stage === stage)
    if (existingStage) {
      return NextResponse.json({
        success: true,
        data: { stage: existingStage.stage, label: STAGE_LABELS[stage] || stage, message: 'المرحلة موجودة مسبقاً' },
      })
    }

    // Create new stage
    const newStage = await prisma.beneficiaryJourneyStage.create({
      data: {
        beneficiaryId,
        stage: stage as JourneyStage,
        startedAt: new Date(),
        completedAt: null,
        notes: notes || `تم الانتقال يدوياً إلى مرحلة "${STAGE_LABELS[stage] || stage}"`,
      },
    })

    return NextResponse.json({
      success: true,
      data: { stage: newStage.stage, label: STAGE_LABELS[stage] || stage },
    })
  } catch (error) {
    logger.error('Journey PUT error', error)
    return NextResponse.json({ success: false, message: 'خطأ في تحديث المسار' }, { status: 500 })
  }
}
