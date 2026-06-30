/**
 * محرّك احتساب النقاط — لوحة أثر الرواد (Impact Dashboard)
 *
 * جميع الدوال نقية (pure functions) قابلة للاختبار.
 * تستقبل البيانات وتعيد النتيجة دون أي أثر جانبي.
 *
 * مبادئ المنطق (من النموذج المرجعي lawhat_athar_alruwwad):
 * - النشاط غير المعتمد أو المرفوض = 0 نقطة
 * - النقاط = (العدد × قيمة النشاط) + بونص الجودة
 * - المستوى يُحتسب من إجمالي النقاط التراكمي
 * - المكافأة الشهرية مشروطة باجتياز البوابة الإلزامية
 */

// ═══════════════════════════════════════════════════════════
// الأنواع (Types)
// ═══════════════════════════════════════════════════════════

export type ImpactCategory =
  | 'DIGITAL_ACTIVITY'   // النشاط الرقمي
  | 'SCIENTIFIC_EVENTS'  // المشاركة العلمية والفعاليات
  | 'INITIATIVES'        // المبادرات والإنتاج
  | 'DISCIPLINE'         // الالتزام والانضباط

export type ImpactQuality = 'WEAK' | 'ACCEPTABLE' | 'GOOD' | 'EXCELLENT' | 'EXCEPTIONAL'
export type ImpactApprovalStatus = 'APPROVED' | 'PENDING_REVIEW' | 'REJECTED'
export type ImpactAwardType = 'SHIELD' | 'REWARD'
export type ScopeType = 'week' | 'month' | 'all'

export interface ImpactActionItem {
  id: string
  name: string
  points: number
  category: ImpactCategory
  note?: string | null
  isActive: boolean
  sortOrder: number
}

export interface ImpactLogEntry {
  id: string
  beneficiaryId: string
  actionId: string
  action?: ImpactActionItem
  count: number
  quality: ImpactQuality
  status: ImpactApprovalStatus
  date: string | Date
  link?: string | null
  note?: string | null
  desc?: string | null
  medium?: string | null
  duration?: string | null
  likes?: number | null
  comments?: number | null
  shares?: number | null
}

export interface ImpactAwardEntry {
  id: string
  beneficiaryId: string
  type: ImpactAwardType
  title: string
  value: number
  date: string | Date
  note?: string | null
}

export interface ImpactGateEntry {
  beneficiaryId: string
  year: number
  month: number
  passed: boolean
}

export interface ImpactSettingsData {
  qualityBonus: Record<ImpactQuality, number>
  levels: ImpactLevel[]
  rewardTiers: RewardTier[]
  umrah: UmrahConditions
}

export interface ImpactLevel {
  name: string
  from: number
  to: number
  desc?: string
}

export interface RewardTier {
  name: string
  from: number
  to: number
}

export interface UmrahConditions {
  minYearly: number
  minMonths: number
  minInitiatives: number
  requireExcellent: boolean
  noViolations: boolean
}

export interface Scope {
  type: ScopeType
  year?: number
  month?: number
  ref?: string  // ISO date for weekly scope
}

export interface BeneficiaryInfo {
  id: string
  name?: string
  firstName?: string
  lastName?: string
  networkRole?: string | null
  platformName?: string | null
  code?: string | null
  joinDate?: string | Date | null
  status?: string
}

export interface MemberSummary {
  member: BeneficiaryInfo
  total: number
  level: ImpactLevel
  acts: number
  byCategory: Record<string, number>
}

export interface PlatformAggregation {
  platform: string
  count: number
  acts: number
  points: number
  best: string
  bestVal: number
  avg: number
}

// ═══════════════════════════════════════════════════════════
// الثوابت الافتراضية (من النموذج المرجعي)
// ═══════════════════════════════════════════════════════════

