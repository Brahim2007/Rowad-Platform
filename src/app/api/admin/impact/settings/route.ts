/**
 * API: إعدادات لوحة الأثر (Impact Settings)
 * GET  — جلب الإعدادات الحالية
 * PUT  — تحديث الإعدادات
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import {
  QUALITY_BONUS,
  DEFAULT_LEVELS,
  DEFAULT_REWARD_TIERS,
  DEFAULT_UMRAH,
} from '@/lib/impact-scoring'

async function checkAuth() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })
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
  const authError = await checkAuth()
  if (authError) return authError

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
    console.error('ImpactSettings GET error:', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const authError = await checkAuth()
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
  } catch (error: any) {
    console.error('ImpactSettings PUT error:', error)
    return NextResponse.json({ success: false, message: error.message || 'خطأ في التحديث' }, { status: 500 })
  }
}
