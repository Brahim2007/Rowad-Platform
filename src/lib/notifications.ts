/**
 * مساعد الإشعارات الداخلية — يُستخدم من APIs أخرى لإنشاء إشعارات تلقائية
 */

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

interface CreateNotificationParams {
  recipientId: string
  recipientType: 'ADMIN' | 'PLATFORM_MANAGER' | 'MEMBER'
  type: 'ACTIVITY_APPROVED' | 'ACTIVITY_REJECTED' | 'NEW_SUBMISSION' | 'BROADCAST' | 'SYSTEM_ALERT'
  title: string
  body: string
  link?: string
  senderId?: string
  senderName?: string
}

export async function createNotification(params: CreateNotificationParams): Promise<void> {
  try {
    await prisma.notification.create({ data: params })
  } catch (e) {
    logger.error('[notification] create error', e)
  }
}

/** إشعار لمدير المنصة عند إرسال نشاط جديد */
export async function notifyNewSubmission(data: {
  beneficiaryId: string
  beneficiaryName: string
  activityName: string
  platformId: string
}) {
  // إرسال لمدير المنصة المعنية
  const managers = await prisma.adminUser.findMany({
    where: { platformId: data.platformId, role: 'PLATFORM_MANAGER', isActive: true },
    select: { id: true },
  })
  for (const m of managers) {
    await createNotification({
      recipientId: m.id,
      recipientType: 'PLATFORM_MANAGER',
      type: 'NEW_SUBMISSION',
      title: 'نشاط جديد بانتظار الاعتماد',
      body: `${data.beneficiaryName} أرسل "${data.activityName}"`,
      link: '/admin/my-platform?tab=activities',
    })
  }
  // إرسال لجميع المشرفين
  const superAdmins = await prisma.adminUser.findMany({
    where: { role: 'SUPER_ADMIN', isActive: true },
    select: { id: true },
  })
  for (const a of superAdmins) {
    await createNotification({
      recipientId: a.id,
      recipientType: 'ADMIN',
      type: 'NEW_SUBMISSION',
      title: 'نشاط جديد بانتظار الاعتماد',
      body: `${data.beneficiaryName} أرسل "${data.activityName}"`,
      link: '/admin/impact?tab=activities',
    })
  }
}

/** إشعار للعضو عند الاعتماد */
export async function notifyActivityApproved(data: {
  beneficiaryId: string
  beneficiaryName: string
  activityName: string
  points: number
  note?: string
}) {
  await createNotification({
    recipientId: data.beneficiaryId,
    recipientType: 'MEMBER',
    type: 'ACTIVITY_APPROVED',
    title: `✅ تم اعتماد نشاطك — +${data.points} نقطة`,
    body: `"${data.activityName}"${data.note ? `\nملاحظة المدير: ${data.note}` : ''}`,
    link: '/member?tab=history',
  })
}

/** إشعار للعضو عند الرفض */
export async function notifyActivityRejected(data: {
  beneficiaryId: string
  beneficiaryName: string
  activityName: string
  reason: string
}) {
  await createNotification({
    recipientId: data.beneficiaryId,
    recipientType: 'MEMBER',
    type: 'ACTIVITY_REJECTED',
    title: '❌ لم يُعتمد نشاطك',
    body: `"${data.activityName}"\nسبب الرفض: ${data.reason}`,
    link: '/member?tab=history',
  })
}