export const CATEGORY_LABELS: Record<ImpactCategory, string> = {
  DIGITAL_ACTIVITY: 'النشاط الرقمي',
  SCIENTIFIC_EVENTS: 'المشاركة العلمية والفعاليات',
  INITIATIVES: 'المبادرات والإنتاج',
  DISCIPLINE: 'الالتزام والانضباط',
}

export const QUALITY_BONUS: Record<ImpactQuality, number> = {
  WEAK: -3,
  ACCEPTABLE: 0,
  GOOD: 3,
  EXCELLENT: 6,
  EXCEPTIONAL: 10,
}

export const QUALITY_LABELS: Record<ImpactQuality, string> = {
  WEAK: 'ضعيف',
  ACCEPTABLE: 'مقبول',
  GOOD: 'جيد',
  EXCELLENT: 'ممتاز',
  EXCEPTIONAL: 'استثنائي',
}

export const DEFAULT_LEVELS: ImpactLevel[] = [
  { name: 'عضو جديد', from: 0, to: 99, desc: 'في بداية الرحلة' },
  { name: 'عضو نشط', from: 100, to: 299, desc: 'يشارك بشكل مقبول' },
  { name: 'عضو مؤثر', from: 300, to: 599, desc: 'له حضور واضح' },
  { name: 'عضو متميز', from: 600, to: 999, desc: 'من أصحاب الأداء العالي' },
  { name: 'رائد ذهبي', from: 1000, to: 1999, desc: 'من أعمدة الشبكة' },
  { name: 'سفير الرواد', from: 2000, to: 9_999_999, desc: 'عضو استراتيجي ومؤثر جدًا' },
]

export const DEFAULT_REWARD_TIERS: RewardTier[] = [
  { name: 'لا مكافأة', from: 0, to: 99 },
  { name: 'رمزية', from: 100, to: 149 },
  { name: 'أساسية', from: 150, to: 249 },
  { name: 'متوسطة', from: 250, to: 399 },
  { name: 'كاملة + درع', from: 400, to: 9_999_999 },
]

export const DEFAULT_UMRAH: UmrahConditions = {
  minYearly: 3000,
  minMonths: 9,
  minInitiatives: 1,
  requireExcellent: true,
  noViolations: true,
}

export const BADGE_CATALOG = [
  'درع رائد الشهر', 'درع المؤثر الرقمي', 'درع الباحث المنتج',
  'درع المتطوع المثالي', 'درع المبادرة', 'درع العطاء المستمر',
  'درع القيادة', 'درع العضو الصاعد', 'درع الوفاء',
  'جائزة رائد السنة', 'جائزة المؤثر الأول', 'جائزة الباحث الملهم',
  'جائزة المتطوع الذهبي', 'جائزة القيادة', 'جائزة العمرة',
]

// ═══════════════════════════════════════════════════════════
// 1. النقاط النهائية لنشاط واحد
// ═══════════════════════════════════════════════════════════

/** حساب النقاط النهائية لسجل نشاط واحد */
export function finalPoints(
  entry: ImpactLogEntry,
  actionMap: Map<string, ImpactActionItem>,
): number {
  // غير المعتمد أو المرفوض = 0 نقطة
  if (entry.status === 'REJECTED' || entry.status === 'PENDING_REVIEW') return 0

  const action = actionMap.get(entry.actionId)
  if (!action) return 0

  const count = entry.count || 1
  const basePoints = count * action.points
  const bonus = QUALITY_BONUS[entry.quality] ?? 0

  return basePoints + bonus
}

/**
 * هل النشاط يمثل خصماً (قيمة سالبة)؟
 * يستخدم في كشف المخالفات لبوابة العمرة
 */
export function isNegativeViolation(
  entry: ImpactLogEntry,
  actionMap: Map<string, ImpactActionItem>,
): boolean {
  const action = actionMap.get(entry.actionId)
  return action ? action.points < 0 : false
}

// ═══════════════════════════════════════════════════════════
// 2. النطاق الزمني (Scoping)
// ═══════════════════════════════════════════════════════════

