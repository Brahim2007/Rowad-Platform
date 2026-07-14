/**
 * API: إعدادات لوحة الأثر (Impact Settings)
 * GET  — جلب الإعدادات الحالية
 * PUT  — تحديث الإعدادات
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, type SessionUser } from '@/lib/auth-helpers'
import { logger } from '@/lib/logger'
import {
  QUALITY_BONUS,
  DEFAULT_LEVELS,
  DEFAULT_REWARD_TIERS,
  DEFAULT_UMRAH,
} from '@/lib/impact-scoring'

function requireGlobalImpactSettings(user: SessionUser) {
  if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, message: 'غير مصرح — إعدادات الأثر متاحة للإدارة فقط' }, { status: 403 })
  }
  return null
}

/** ضمان وجود صف الإعدادات في قاعدة البيانات */
async function ensureSettings() {
  let settings = await prisma.impactSettings.findUnique({ where: { id: 1 } })
  if (!settings) {
    settings = await prisma.impactSettings.create({
      data: {
        id: 1,
        qualityBonus: JSON.stringify(QUALITY_BONUS),
        levels: JSON.stringify(DEFAULT_LEVELS),
        rewardTiers: JSON.stringify(DEFAULT_REWARD_TIERS),
        umrah: JSON.stringify(DEFAULT_UMRAH),
      },
    })
  }
  return settings
}

export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error

  try {
    const settings = await ensureSettings()

    return NextResponse.json({
      success: true,
      data: {
        qualityBonus: JSON.parse(settings.qualityBonus),
        levels: JSON.parse(settings.levels),
        rewardTiers: JSON.parse(settings.rewardTiers),
        umrah: JSON.parse(settings.umrah),
      },
    })
  } catch (error) {
    logger.error('ImpactSettings GET error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error
  const authError = requireGlobalImpactSettings(auth.user)
  if (authError) return authError

  try {
    const body = await request.json()
    await ensureSettings()

    const settings = await prisma.impactSettings.update({
      where: { id: 1 },
      data: {
        ...(body.qualityBonus && { qualityBonus: JSON.stringify(body.qualityBonus) }),
        ...(body.levels && { levels: JSON.stringify(body.levels) }),
        ...(body.rewardTiers && { rewardTiers: JSON.stringify(body.rewardTiers) }),
        ...(body.umrah && { umrah: JSON.stringify(body.umrah) }),
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        qualityBonus: JSON.parse(settings.qualityBonus),
        levels: JSON.parse(settings.levels),
        rewardTiers: JSON.parse(settings.rewardTiers),
        umrah: JSON.parse(settings.umrah),
      },
    })
  } catch (error) {
    logger.error('ImpactSettings PUT error', error)
    const message = error instanceof Error ? error.message : 'خطأ في التحديث'
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}
