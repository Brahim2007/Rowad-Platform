import { z } from 'zod'

export const impactReportRequestSchema = z.object({
  reportScope: z.enum(['network', 'platform']).default('network'),
  periodType: z.enum(['monthly', 'yearly']).default('monthly'),
  year: z.coerce.number().int().min(2020).max(2100),
  month: z.coerce.number().int().min(1).max(12).optional(),
  platformId: z.string().trim().max(100).optional().default(''),
  networkRole: z.string().trim().max(200).optional().default(''),
}).superRefine((value, ctx) => {
  if (value.periodType === 'monthly' && !value.month) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['month'], message: 'الشهر مطلوب للتقرير الشهري' })
  }
  if (value.reportScope === 'network' && value.platformId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['platformId'], message: 'تقرير الشبكة الكلي لا يقبل منصة محددة' })
  }
  if (value.reportScope === 'network' && value.networkRole) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['networkRole'], message: 'تقرير الشبكة الكلي يشمل كل صفات الأعضاء' })
  }
  if (value.reportScope === 'platform' && !value.platformId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['platformId'], message: 'المنصة مطلوبة لتقرير أداء المنصة' })
  }
  if (value.reportScope === 'platform' && value.periodType !== 'monthly') {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['periodType'], message: 'تقرير أداء المنصة شهري فقط' })
  }
  if (value.reportScope === 'platform' && value.networkRole) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['networkRole'], message: 'تقرير أداء المنصة يشمل كل صفات أعضائها' })
  }
})

export type ImpactReportRequest = z.infer<typeof impactReportRequestSchema>

const boundedText = z.string().trim().min(1).max(3000)
const boundedItems = z.array(z.string().trim().min(1).max(700)).max(8)
const platformEvaluationSchema = z.object({
  overallStatus: z.enum(['مستقرة', 'تحتاج متابعة', 'تحتاج تدخل', 'حرجة']),
  summary: boundedText,
  strengths: boundedItems,
  gaps: boundedItems,
})
const criticalIssueSchema = z.object({
  title: z.string().trim().min(1).max(200),
  severity: z.enum(['حرجة', 'عالية', 'متوسطة']),
  evidence: z.string().trim().min(1).max(700),
  impact: z.string().trim().min(1).max(700),
  recommendedSolution: z.string().trim().min(1).max(700),
  immediateAction: z.string().trim().min(1).max(700),
})
const rapidActionSchema = z.object({
  priority: z.coerce.number().int().min(1).max(10),
  action: z.string().trim().min(1).max(700),
  ownerRole: z.enum(['مدير المنصة', 'إدارة النظام', 'مدير المنصة وإدارة النظام']),
  timeframe: z.enum(['خلال 24 ساعة', 'خلال 3 أيام', 'خلال 7 أيام', 'خلال 30 يومًا']),
  successMeasure: z.string().trim().min(1).max(500),
})

export const smartImpactReportSchema = z.object({
  title: z.string().trim().min(1).max(200),
  executiveSummary: boundedText,
  performanceNarrative: boundedText,
  highlights: boundedItems,
  risks: boundedItems,
  recommendations: z.array(z.object({
    title: z.string().trim().min(1).max(200),
    action: z.string().trim().min(1).max(700),
    priority: z.enum(['عالية', 'متوسطة', 'منخفضة']),
  })).max(8),
  platformInsights: boundedItems,
  memberInsights: boundedItems,
  nextPeriodFocus: boundedItems,
  dataNotes: boundedItems,
  platformEvaluation: platformEvaluationSchema.optional(),
  criticalIssues: z.array(criticalIssueSchema).max(8).optional(),
  rapidActionPlan: z.array(rapidActionSchema).max(10).optional(),
})

export type SmartImpactReport = z.infer<typeof smartImpactReportSchema>

export const platformSmartImpactReportSchema = smartImpactReportSchema.extend({
  platformEvaluation: platformEvaluationSchema,
  criticalIssues: z.array(criticalIssueSchema).max(8),
  rapidActionPlan: z.array(rapidActionSchema).min(1).max(10),
})