export function inMonth(date: string | Date, year: number, month: number): boolean {
  const d = new Date(date)
  return d.getFullYear() === year && (d.getMonth() + 1) === month
}

export function inYear(date: string | Date, year: number): boolean {
  return new Date(date).getFullYear() === year
}

export function inWeek(date: string | Date, refDate: string | Date): boolean {
  const d = new Date(date)
  const ref = new Date(refDate)
  const start = new Date(ref)
  start.setDate(ref.getDate() - 6)
  start.setHours(0, 0, 0, 0)
  const end = new Date(ref)
  end.setHours(23, 59, 59, 999)
  return d >= start && d <= end
}

/** تصفية الأنشطة حسب النطاق الزمني */
export function filterByScope(entries: ImpactLogEntry[], scope: Scope): ImpactLogEntry[] {
  if (scope.type === 'all') return entries

  if (scope.type === 'month' && scope.year && scope.month) {
    return entries.filter(e => inMonth(e.date, scope.year!, scope.month!))
  }

  if (scope.type === 'week' && scope.ref) {
    return entries.filter(e => inWeek(e.date, scope.ref!))
  }

  return entries
}

// ═══════════════════════════════════════════════════════════
// 3. تجميع النقاط (Aggregation)
// ═══════════════════════════════════════════════════════════

/** إجمالي نقاط عضو من كل أنشطته (دون نطاق) */
export function memberTotal(
  entries: ImpactLogEntry[],
  actionMap: Map<string, ImpactActionItem>,
): number {
  return entries.reduce((sum, e) => sum + finalPoints(e, actionMap), 0)
}

/** إجمالي نقاط عضو ضمن نطاق زمني */
export function memberScopedPoints(
  entries: ImpactLogEntry[],
  actionMap: Map<string, ImpactActionItem>,
  scope: Scope,
): number {
  const filtered = filterByScope(entries, scope)
  return memberTotal(filtered, actionMap)
}

/** نقاط عضو شهرياً */
export function memberMonthlyPoints(
  entries: ImpactLogEntry[],
  actionMap: Map<string, ImpactActionItem>,
  year: number,
  month: number,
): number {
  return memberScopedPoints(entries, actionMap, { type: 'month', year, month })
}

/** نقاط عضو سنوياً */
export function memberYearlyPoints(
  entries: ImpactLogEntry[],
  actionMap: Map<string, ImpactActionItem>,
  year: number,
): number {
  return entries
    .filter(e => inYear(e.date, year))
    .reduce((sum, e) => sum + finalPoints(e, actionMap), 0)
}

/** توزيع نقاط العضو على المحاور الأربعة */
export function memberByCategory(
  entries: ImpactLogEntry[],
  actionMap: Map<string, ImpactActionItem>,
): Record<string, number> {
  const result: Record<string, number> = {}
  for (const cat of Object.values(CATEGORY_LABELS)) {
    result[cat] = 0
  }

  for (const entry of entries) {
    const action = actionMap.get(entry.actionId)
    if (!action || !action.category) continue
    const label = CATEGORY_LABELS[action.category]
    if (label) {
      result[label] += finalPoints(entry, actionMap)
    }
  }

  return result
}

// ═══════════════════════════════════════════════════════════
// 4. المستوى
// ═══════════════════════════════════════════════════════════

/** المستوى الحالي حسب مجموع النقاط */
export function levelOf(total: number, levels: ImpactLevel[] = DEFAULT_LEVELS): ImpactLevel {
  for (const level of levels) {
    if (total >= level.from && total <= level.to) return level
  }
  return levels[levels.length - 1]
}

/** المستوى التالي والمسافة المتبقية */
export function nextLevelGap(
  total: number,
  levels: ImpactLevel[] = DEFAULT_LEVELS,
): { name: string; gap: number } | null {
  const current = levelOf(total, levels)
  const idx = levels.findIndex(l => l.name === current.name)
  const next = levels[idx + 1]
  if (!next) return null
  return { name: next.name, gap: Math.max(0, next.from - total) }
}

