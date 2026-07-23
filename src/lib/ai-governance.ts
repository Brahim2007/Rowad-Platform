export type GovernanceCategory = 'DATA_QUALITY' | 'PLATFORM' | 'MANAGER' | 'ACTIVITY'
export type GovernanceSeverity = 'CRITICAL' | 'WARNING' | 'INFO'

export interface GovernanceDraft {
  fingerprint: string
  category: GovernanceCategory
  severity: GovernanceSeverity
  title: string
  summary: string
  evidence: string
  proposedAction: string
  platformId?: string
  subjectType?: string
  subjectId?: string
  subjectName?: string
}

export interface GovernancePlatformInput {
  id: string
  name: string
  managerId: string | null
  managerName: string | null
  managerLastLoginAt: Date | null
  memberCount: number
  activeRate: number
  stalePending: number
  approvedReports: number
}

function fingerprint(rule: string, subject: string, period: string) {
  return `${rule}:${subject}:${period}`.slice(0, 100)
}

export function buildGovernanceDrafts(input: {
  period: string
  unassignedMembers: number
  unscopedLogs: number
  approvedWithoutEvidence: number
  suspiciousHighCountLogs: number
  platforms: GovernancePlatformInput[]
}): GovernanceDraft[] {
  const drafts: GovernanceDraft[] = []

  if (input.unassignedMembers > 0) {
    drafts.push({
      fingerprint: fingerprint('UNASSIGNED_MEMBERS', 'GLOBAL', input.period),
      category: 'DATA_QUALITY',
      severity: 'CRITICAL',
      title: 'أعضاء نشطون دون منصة',
      summary: 'توجد حسابات أعضاء لا تدخل في مؤشرات أي منصة.',
      evidence: `${input.unassignedMembers} عضوًا نشطًا دون platformId`,
      proposedAction: 'مراجعة ملفات الأعضاء وتحديد المنصة الصحيحة قبل التقرير الدوري القادم.',
      subjectType: 'SYSTEM',
      subjectName: 'جودة بيانات الأعضاء',
    })
  }
  if (input.unscopedLogs > 0) {
    drafts.push({
      fingerprint: fingerprint('UNSCOPED_LOGS', 'GLOBAL', input.period),
      category: 'DATA_QUALITY',
      severity: 'CRITICAL',
      title: 'سجلات أثر غير منسوبة لمنصة',
      summary: 'هذه السجلات لا تظهر ضمن نتائج المنصات وقد تؤثر في دقة المقارنات.',
      evidence: `${input.unscopedLogs} سجل أثر دون platformId`,
      proposedAction: 'ربط السجلات بمنصة العضو بعد التحقق من تاريخ عضويته وعدم النسب التلقائي عند وجود تعارض.',
      subjectType: 'SYSTEM',
      subjectName: 'جودة بيانات الأثر',
    })
  }
  if (input.approvedWithoutEvidence > 0) {
    drafts.push({
      fingerprint: fingerprint('APPROVED_NO_EVIDENCE', 'GLOBAL', input.period),
      category: 'ACTIVITY',
      severity: 'WARNING',
      title: 'أنشطة معتمدة دون رابط دليل',
      summary: 'بعض الأنشطة المعتمدة لا تحتوي رابطًا أو مرجعًا يمكن الرجوع إليه.',
      evidence: `${input.approvedWithoutEvidence} نشاطًا معتمدًا دون رابط`,
      proposedAction: 'اختيار عينة للمراجعة وطلب استكمال الدليل للأنشطة التي تتطلب توثيقًا خارجيًا.',
      subjectType: 'IMPACT_LOG',
      subjectName: 'جودة توثيق الأنشطة',
    })
  }
  if (input.suspiciousHighCountLogs > 0) {
    drafts.push({
      fingerprint: fingerprint('HIGH_COUNT_LOGS', 'GLOBAL', input.period),
      category: 'ACTIVITY',
      severity: 'WARNING',
      title: 'سجلات أنشطة بأعداد مرتفعة تحتاج تحققًا',
      summary: 'رصد النظام سجلات ذات قيمة عددية مرتفعة مقارنة بالاستخدام المعتاد.',
      evidence: `${input.suspiciousHighCountLogs} سجلًا بقيمة count أكبر من 50`,
      proposedAction: 'مراجعة العينة مع الدليل قبل اعتماد نقاط إضافية، دون اعتبارها مخالفة تلقائيًا.',
      subjectType: 'IMPACT_LOG',
      subjectName: 'مراجعة القيم الشاذة',
    })
  }

  for (const platform of input.platforms) {
    if (!platform.managerId) {
      drafts.push({
        fingerprint: fingerprint('NO_MANAGER', platform.id, input.period),
        category: 'MANAGER',
        severity: 'CRITICAL',
        title: `غياب مدير أساسي عن ${platform.name}`,
        summary: 'لا توجد مسؤولية تشغيلية أساسية نشطة للمنصة.',
        evidence: 'لا يوجد تكليف PRIMARY نشط',
        proposedAction: 'تعيين مدير أساسي وتحديد أولويات أول 30 يومًا.',
        platformId: platform.id,
        subjectType: 'PLATFORM',
        subjectId: platform.id,
        subjectName: platform.name,
      })
    } else if (!platform.managerLastLoginAt) {
      drafts.push({
        fingerprint: fingerprint('MANAGER_NO_LOGIN', platform.managerId, input.period),
        category: 'MANAGER',
        severity: 'WARNING',
        title: `مدير ${platform.name} لم يسجل الدخول`,
        summary: 'حساب المدير نشط لكن لم يسجل دخولًا حتى الآن.',
        evidence: `المدير: ${platform.managerName || 'غير معروف'} — lastLoginAt فارغ`,
        proposedAction: 'التحقق من استلام بيانات الدخول وتحديد جلسة تعريف قصيرة.',
        platformId: platform.id,
        subjectType: 'ADMIN_USER',
        subjectId: platform.managerId,
        subjectName: platform.managerName || platform.name,
      })
    }
    if (platform.memberCount === 0) {
      drafts.push({
        fingerprint: fingerprint('NO_MEMBERS', platform.id, input.period),
        category: 'PLATFORM',
        severity: 'WARNING',
        title: `${platform.name} دون أعضاء نشطين`,
        summary: 'لا يمكن قياس الأثر أو المشاركة دون أعضاء مرتبطين بالمنصة.',
        evidence: 'عدد الأعضاء النشطين المرتبطين = 0',
        proposedAction: 'مراجعة جاهزية المنصة وخطة استقطاب أو نقل الأعضاء المعتمدين.',
        platformId: platform.id,
        subjectType: 'PLATFORM',
        subjectId: platform.id,
        subjectName: platform.name,
      })
    } else if (platform.activeRate < 30) {
      drafts.push({
        fingerprint: fingerprint('LOW_ACTIVE_RATE', platform.id, input.period),
        category: 'PLATFORM',
        severity: 'WARNING',
        title: `مشاركة منخفضة في ${platform.name}`,
        summary: 'نسبة الأعضاء أصحاب النشاط المعتمد أقل من الحد التشغيلي المقترح.',
        evidence: `${platform.activeRate}% من ${platform.memberCount} عضوًا نشطًا في الفترة`,
        proposedAction: 'تقسيم الأعضاء حسب آخر نشاط، والتواصل مع مجموعة الأولوية بخطة أسبوعين.',
        platformId: platform.id,
        subjectType: 'PLATFORM',
        subjectId: platform.id,
        subjectName: platform.name,
      })
    }
    if (platform.stalePending > 0) {
      drafts.push({
        fingerprint: fingerprint('STALE_REVIEWS', platform.id, input.period),
        category: 'MANAGER',
        severity: 'CRITICAL',
        title: `تأخر اعتماد أنشطة ${platform.name}`,
        summary: 'توجد أنشطة معلقة منذ أكثر من سبعة أيام.',
        evidence: `${platform.stalePending} نشاطًا متأخرًا`,
        proposedAction: 'تكليف مدير المنصة بمراجعة القائمة وتوثيق أسباب أي تأخير أو رفض.',
        platformId: platform.id,
        subjectType: 'PLATFORM',
        subjectId: platform.id,
        subjectName: platform.name,
      })
    }
    if (platform.approvedReports === 0) {
      drafts.push({
        fingerprint: fingerprint('NO_APPROVED_REPORTS', platform.id, input.period),
        category: 'PLATFORM',
        severity: 'INFO',
        title: `لا توجد تقارير معتمدة لـ${platform.name}`,
        summary: 'لا يوجد تقرير معتمد يمكن استخدامه في المتابعة المؤسسية.',
        evidence: 'عدد التقارير بحالة APPROVED = 0',
        proposedAction: 'مراجعة دورة إعداد واعتماد التقرير وتحديد موعد مسؤول.',
        platformId: platform.id,
        subjectType: 'PLATFORM',
        subjectId: platform.id,
        subjectName: platform.name,
      })
    }
  }

  return drafts
}
