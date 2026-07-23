export type PerformanceAlertRecipientType = 'ADMIN' | 'PLATFORM_MANAGER' | 'MEMBER'
export type PerformanceAlertSeverity = 'SUCCESS' | 'INFO' | 'WARNING' | 'CRITICAL'

export interface PerformanceAlertProposal {
  id: string
  rule: string
  recipientId: string
  recipientType: PerformanceAlertRecipientType
  recipientName: string
  severity: PerformanceAlertSeverity
  title: string
  body: string
  link: string
  evidence: string
}

export interface PerformanceAlertMember {
  id: string
  name: string
  currentApproved: number
  previousApproved: number
}

export function buildPerformanceAlertProposals(input: {
  platformName: string
  platformSlug: string
  managers: Array<{ id: string; name: string }>
  administrators: Array<{ id: string; name: string }>
  members: PerformanceAlertMember[]
  activeRate: number
  stalePending: number
}): PerformanceAlertProposal[] {
  const proposals: PerformanceAlertProposal[] = []
  const managerLink = `/admin/platforms-overview/${input.platformSlug}`

  if (input.managers.length === 0) {
    for (const admin of input.administrators) {
      proposals.push({
        id: `NO_MANAGER:${admin.id}`,
        rule: 'NO_MANAGER',
        recipientId: admin.id,
        recipientType: 'ADMIN',
        recipientName: admin.name,
        severity: 'CRITICAL',
        title: `تعيين مدير لمنصة ${input.platformName}`,
        body: `لا يوجد مدير أساسي نشط للمنصة. يرجى تعيين مسؤول ومراجعة خطة المتابعة.`,
        link: managerLink,
        evidence: 'لا يوجد تكليف مدير أساسي نشط',
      })
    }
  }

  for (const manager of input.managers) {
    if (input.stalePending > 0) {
      proposals.push({
        id: `STALE_PENDING:${manager.id}`,
        rule: 'STALE_PENDING',
        recipientId: manager.id,
        recipientType: 'PLATFORM_MANAGER',
        recipientName: manager.name,
        severity: 'CRITICAL',
        title: 'أنشطة متأخرة تحتاج إلى مراجعة',
        body: `يوجد ${input.stalePending} نشاطًا معلقًا منذ أكثر من 7 أيام في ${input.platformName}. يرجى مراجعتها وتوثيق قرار الاعتماد.`,
        link: '/admin/my-platform?tab=activities',
        evidence: `${input.stalePending} نشاطًا متأخرًا`,
      })
    }
    if (input.members.length > 0 && input.activeRate < 30) {
      proposals.push({
        id: `LOW_ENGAGEMENT:${manager.id}`,
        rule: 'LOW_ENGAGEMENT',
        recipientId: manager.id,
        recipientType: 'PLATFORM_MANAGER',
        recipientName: manager.name,
        severity: 'WARNING',
        title: 'مشاركة أعضاء المنصة تحتاج إلى تحسين',
        body: `بلغت نسبة مشاركة أعضاء ${input.platformName} ${input.activeRate}% في الفترة الحالية. يُنصح بخطة متابعة قصيرة وتحديد أعضاء الأولوية.`,
        link: '/admin/my-platform?tab=members',
        evidence: `نسبة المشاركة ${input.activeRate}%`,
      })
    }
  }

  for (const member of input.members) {
    if (member.currentApproved === 0) {
      proposals.push({
        id: `MEMBER_INACTIVE:${member.id}`,
        rule: 'MEMBER_INACTIVE',
        recipientId: member.id,
        recipientType: 'MEMBER',
        recipientName: member.name,
        severity: 'INFO',
        title: 'تذكير بخطة نشاطك لهذا الشهر',
        body: `لم يُسجّل لك نشاط معتمد حتى الآن هذا الشهر. اختر خطوة عملية واحدة وسجّلها من بوابتك، ويمكنك التواصل مع مدير المنصة عند الحاجة.`,
        link: '/member?tab=submit',
        evidence: 'لا توجد أنشطة معتمدة في الفترة',
      })
    } else if (member.currentApproved >= 3) {
      proposals.push({
        id: `MEMBER_RECOGNITION:${member.id}`,
        rule: 'MEMBER_RECOGNITION',
        recipientId: member.id,
        recipientType: 'MEMBER',
        recipientName: member.name,
        severity: 'SUCCESS',
        title: 'أداء مميز هذا الشهر',
        body: `أحسنت، حققت ${member.currentApproved} أنشطة معتمدة هذا الشهر. حافظ على الاستمرارية وشارك خبرتك مع زملائك.`,
        link: '/member?tab=history',
        evidence: `${member.currentApproved} أنشطة معتمدة`,
      })
    } else if (member.previousApproved >= 2 && member.currentApproved < member.previousApproved / 2) {
      proposals.push({
        id: `MEMBER_DECLINE:${member.id}`,
        rule: 'MEMBER_DECLINE',
        recipientId: member.id,
        recipientType: 'MEMBER',
        recipientName: member.name,
        severity: 'WARNING',
        title: 'فرصة لاستعادة وتيرة نشاطك',
        body: `انخفض نشاطك المعتمد من ${member.previousApproved} في الفترة السابقة إلى ${member.currentApproved} حاليًا. حدّد نشاطًا قريبًا وأضفه إلى خطتك قبل نهاية الشهر.`,
        link: '/member?tab=submit',
        evidence: `من ${member.previousApproved} إلى ${member.currentApproved} نشاط`,
      })
    }
  }

  return proposals
}