/** نسبة التقدم داخل المستوى الحالي (0-100) */
export function levelProgress(
  total: number,
  levels: ImpactLevel[] = DEFAULT_LEVELS,
): number {
  const current = levelOf(total, levels)
  if (current.to >= 9_999_999) return 100
  const range = current.to - current.from + 1
  return Math.min(100, Math.max(0, ((total - current.from) / range) * 100))
}

// ═══════════════════════════════════════════════════════════
// 5. حالة نشاط العضو (نشط / خامل / متوقف)
// ═══════════════════════════════════════════════════════════

export interface ActivityStatus {
  key: 'active' | 'month' | 'idle' | 'dormant'
  label: string
  dot: 'g' | 'o' | 'r'
  since: number  // أيام منذ آخر نشاط
}

/** آخر تاريخ نشاط معتمد */
export function lastActiveDate(entries: ImpactLogEntry[]): string | null {
  const approved = entries
    .filter(e => e.status === 'APPROVED')
    .map(e => typeof e.date === 'string' ? e.date : e.date.toISOString().split('T')[0])
    .filter(Boolean)
    .sort()
  return approved.length ? approved[approved.length - 1] : null
}

/** الأيام المنقضية منذ تاريخ معين */
export function daysSince(dateStr: string | null): number {
  if (!dateStr) return Infinity
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return Infinity
  return Math.floor((Date.now() - d.getTime()) / 86_400_000)
}

/** تصنيف حالة العضو */
export function activityStatus(entries: ImpactLogEntry[]): ActivityStatus {
  const d = daysSince(lastActiveDate(entries))
  if (d <= 7) return { key: 'active', label: 'نشط هذا الأسبوع', dot: 'g', since: d }
  if (d <= 30) return { key: 'month', label: 'نشط هذا الشهر', dot: 'g', since: d }
  if (d <= 60) return { key: 'idle', label: 'خامل (٣٠–٦٠ يوم)', dot: 'o', since: d }
  return { key: 'dormant', label: d === Infinity ? 'لم يبدأ بعد' : 'متوقف (+٦٠ يوم)', dot: 'r', since: d }
}

// ═══════════════════════════════════════════════════════════
// 6. المكافآت والبوابات
// ═══════════════════════════════════════════════════════════

/** شريحة المكافأة بناءً على نقاط الشهر */
export function rewardTier(
  monthlyPoints: number,
  tiers: RewardTier[] = DEFAULT_REWARD_TIERS,
): string {
  const tier = tiers.find(t => monthlyPoints >= t.from && monthlyPoints <= t.to)
  return tier ? tier.name : '—'
}

/** المكافأة المستحقة (اسم الشريحة أو "لا استحقاق" إذا تعثرت البوابة) */
export function rewardEligibility(
  monthlyPoints: number,
  gatePassed: boolean,
  tiers?: RewardTier[],
): { tier: string; eligible: boolean } {
  if (!gatePassed || monthlyPoints <= 0) {
    return { tier: 'لا استحقاق', eligible: false }
  }
  return { tier: rewardTier(monthlyPoints, tiers), eligible: true }
}

// ═══════════════════════════════════════════════════════════
// 7. أهلية بوابة العمرة
// ═══════════════════════════════════════════════════════════

