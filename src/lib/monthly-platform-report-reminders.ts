import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

const MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
]

/**
 * Creates at most one reminder per administrator/platform/month.
 * It runs opportunistically when a system manager loads notifications.
 */
export async function ensureMonthlyPlatformReportReminders(recipientId: string) {
  try {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const periodStart = new Date(year, month - 1, 1)

    const [platforms, currentReports] = await Promise.all([
      prisma.platform.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: { id: true, name: true },
      }),
      prisma.aiGeneratedReport.findMany({
        where: {
          periodType: 'monthly',
          periodYear: year,
          periodMonth: month,
          platformId: { not: null },
        },
        select: { platformId: true },
      }),
    ])

    const completedPlatformIds = new Set(
      currentReports.map(report => report.platformId).filter(Boolean),
    )
    const duePlatforms = platforms.filter(
      platform => !completedPlatformIds.has(platform.id),
    )
    if (!duePlatforms.length) return

    const titles = duePlatforms.map(
      platform => `تقرير ${platform.name} الذكي مستحق`,
    )
    const existing = await prisma.notification.findMany({
      where: {
        recipientId,
        type: 'SYSTEM_ALERT',
        title: { in: titles },
        createdAt: { gte: periodStart },
      },
      select: { title: true },
    })
    const existingTitles = new Set(existing.map(item => item.title))

    const notifications = duePlatforms
      .map(platform => ({
        recipientId,
        recipientType: 'ADMIN',
        type: 'SYSTEM_ALERT',
        title: `تقرير ${platform.name} الذكي مستحق`,
        body: `لم يُنشأ تقرير منصة ${platform.name} لشهر ${MONTHS[month - 1]} ${year}. تسمح السياسة بتقرير ذكي واحد فقط لكل منصة في الشهر.`,
        link: `/admin/platforms-overview?year=${year}&month=${month}`,
      }))
      .filter(item => !existingTitles.has(item.title))

    if (notifications.length) {
      await prisma.notification.createMany({ data: notifications })
    }
  } catch (error) {
    logger.error('[ai] monthly platform report reminder error', error)
  }
}