export interface ImpactReportMetrics {
  periodLabel: string
  previousPeriodLabel: string
  memberCount: number
  activeMembers: number
  inactiveMembers: number
  totalActivities: number
  approvedActivities: number
  pendingActivities: number
  rejectedActivities: number
  approvalRate: number
  totalPoints: number
  previousTotalPoints: number
  pointsChangePercent: number | null
  previousActivities: number
  activitiesChangePercent: number | null
  topMember: { name: string; points: number; activities: number } | null
  topPlatform: { name: string; points: number; activities: number } | null
  categories: Array<{ name: string; points: number; activities: number }>
  platforms: Array<{ name: string; points: number; activities: number; previousActivities: number; changePercent: number | null }>
  topMembers: Array<{ name: string; role: string; platform: string; points: number; activities: number }>
  dataQuality: { missingPlatformMembers: number; pendingRatio: number; recordsAnalyzed: number }
}

export interface ImpactReportPeriod {
  start: Date
  end: Date
  previousStart: Date
  previousEnd: Date
  label: string
  previousLabel: string
}

const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']

export function getImpactReportPeriod(input: ImpactReportRequest): ImpactReportPeriod {
  if (input.periodType === 'yearly') {
    return {
      start: new Date(Date.UTC(input.year, 0, 1)),
      end: new Date(Date.UTC(input.year + 1, 0, 1)),
      previousStart: new Date(Date.UTC(input.year - 1, 0, 1)),
      previousEnd: new Date(Date.UTC(input.year, 0, 1)),
      label: `السنة ${input.year}`,
      previousLabel: `السنة ${input.year - 1}`,
    }
  }

  const monthIndex = (input.month || 1) - 1
  const previous = new Date(Date.UTC(input.year, monthIndex - 1, 1))
  return {
    start: new Date(Date.UTC(input.year, monthIndex, 1)),
    end: new Date(Date.UTC(input.year, monthIndex + 1, 1)),
    previousStart: previous,
    previousEnd: new Date(Date.UTC(input.year, monthIndex, 1)),
    label: `${MONTHS[monthIndex]} ${input.year}`,
    previousLabel: `${MONTHS[previous.getUTCMonth()]} ${previous.getUTCFullYear()}`,
  }
}

export function percentageChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null
  return Math.round(((current - previous) / Math.abs(previous)) * 1000) / 10
}

type ReportMember = {
  id: string
  firstName: string
  lastName: string
  networkRole: string | null
  platformId: string | null
  platform: { name: string } | null
}

type ReportLog = {
  beneficiaryId: string
  date: Date
  count: number
  quality: string
  status: string
  pointsSnapshot: number | null
  action: { name: string; points: number; category: string }
}

const CATEGORY_LABELS: Record<string, string> = {
  DIGITAL_ACTIVITY: 'النشاط الرقمي',
  SCIENTIFIC_EVENTS: 'المشاركة العلمية والفعاليات',
  INITIATIVES: 'المبادرات والإنتاج',
  DISCIPLINE: 'الالتزام والانضباط',
}

function pointsFor(log: ReportLog, qualityBonus: Record<string, number>) {
  if (log.status !== 'APPROVED') return 0
  if (log.pointsSnapshot !== null) return log.pointsSnapshot
  return (log.count || 1) * log.action.points + (qualityBonus[log.quality] || 0)
}