export function umrahEligible(
  entries: ImpactLogEntry[],
  actionMap: Map<string, ImpactActionItem>,
  year: number,
  conditions: UmrahConditions = DEFAULT_UMRAH,
): boolean {
  const yearlyEntries = entries.filter(e => inYear(e.date, year))

  // 1. نقاط السنة ≥ الحد الأدنى
  const total = yearlyEntries.reduce((sum, e) => sum + finalPoints(e, actionMap), 0)
  if (total < conditions.minYearly) return false

  // 2. عدد الأشهر النشطة ≥ الحد الأدنى
  const activeMonthSet = new Set<number>()
  yearlyEntries.forEach(e => {
    const d = new Date(e.date)
    activeMonthSet.add(d.getMonth() + 1)
  })
  if (activeMonthSet.size < conditions.minMonths) return false

  // 3. عدد المبادرات (أنشطة تحتوي على "مبادرة" في الاسم) ≥ الحد الأدنى
  const initiativeCount = yearlyEntries.filter(e => {
    const action = actionMap.get(e.actionId)
    return action?.name.includes('مبادرة')
  }).length
  if (initiativeCount < conditions.minInitiatives) return false

  // 4. نشاط واحد على الأقل بجودة ممتاز أو استثنائي
  if (conditions.requireExcellent) {
    const hasExcellent = yearlyEntries.some(
      e => e.quality === 'EXCELLENT' || e.quality === 'EXCEPTIONAL',
    )
    if (!hasExcellent) return false
  }

  // 5. لا مخالفات (نقاط سالبة) في السنة
  if (conditions.noViolations) {
    const hasViolation = yearlyEntries.some(e => isNegativeViolation(e, actionMap))
    if (hasViolation) return false
  }

  return true
}

// ═══════════════════════════════════════════════════════════
// 8. تجميع المنصات
// ═══════════════════════════════════════════════════════════

export function platformAggregation(
  members: Array<BeneficiaryInfo & { entries: ImpactLogEntry[] }>,
  actionMap: Map<string, ImpactActionItem>,
  scope?: Scope,
): PlatformAggregation[] {
  // تجميع الأعضاء حسب المنصة
  const platformMap = new Map<string, Array<BeneficiaryInfo & { entries: ImpactLogEntry[] }>>()

  for (const m of members) {
    const plat = m.platformName || 'غير محدد'
    if (!platformMap.has(plat)) platformMap.set(plat, [])
    platformMap.get(plat)!.push(m)
  }

  const result: PlatformAggregation[] = []

  for (const [platform, ms] of platformMap) {
    let points = 0
    let acts = 0
    let best = '—'
    let bestVal = -Infinity

    for (const m of ms) {
      const filtered = scope ? filterByScope(m.entries, scope) : m.entries
      const p = filtered.reduce((sum, e) => sum + finalPoints(e, actionMap), 0)
      points += p
      acts += filtered.length

      if (p > bestVal) {
        bestVal = p
        best = m.firstName
          ? `${m.firstName} ${m.lastName || ''}`
          : (m.name || '—')
      }
    }

    result.push({
      platform,
      count: ms.length,
      acts,
      points,
      best,
      bestVal: Math.max(0, bestVal),
      avg: ms.length ? Math.round(points / ms.length) : 0,
    })
  }

  return result.sort((a, b) => b.points - a.points)
}

// ═══════════════════════════════════════════════════════════
// 9. الاتجاه الشهري لعضو (12 شهراً)
// ═══════════════════════════════════════════════════════════

export function memberMonthlyTrend(
  entries: ImpactLogEntry[],
  actionMap: Map<string, ImpactActionItem>,
  year: number,
): number[] {
  const trend: number[] = new Array(12).fill(0)
  entries
    .filter(e => e.status === 'APPROVED' && inYear(e.date, year))
    .forEach(e => {
      const month = new Date(e.date).getMonth()  // 0-indexed
      trend[month] += finalPoints(e, actionMap)
    })
  return trend
}

// ═══════════════════════════════════════════════════════════
// 10. رحلة العضو (أحداث زمنية)
// ═══════════════════════════════════════════════════════════

export interface JourneyEvent {
  date: string
  type: 'join' | 'first' | 'level' | 'award'
  title: string
  note?: string
  icon: string
  cls: 'navy' | 'green' | 'purple' | 'gold'
}

