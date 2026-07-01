/**
 * Sync تلقائي من Participation/Enrollment → ImpactLog
 *
 * عند إنشاء/تحديث مشاركة أو تسجيل بحالة مستحقة، يُنشأ سجل أثر تلقائياً
 * مع منع التضاعف عبر القيد الفريد (sourceType, sourceId, actionId).
 *
 * لا يستدعي Dashboard API — يُكتب مباشرة في قاعدة البيانات.
 */

import { prisma } from '@/lib/prisma'
import type { ImpactSourceType, ImpactQuality } from '@/lib/impact-scoring'

// ═══════════════════════════════════════════════════
// إعدادات النقاط التشغيلية الافتراضية
// ═══════════════════════════════════════════════════

const OPERATIONAL_ACTIONS = {
  participation_attended: {
    actionId: '__participation_attended',
    sourceType: 'PARTICIPATION' as ImpactSourceType,
    quality: 'ACCEPTABLE' as ImpactQuality,
    status: 'APPROVED' as const,
  },
  participation_completed: {
    actionId: '__participation_completed',
    sourceType: 'PARTICIPATION' as ImpactSourceType,
    quality: 'GOOD' as ImpactQuality,
    status: 'APPROVED' as const,
  },
  enrollment_completed: {
    actionId: '__enrollment_completed',
    sourceType: 'ENROLLMENT' as ImpactSourceType,
    quality: 'GOOD' as ImpactQuality,
    status: 'APPROVED' as const,
  },
}

// ═══════════════════════════════════════════════════
// Sync — Participation
// ═══════════════════════════════════════════════════

interface SyncParticipationParams {
  id: string           // participation.id
  beneficiaryId: string
  status: string       // ATTENDED | COMPLETED
  platformId: string
  platformName?: string
  programId: string
  activityId: string
  activityName: string
  attendedAt?: Date | string | null
  activityStartDate?: Date | string | null
  createdAt?: Date | string
}

export async function syncParticipation(params: SyncParticipationParams): Promise<void> {
  const {
    id, beneficiaryId, status, platformId, platformName,
    programId, activityId, activityName, attendedAt, activityStartDate, createdAt,
  } = params

  const configKey = status === 'COMPLETED' ? 'participation_completed' : 'participation_attended'
  const config = OPERATIONAL_ACTIONS[configKey]
  if (!config) return  // لا sync لحالة غير معروفة

  const dateVal = attendedAt || activityStartDate || createdAt || new Date()

  // منع التضاعف عبر upsert على القيد الفريد (sourceType + sourceId + actionId)
  await prisma.impactLog.upsert({
    where: {
      sourceType_sourceId_actionId: {
        sourceType: config.sourceType,
        sourceId: id,
        actionId: config.actionId,
      },
    },
    create: {
      beneficiaryId,
      actionId: config.actionId,
      sourceType: config.sourceType,
      sourceId: id,
      count: 1,
      quality: config.quality,
      status: config.status,
      date: dateVal,
      note: activityName,
      platformId,
      programId,
      activityId,
      participationId: id,
      pointsSnapshot: null,  // يُحتسب عند الاعتماد
      createdBy: 'SYSTEM',
    },
    update: {
      // لا نعدّل إلا إذا تغيّرت الحالة (مثلاً من ATTENDED إلى COMPLETED)
      ...(status === 'COMPLETED' ? {
        actionId: OPERATIONAL_ACTIONS.participation_completed.actionId,
        quality: OPERATIONAL_ACTIONS.participation_completed.quality,
      } : {}),
      date: dateVal,
      note: activityName,
    },
  })
}

// ═══════════════════════════════════════════════════
// Sync — Enrollment
// ═══════════════════════════════════════════════════

interface SyncEnrollmentParams {
  id: string           // enrollment.id
  beneficiaryId: string
  status: string       // COMPLETED only triggers sync
  platformId: string
  platformName?: string
  programId: string
  programName: string
  completedAt?: Date | string | null
  updatedAt?: Date | string
}

export async function syncEnrollment(params: SyncEnrollmentParams): Promise<void> {
  const { id, beneficiaryId, status, platformId, programId, programName, completedAt, updatedAt } = params

  if (status !== 'COMPLETED') return  // لا sync إلا للإكمال

  const config = OPERATIONAL_ACTIONS.enrollment_completed
  const dateVal = completedAt || updatedAt || new Date()

  await prisma.impactLog.upsert({
    where: {
      sourceType_sourceId_actionId: {
        sourceType: config.sourceType,
        sourceId: id,
        actionId: config.actionId,
      },
    },
    create: {
      beneficiaryId,
      actionId: config.actionId,
      sourceType: config.sourceType,
      sourceId: id,
      count: 1,
      quality: config.quality,
      status: config.status,
      date: dateVal,
      note: programName,
      platformId,
      programId,
      enrollmentId: id,
      pointsSnapshot: null,
      createdBy: 'SYSTEM',
    },
    update: {
      date: dateVal,
      note: programName,
    },
  })
}

// ═══════════════════════════════════════════════════
// Sync — حذف (إزالة السجل التلقائي عند حذف/إلغاء المصدر)
// ═══════════════════════════════════════════════════

export async function unsyncParticipation(participationId: string): Promise<void> {
  await prisma.impactLog.deleteMany({
    where: {
      sourceType: 'PARTICIPATION',
      sourceId: participationId,
    },
  })
}

export async function unsyncEnrollment(enrollmentId: string): Promise<void> {
  await prisma.impactLog.deleteMany({
    where: {
      sourceType: 'ENROLLMENT',
      sourceId: enrollmentId,
    },
  })
}