export function buildImpactReportMetrics(params: {
  members: ReportMember[]
  logs: ReportLog[]
  period: ImpactReportPeriod
  qualityBonus: Record<string, number>
}): ImpactReportMetrics {
  const { members, logs, period, qualityBonus } = params
  const memberMap = new Map(members.map(member => [member.id, member]))
  const inRange = (date: Date, start: Date, end: Date) => date >= start && date < end
  const currentLogs = logs.filter(log => inRange(log.date, period.start, period.end))
  const previousLogs = logs.filter(log => inRange(log.date, period.previousStart, period.previousEnd))
  const approved = currentLogs.filter(log => log.status === 'APPROVED')
  const previousApproved = previousLogs.filter(log => log.status === 'APPROVED')

  const memberStats = new Map<string, { points: number; activities: number }>()
  const categoryStats = new Map<string, { points: number; activities: number }>()
  const platformStats = new Map<string, { points: number; activities: number; previousActivities: number }>()

  for (const log of approved) {
    const points = pointsFor(log, qualityBonus)
    const member = memberMap.get(log.beneficiaryId)
    const memberStat = memberStats.get(log.beneficiaryId) || { points: 0, activities: 0 }
    memberStat.points += points
    memberStat.activities += 1
    memberStats.set(log.beneficiaryId, memberStat)

    const category = CATEGORY_LABELS[log.action.category] || log.action.category
    const categoryStat = categoryStats.get(category) || { points: 0, activities: 0 }
    categoryStat.points += points
    categoryStat.activities += 1
    categoryStats.set(category, categoryStat)

    const platform = member?.platform?.name || 'غير مرتبط بمنصة'
    const platformStat = platformStats.get(platform) || { points: 0, activities: 0, previousActivities: 0 }
    platformStat.points += points
    platformStat.activities += 1
    platformStats.set(platform, platformStat)
  }

  for (const log of previousApproved) {
    const member = memberMap.get(log.beneficiaryId)
    const platform = member?.platform?.name || 'غير مرتبط بمنصة'
    const stat = platformStats.get(platform) || { points: 0, activities: 0, previousActivities: 0 }
    stat.previousActivities += 1
    platformStats.set(platform, stat)
  }

  const topMembers = [...memberStats.entries()].map(([id, stat]) => {
    const member = memberMap.get(id)
    return {
      name: member ? `${member.firstName} ${member.lastName}`.trim() : 'عضو غير معروف',
      role: member?.networkRole || 'غير محدد',
      platform: member?.platform?.name || 'غير مرتبط بمنصة',
      ...stat,
    }
  }).sort((a, b) => b.points - a.points).slice(0, 10)

  const platforms = [...platformStats.entries()].map(([name, stat]) => ({
    name,
    ...stat,
    changePercent: percentageChange(stat.activities, stat.previousActivities),
  })).sort((a, b) => b.points - a.points)

  const totalPoints = approved.reduce((sum, log) => sum + pointsFor(log, qualityBonus), 0)
  const previousTotalPoints = previousApproved.reduce((sum, log) => sum + pointsFor(log, qualityBonus), 0)
  const pendingActivities = currentLogs.filter(log => log.status === 'PENDING_REVIEW').length

  return {
    periodLabel: period.label,
    previousPeriodLabel: period.previousLabel,
    memberCount: members.length,
    activeMembers: memberStats.size,
    inactiveMembers: Math.max(0, members.length - memberStats.size),
    totalActivities: currentLogs.length,
    approvedActivities: approved.length,
    pendingActivities,
    rejectedActivities: currentLogs.filter(log => log.status === 'REJECTED').length,
    approvalRate: currentLogs.length ? Math.round((approved.length / currentLogs.length) * 1000) / 10 : 0,
    totalPoints,
    previousTotalPoints,
    pointsChangePercent: percentageChange(totalPoints, previousTotalPoints),
    previousActivities: previousLogs.length,
    activitiesChangePercent: percentageChange(currentLogs.length, previousLogs.length),
    topMember: topMembers[0] ? { name: topMembers[0].name, points: topMembers[0].points, activities: topMembers[0].activities } : null,
    topPlatform: platforms[0] ? { name: platforms[0].name, points: platforms[0].points, activities: platforms[0].activities } : null,
    categories: [...categoryStats.entries()].map(([name, stat]) => ({ name, ...stat })).sort((a, b) => b.points - a.points),
    platforms: platforms.slice(0, 10),
    topMembers,
    dataQuality: {
      missingPlatformMembers: members.filter(member => !member.platformId).length,
      pendingRatio: currentLogs.length ? Math.round((pendingActivities / currentLogs.length) * 1000) / 10 : 0,
      recordsAnalyzed: currentLogs.length + previousLogs.length,
    },
  }
}

export function smartImpactReportToText(report: SmartImpactReport) {
  const list = (items: string[]) => items.map(item => `- ${item}`).join('\n')
  return [
    report.title,
    '',
    'الملخص التنفيذي', report.executiveSummary,
    '',
    'قراءة الأداء', report.performanceNarrative,
    '',
    'أبرز النجاحات', list(report.highlights),
    '',
    'المخاطر والتنبيهات', list(report.risks),
    '',
    'التوصيات', report.recommendations.map(item => `- [${item.priority}] ${item.title}: ${item.action}`).join('\n'),
    '',
    'رؤى المنصات', list(report.platformInsights),
    '',
    'رؤى الأعضاء', list(report.memberInsights),
    '',
    'تركيز الفترة القادمة', list(report.nextPeriodFocus),
    '',
    'ملاحظات البيانات', list(report.dataNotes),
  ].join('\n')
}