export function memberJourney(
  beneficiary: BeneficiaryInfo,
  entries: ImpactLogEntry[],
  awards: ImpactAwardEntry[],
  actionMap: Map<string, ImpactActionItem>,
  levels: ImpactLevel[] = DEFAULT_LEVELS,
): JourneyEvent[] {
  const events: JourneyEvent[] = []

  // الانضمام
  const joinDate = beneficiary.joinDate
    ? (typeof beneficiary.joinDate === 'string' ? beneficiary.joinDate : beneficiary.joinDate.toISOString().split('T')[0])
    : null
  if (joinDate) {
    events.push({
      date: joinDate,
      type: 'join',
      title: 'الانضمام إلى شبكة الرواد',
      note: beneficiary.platformName ? `على ${beneficiary.platformName}` : '',
      icon: 'ph-fill ph-flag-banner',
      cls: 'navy',
    })
  }

  // الأنشطة المعتمدة مرتبة زمنياً
  const approved = entries
    .filter(e => e.status === 'APPROVED')
    .sort((a, b) => {
      const da = typeof a.date === 'string' ? a.date : a.date.toISOString()
      const db = typeof b.date === 'string' ? b.date : b.date.toISOString()
      return da.localeCompare(db)
    })

  if (approved.length > 0) {
    const firstDate = typeof approved[0].date === 'string'
      ? approved[0].date
      : approved[0].date.toISOString().split('T')[0]

    events.push({
      date: firstDate,
      type: 'first',
      title: 'أول نشاط معتمد',
      note: approved[0].action?.name || approved[0].actionId,
      icon: 'ph-fill ph-rocket-launch',
      cls: 'green',
    })

    // بلوغ المستويات تراكمياً
    let running = 0
    const reached = new Set<string>()
    for (const entry of approved) {
      running += finalPoints(entry, actionMap)
      const lv = levelOf(running, levels)
      if (!reached.has(lv.name) && lv.from > 0) {
        reached.add(lv.name)
        const entryDate = typeof entry.date === 'string' ? entry.date : entry.date.toISOString().split('T')[0]
        events.push({
          date: entryDate,
          type: 'level',
          title: `بلوغ مستوى: ${lv.name}`,
          note: `تجاوز ${lv.from} نقطة`,
          icon: 'ph-fill ph-trend-up',
          cls: 'purple',
        })
      }
    }
  }

  // الدروع والمكافآت
  for (const award of awards) {
    const awardDate = typeof award.date === 'string' ? award.date : award.date.toISOString().split('T')[0]
    events.push({
      date: awardDate,
      type: 'award',
      title: (award.type === 'SHIELD' ? 'نيل درع: ' : 'مكافأة: ') + award.title,
      note: '',
      icon: 'ph-fill ph-medal',
      cls: 'gold',
    })
  }

  // ترتيب تنازلي بالتاريخ
  return events
    .filter(e => e.date)
    .sort((a, b) => b.date.localeCompare(a.date))
}

// ═══════════════════════════════════════════════════════════
// 11. المساعدات (Utilities)
// ═══════════════════════════════════════════════════════════

/** تجميع ملخص كل الأعضاء */
export function summarizeMembers(
  membersData: Array<BeneficiaryInfo & { entries: ImpactLogEntry[] }>,
  actionMap: Map<string, ImpactActionItem>,
  scope?: Scope,
): MemberSummary[] {
  return membersData
    .map(m => {
      const filtered = scope ? filterByScope(m.entries, scope) : m.entries
      const total = filtered.reduce((sum, e) => sum + finalPoints(e, actionMap), 0)
      const byCategory = memberByCategory(filtered, actionMap)
      return {
        member: m,
        total,
        level: levelOf(total),
        acts: filtered.length,
        byCategory,
      }
    })
    .sort((a, b) => b.total - a.total)
}

/** بناء actionMap من قائمة ImpactAction */
export function buildActionMap(items: ImpactActionItem[]): Map<string, ImpactActionItem> {
  const map = new Map<string, ImpactActionItem>()
  for (const item of items) {
    map.set(item.id, item)
  }
  return map
}

