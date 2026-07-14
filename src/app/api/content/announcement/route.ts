import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSuperAdmin } from '@/lib/auth-helpers'
import { logger } from '@/lib/logger'

const DEFAULT_BANNER_KEY = 'site_announcement'

/** Public: جلب اللافتة النشطة */
export async function GET() {
  try {
    const setting = await prisma.siteSetting.findUnique({ where: { key: DEFAULT_BANNER_KEY } })
    if (setting?.value) {
      const data = JSON.parse(setting.value)
      if (data.isActive) return NextResponse.json({ success: true, data: { id: setting.id || 'default', ...data } })
    }
    return NextResponse.json({ success: true, data: null })
  } catch {
    return NextResponse.json({ success: false, message: 'خطأ' }, { status: 500 })
  }
}

/** Admin: تحديث اللافتة */
export async function PUT(request: NextRequest) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return auth.error

  try {
    const body = await request.json()
    const data = {
      text: body.text || '',
      link: body.link || '',
      bgColor: body.bgColor || '#fef3c7',
      textColor: body.textColor || '#92400e',
      isActive: body.isActive !== false,
    }

    await prisma.siteSetting.upsert({
      where: { key: DEFAULT_BANNER_KEY },
      create: { key: DEFAULT_BANNER_KEY, value: JSON.stringify(data) },
      update: { value: JSON.stringify(data) },
    })

    return NextResponse.json({ success: true, message: 'تم تحديث اللافتة' })
  } catch (error) {
    logger.error('Announcement PUT error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الحفظ' }, { status: 500 })
  }
}