/** اسم كامل من الاسم الأول والأخير */
export function fullName(first?: string | null, last?: string | null): string {
  return [first, last].filter(Boolean).join(' ') || '—'
}

// ═══════════════════════════════════════════════════════════
// 12. التنبيهات المركزية (Alert Computation)
// ═══════════════════════════════════════════════════════════

export interface Alert {
  kind: 'danger' | 'warn' | 'info' | 'ok'
  icon: string
  title: string
  sub: string
  tab: string
  memberId?: string
}

export function computeAlerts(
  membersData: Array<BeneficiaryInfo & { entries: ImpactLogEntry[] }>,
  actionMap: Map<string, ImpactActionItem>,
  allEntries: ImpactLogEntry[],
  gates: Map<string, boolean>, // key: "memberId_year_month"
  year: number,
  month: number,
): Alert[] {
  const alerts: Alert[] = []

  // أنشطة قيد المراجعة
  const pending = allEntries.filter(e => e.status === 'PENDING_REVIEW')
  const shown = pending.slice(0, 6)
  for (const p of shown) {
    const name = membersData.find(m => m.id === p.beneficiaryId)
    alerts.push({
      kind: 'info',
      icon: 'ph-fill ph-hourglass-medium',
      title: 'نشاط بانتظار الاعتماد',
      sub: `${fullName(name?.firstName, name?.lastName)} · ${p.action?.name || p.actionId}`,
      tab: 'activities',
    })
  }
  if (pending.length > 6) {
    alerts.push({
      kind: 'info',
      icon: 'ph-fill ph-hourglass-medium',
      title: `و${pending.length - 6} أنشطة أخرى قيد المراجعة`,
      sub: 'افتح سجل الأنشطة للمراجعة',
      tab: 'activities',
    })
  }

  // أعضاء خاملون / متوقفون
  for (const m of membersData) {
    if (m.status === 'INACTIVE' || m.status === 'SUSPENDED') continue
    const st = activityStatus(m.entries)
    if (st.key === 'dormant' && st.since !== Infinity) {
      alerts.push({
        kind: 'danger',
        icon: 'ph-fill ph-moon',
        title: `عضو متوقف: ${fullName(m.firstName, m.lastName)}`,
        sub: `آخر نشاط منذ ${st.since} يوم`,
        tab: 'pulse',
      })
    } else if (st.key === 'idle') {
      alerts.push({
        kind: 'warn',
        icon: 'ph-fill ph-warning',
        title: `عضو يحتاج متابعة: ${fullName(m.firstName, m.lastName)}`,
        sub: `خامل منذ ${st.since} يوم`,
        tab: 'pulse',
      })
    }
  }

  // قرب الترقية (تحفيز)
  for (const m of membersData) {
    const total = memberTotal(m.entries, actionMap)
    const gap = nextLevelGap(total)
    if (gap && gap.gap > 0 && gap.gap <= 50) {
      alerts.push({
        kind: 'ok',
        icon: 'ph-fill ph-arrow-fat-up',
        title: `${fullName(m.firstName, m.lastName)} يقترب من الترقية`,
        sub: `يبعد ${gap.gap} نقطة عن «${gap.name}»`,
        tab: 'card',
        memberId: m.id,
      })
    }
  }

  // بوابات متعثرة
  for (const m of membersData) {
    const gateKey = `${m.id}_${year}_${month}`
    const passed = gates.get(gateKey) ?? true
    const pts = memberMonthlyPoints(m.entries, actionMap, year, month)
    if (pts > 0 && !passed) {
      alerts.push({
        kind: 'warn',
        icon: 'ph-fill ph-lock-key',
        title: `بوابة متعثرة: ${fullName(m.firstName, m.lastName)}`,
        sub: `${pts} نقطة هذا الشهر دون استحقاق`,
        tab: 'rewards',
      })
    }
  }

  return alerts
}
