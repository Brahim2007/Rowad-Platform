'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { NativeSelect } from '@/components/ui/native-select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FieldHelp } from '@/components/shared/FieldHelp'

/**
 * لوحة أثر الرواد — Impact Dashboard
 * نظام النقاط والمستويات والمكافآت والدروع
 * مبني على النموذج المرجعي: lawhat_athar_alruwwad
 */

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import {
  Activity, Calculator, TrendingUp,
  CheckCircle, ClipboardCheck, Crown, Download, Eye, FileText,
  Settings,
  Info, Medal, Pencil, Plus, Printer,
  Shield, ShieldCheck, Star, Trash,
  User, UserCheck, Users, TriangleAlert, X,
  ChevronDown, Search, Building2, UserRoundCheck, ListFilter, RotateCcw, Mail,
  Copy, ExternalLink, CalendarDays, Target, IdCard,
} from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { finalPoints, buildActionMap, type ImpactCategory } from '@/lib/impact-scoring'
import { downloadCSV, exportMembersCSV, exportActivitiesCSV } from '@/lib/export-csv'
import type { ImpactReportMetrics, SmartImpactReport } from '@/lib/ai/impact-report'
import { printElement } from '@/lib/report-export'

// ═══════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════

interface ImpactActionItem {
  id: string
  name: string
  points: number
  category: ImpactCategory
  note?: string | null
  isActive: boolean
  sortOrder: number
}

interface ImpactLogFull {
  id: string
  beneficiaryId: string
  actionId: string
  action: ImpactActionItem
  count: number
  quality: string
  status: string
  date: string
  link?: string | null
  note?: string | null
  createdBy?: string | null
  platformId?: string | null
  beneficiary?: { id: string; firstName: string; lastName: string; code: string; networkRole?: string | null }
}

interface ImpactAwardFull {
  id: string
  beneficiaryId: string
  type: string
  title: string
  value: number
  date: string
  note?: string | null
  beneficiary?: { id: string; firstName: string; lastName: string; code: string }
}

interface ImpactGateItem {
  beneficiaryId: string
  year: number
  month: number
  passed: boolean
}

interface BeneficiaryInfo {
  id: string
  firstName: string
  lastName: string
  code: string
  networkRole?: string | null
  platformId?: string | null
  platformName?: string | null
  joinDate?: string | null
  status: string
  email?: string | null
  phone?: string | null
  impactNote?: string | null
}

interface DashboardData {
  scope: { type: string; year?: number; month?: number; ref?: string }
  kpis: { memberCount: number; activeNow: number; actCount: number; totalPoints: number; badgeCount: number; topMember: { name: string; total: number } | null }
  catTotals: Record<string, number>
  topByRole: Record<string, { name: string; val: number } | null>
  top10: Array<{ name: string; code: string; networkRole: string; platformName: string; total: number; level: string; acts: number }>
  platforms: Array<{ platform: string; count: number; acts: number; points: number; best: string; bestVal: number; avg: number }>
  alerts: Array<{ kind: string; icon: string; title: string; sub: string; tab: string; memberId?: string }>
  settings: { qualityBonus: Record<string, number>; levels: Array<{ name: string; from: number; to: number; desc?: string }>; rewardTiers: Array<{ name: string; from: number; to: number }>; umrah: any } | null
}

interface PaginationState {
  page: number
  pageSize: number
  total: number | null
  totalPages: number | null
  hasMore: boolean
}

// ═══════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════

const CATEGORY_LABELS: Record<string, string> = {
  DIGITAL_ACTIVITY: 'النشاط الرقمي',
  SCIENTIFIC_EVENTS: 'المشاركة العلمية والفعاليات',
  INITIATIVES: 'المبادرات والإنتاج',
  DISCIPLINE: 'الالتزام والانضباط',
}

const CATEGORY_COLORS: Record<string, string> = {
  DIGITAL_ACTIVITY: 'bg-sky-100 text-sky-700',
  SCIENTIFIC_EVENTS: 'bg-green-100 text-green-700',
  INITIATIVES: 'bg-purple-100 text-purple-700',
  DISCIPLINE: 'bg-orange-100 text-orange-700',
}

const QUALITY_LABELS: Record<string, string> = {
  WEAK: 'ضعيف', ACCEPTABLE: 'مقبول', GOOD: 'جيد', EXCELLENT: 'ممتاز', EXCEPTIONAL: 'استثنائي',
}

const STATUS_LABELS: Record<string, string> = {
  APPROVED: 'معتمد', PENDING_REVIEW: 'قيد المراجعة', REJECTED: 'مرفوض',
}

const STATUS_COLORS: Record<string, string> = {
  APPROVED: 'bg-green-50 text-green-700', PENDING_REVIEW: 'bg-amber-50 text-amber-700', REJECTED: 'bg-red-50 text-red-700',
}

const APPROVAL_STATUSES = ['PENDING_REVIEW', 'APPROVED', 'REJECTED']
const QUALITIES = ['WEAK', 'ACCEPTABLE', 'GOOD', 'EXCELLENT', 'EXCEPTIONAL']
const NETWORK_ROLES = ['باحث ومفكر', 'مؤثر رقمي', 'متطوع', 'مشرف', 'رئيس منصة']
const AWARD_TYPES = { SHIELD: 'درع', REWARD: 'مكافأة' }
const BADGE_CATALOG = [
  'درع رائد الشهر', 'درع المؤثر الرقمي', 'درع الباحث المنتج', 'درع المتطوع المثالي',
  'درع المبادرة', 'درع العطاء المستمر', 'درع القيادة', 'درع العضو الصاعد', 'درع الوفاء',
  'جائزة رائد السنة', 'جائزة المؤثر الأول', 'جائزة الباحث الملهم',
  'جائزة المتطوع الذهبي', 'جائزة القيادة', 'جائزة العمرة',
]
const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
const PAGE_SIZE = 25
const DEFAULT_QUALITY_BONUS: Record<string, number> = {
  WEAK: -3,
  ACCEPTABLE: 0,
  GOOD: 3,
  EXCELLENT: 6,
  EXCEPTIONAL: 10,
}

// ═══════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════

function Badge({ children, className }: { children: ReactNode; className: string }) {
  return <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>{children}</span>
}

function dateLabel(date: string) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('ar')
}

function today() { return new Date().toISOString().slice(0, 10) }

function fullName(f?: string, l?: string) { return [f, l].filter(Boolean).join(' ') || '—' }

const scopeLabel = (sc: { type: string; year?: number; month?: number; ref?: string }) => {
  if (sc.type === 'month' && sc.year && sc.month) return `${MONTHS[sc.month - 1]} ${sc.year}`
  if (sc.type === 'week' && sc.ref) return `الأسبوع المنتهي ${sc.ref}`
  return 'الإجمالي التراكمي'
}

function mergeUniqueById<T extends { id: string }>(current: T[], incoming: T[]) {
  const map = new Map(current.map(item => [item.id, item]))
  for (const item of incoming) map.set(item.id, item)
  return Array.from(map.values())
}

function resourcesForTab(tab: string) {
  const resources: string[] = []
  if (tab === 'dashboard') resources.push('dashboard')
  if (['members', 'activities', 'card', 'pulse', 'rewards', 'reports'].includes(tab)) {
    resources.push('members', 'actions')
  }
  if (tab === 'settings') resources.push('actions')
  if (['activities', 'card', 'pulse', 'rewards', 'reports'].includes(tab)) resources.push('logs')
  if (tab === 'rewards' || tab === 'card') resources.push('awards_gates')
  return resources
}

// ═══════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════

export default function ImpactDashboardPage() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab') || 'dashboard'
  const platformIdParam = searchParams.get('platformId') || ''
  const [activeTab, setActiveTab] = useState(tabParam)
  const loadedTabsRef = useRef(new Set<string>())
  const loadedResourcesRef = useRef(new Set<string>())
  const resourceRequestsRef = useRef(new Map<string, Promise<void>>())
  const tabRequestsRef = useRef(new Map<string, Promise<void>>())

  // Sync tab state with URL
  useEffect(() => {
    setActiveTab(tabParam)
    setTabLoading(!loadedTabsRef.current.has(tabParam))
  }, [tabParam])

  /** تغيير التبويب مع تحديث الرابط */
  const switchTab = (tab: string) => {
    setActiveTab(tab)
    setTabLoading(!loadedTabsRef.current.has(tab))
    const params = new URLSearchParams(searchParams.toString())
    if (tab === 'dashboard') {
      params.delete('tab')
    } else {
      params.set('tab', tab)
    }
    const qs = params.toString()
    window.history.replaceState(null, '', `/ar/admin/impact${qs ? `?${qs}` : ''}`)
  }

  // Data states
  const [beneficiaries, setBeneficiaries] = useState<BeneficiaryInfo[]>([])
  const [actions, setActions] = useState<ImpactActionItem[]>([])
  const [logs, setLogs] = useState<ImpactLogFull[]>([])
  const [awards, setAwards] = useState<ImpactAwardFull[]>([])
  const [gates, setGates] = useState<ImpactGateItem[]>([])
  const [dashData, setDashData] = useState<DashboardData | null>(null)
  const [tabLoading, setTabLoading] = useState(true)
  const [membersPagination, setMembersPagination] = useState<PaginationState>({ page: 0, pageSize: PAGE_SIZE, total: null, totalPages: null, hasMore: false })
  const [logsPagination, setLogsPagination] = useState<PaginationState>({ page: 0, pageSize: PAGE_SIZE, total: null, totalPages: null, hasMore: false })
  const [loadingMoreMembers, setLoadingMoreMembers] = useState(false)
  const [loadingMoreLogs, setLoadingMoreLogs] = useState(false)

  const loadMembersPage = useCallback(async (page = 1, append = false) => {
    const res = await fetch(`/api/admin/members?page=${page}&pageSize=${PAGE_SIZE}&compact=1${platformIdParam ? `&platformId=${encodeURIComponent(platformIdParam)}` : ''}`)
    const data = await res.json()
    if (!data.success) throw new Error(data.message || 'فشل تحميل الأعضاء')
    const nextMembers = data.data?.members || data.data || []
    setBeneficiaries(current => append ? mergeUniqueById(current, nextMembers) : nextMembers)
    setMembersPagination({
      page: data.pagination?.page ?? page,
      pageSize: data.pagination?.pageSize ?? data.pagination?.limit ?? PAGE_SIZE,
      total: data.pagination?.total ?? null,
      totalPages: data.pagination?.totalPages ?? null,
      hasMore: data.pagination?.hasMore ?? false,
    })
  }, [platformIdParam])

  const loadLogsPage = useCallback(async (page = 1, append = false) => {
    const res = await fetch(`/api/admin/impact/logs?page=${page}&pageSize=${PAGE_SIZE}&compact=1${platformIdParam ? `&platformId=${encodeURIComponent(platformIdParam)}` : ''}`)
    const data = await res.json()
    if (!data.success) throw new Error(data.message || 'فشل تحميل الأنشطة')
    const nextLogs = data.data || []
    setLogs(current => append ? mergeUniqueById(current, nextLogs) : nextLogs)
    setLogsPagination({
      page: data.pagination?.page ?? page,
      pageSize: data.pagination?.pageSize ?? data.pagination?.limit ?? PAGE_SIZE,
      total: data.pagination?.total ?? null,
      totalPages: data.pagination?.totalPages ?? null,
      hasMore: data.pagination?.hasMore ?? false,
    })
  }, [platformIdParam])

  const loadMoreMembers = useCallback(async () => {
    if (loadingMoreMembers || !membersPagination.hasMore) return
    setLoadingMoreMembers(true)
    try {
      await loadMembersPage(membersPagination.page + 1, true)
    } catch (e) {
      console.error('Failed to load more members:', e)
      toast.error('فشل تحميل المزيد من الأعضاء')
    } finally {
      setLoadingMoreMembers(false)
    }
  }, [loadMembersPage, loadingMoreMembers, membersPagination.hasMore, membersPagination.page])

  const loadMoreLogs = useCallback(async () => {
    if (loadingMoreLogs || !logsPagination.hasMore) return
    setLoadingMoreLogs(true)
    try {
      await loadLogsPage(logsPagination.page + 1, true)
    } catch (e) {
      console.error('Failed to load more logs:', e)
      toast.error('فشل تحميل المزيد من الأنشطة')
    } finally {
      setLoadingMoreLogs(false)
    }
  }, [loadLogsPage, loadingMoreLogs, logsPagination.hasMore, logsPagination.page])

  const ensureResource = useCallback(async (key: string, loader: () => Promise<void>) => {
    if (loadedResourcesRef.current.has(key)) return
    const existing = resourceRequestsRef.current.get(key)
    if (existing) return existing

    const request = loader().then(() => {
      loadedResourcesRef.current.add(key)
    })
    resourceRequestsRef.current.set(key, request)
    try {
      await request
    } finally {
      if (resourceRequestsRef.current.get(key) === request) resourceRequestsRef.current.delete(key)
    }
  }, [])

  /** تحميل موارد التبويب النشط فقط مع منع الطلبات المكررة الجارية. */
  const ensureTabData = useCallback(async (tab: string) => {
    if (loadedTabsRef.current.has(tab)) return
    const existing = tabRequestsRef.current.get(tab)
    if (existing) return existing

    const loaders: Record<string, () => Promise<void>> = {
      dashboard: async () => {
        const data = await fetch('/api/admin/impact/dashboard').then(r => r.json())
        if (!data.success) throw new Error(data.message || 'فشل تحميل لوحة الأثر')
        setDashData(data.data || null)
      },
      members: () => loadMembersPage(1, false),
      actions: async () => {
        const data = await fetch('/api/admin/impact/actions').then(r => r.json())
        if (!data.success) throw new Error(data.message || 'فشل تحميل أنواع الأنشطة')
        setActions(data.data || [])
      },
      logs: () => loadLogsPage(1, false),
      awards_gates: async () => {
        const [awardsData, gatesData] = await Promise.all([
          fetch('/api/admin/impact/awards').then(r => r.json()),
          fetch('/api/admin/impact/gates').then(r => r.json()),
        ])
        if (!awardsData.success || !gatesData.success) throw new Error('فشل تحميل المكافآت')
        setAwards(awardsData.data || [])
        setGates(gatesData.data || [])
      },
    }

    const request = (async () => {
      await Promise.all(resourcesForTab(tab).map(key => ensureResource(key, loaders[key])))
      loadedTabsRef.current.add(tab)
    })()
    tabRequestsRef.current.set(tab, request)
    setTabLoading(true)

    try {
      await request
    } catch (e) {
      console.error('Failed to load tab data:', e)
      toast.error(e instanceof Error ? e.message : 'فشل تحميل بيانات التبويب')
    } finally {
      if (tabRequestsRef.current.get(tab) === request) tabRequestsRef.current.delete(tab)
      setTabLoading(tabRequestsRef.current.size > 0)
    }
  }, [ensureResource, loadLogsPage, loadMembersPage])

  /** عند تبديل التبويب، حمّل بياناته */
  useEffect(() => {
    ensureTabData(activeTab)
  }, [activeTab, ensureTabData])

  const fetchAll = useCallback(async () => {
    for (const key of resourcesForTab(activeTab)) loadedResourcesRef.current.delete(key)
    loadedTabsRef.current.delete(activeTab)
    // أي تعديل قد يغير مؤشرات الرئيسية؛ نعيد تحميلها فقط عند العودة إليها.
    if (activeTab !== 'dashboard') {
      loadedResourcesRef.current.delete('dashboard')
      loadedTabsRef.current.delete('dashboard')
    }
    await ensureTabData(activeTab)
  }, [activeTab, ensureTabData])

  // Compute member card data
  const [cardMemberId, setCardMemberId] = useState<string>(searchParams.get('memberId') || '')

  /** إعدادات الجودة الديناميكية من ImpactSettings — إن لم تكن محفوظة، نستخدم الافتراضية */
  const qualityBonus: Record<string, number> = dashData?.settings?.qualityBonus ?? DEFAULT_QUALITY_BONUS

  return (
    <div className="p-3 md:p-5 lg:p-6 max-w-7xl mx-auto">
      {/* Compact header — التبويبات في شريط الـLayout العلوي */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="text-primary-600" size={22} />
          <span className="text-lg font-bold text-neutral-900">
            {activeTab === 'dashboard' ? 'لوحة الأثر — الرئيسية' :
             activeTab === 'members' ? 'سجل الأعضاء' :
             activeTab === 'activities' ? 'سجل الأنشطة والمساهمات' :
             activeTab === 'pulse' ? 'المتابعة الدورية' :
             activeTab === 'card' ? 'بطاقة الرائد' :
             activeTab === 'rewards' ? 'المكافآت والدروع' :
             activeTab === 'reports' ? 'التقارير' :
             activeTab === 'settings' ? 'الإعدادات' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {tabLoading && (
            <div className="w-5 h-5 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          )}
          <Button unstyled onClick={fetchAll} className="btn-ghost btn-sm flex items-center gap-1.5" title="تحديث كل البيانات">
            <Download size={14} />
            تحديث
          </Button>
        </div>
      </div>

      {/* Tab Content */}
      {tabLoading && !loadedTabsRef.current.has(activeTab) ? (
        <TabContentSkeleton />
      ) : (
        <>
          {activeTab === 'dashboard' && <DashboardTab dashData={dashData} switchTab={switchTab} setCardMemberId={setCardMemberId} />}
          {activeTab === 'members' && <MembersTab beneficiaries={beneficiaries} logs={logs} actions={actions} fetchAll={fetchAll} qualityBonus={qualityBonus} setCardMemberId={setCardMemberId} switchTab={switchTab} pagination={membersPagination} onLoadMore={loadMoreMembers} loadingMore={loadingMoreMembers} />}
          {activeTab === 'activities' && <ActivitiesTab logs={logs} actions={actions} beneficiaries={beneficiaries} fetchAll={fetchAll} qualityBonus={qualityBonus} pagination={logsPagination} onLoadMore={loadMoreLogs} loadingMore={loadingMoreLogs} />}
          {activeTab === 'pulse' && <PulseTab beneficiaries={beneficiaries} logs={logs} actions={actions} qualityBonus={qualityBonus} setCardMemberId={setCardMemberId} switchTab={switchTab} />}
          {activeTab === 'card' && (
            <CardTab
              beneficiaries={beneficiaries} logs={logs} actions={actions} awards={awards}
              cardMemberId={cardMemberId} setCardMemberId={setCardMemberId}
              qualityBonus={qualityBonus}
            />
          )}
          {activeTab === 'rewards' && <RewardsTab beneficiaries={beneficiaries} logs={logs} actions={actions} awards={awards} gates={gates} fetchAll={fetchAll} qualityBonus={qualityBonus} />}
          {activeTab === 'reports' && <ReportsTab beneficiaries={beneficiaries} logs={logs} actions={actions} qualityBonus={qualityBonus} />}
          {activeTab === 'settings' && <SettingsTab actions={actions} fetchAll={fetchAll} />}
        </>
      )}
    </div>
  )
}

function TabContentSkeleton() {
  return (
    <div className="card animate-pulse" aria-label="جاري تحميل بيانات التبويب">
      <div className="h-5 w-40 rounded bg-neutral-200 mb-5" />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-10 rounded bg-neutral-100" />
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════
// Tab: Dashboard (الرئيسية)
// ═══════════════════════════════════════════════

function DashboardTab({
  dashData,
  switchTab,
  setCardMemberId,
}: {
  dashData: DashboardData | null
  switchTab: (tab: string) => void
  setCardMemberId: (id: string) => void
}) {
  const now = useMemo(() => new Date(), [])
  const [data, setData] = useState<DashboardData | null>(dashData)
  const [draftScope, setDraftScope] = useState<{ type: string; year?: number; month?: number; ref?: string }>(
    dashData?.scope ?? { type: 'all' },
  )
  const [scopeLoading, setScopeLoading] = useState(false)

  useEffect(() => {
    setData(dashData)
    if (dashData?.scope) setDraftScope(dashData.scope)
  }, [dashData])

  const applyScope = async (event: FormEvent) => {
    event.preventDefault()
    const params = new URLSearchParams({ scope: draftScope.type })
    if (draftScope.type === 'month') {
      params.set('year', String(draftScope.year || now.getFullYear()))
      params.set('month', String(draftScope.month || now.getMonth() + 1))
    }
    if (draftScope.type === 'week') {
      params.set('ref', draftScope.ref || now.toISOString().slice(0, 10))
    }

    setScopeLoading(true)
    try {
      const response = await fetch(`/api/admin/impact/dashboard?${params.toString()}`, { cache: 'no-store' })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.message || 'تعذر تحديث المؤشرات')
      setData(result.data)
      setDraftScope(result.data.scope)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'تعذر تحديث المؤشرات')
    } finally {
      setScopeLoading(false)
    }
  }

  if (!data) {
    return <div className="card text-center py-12 text-neutral-400"><Shield size={36} className="mx-auto mb-3 text-neutral-300" /><p>لا توجد بيانات للوحة الأثر بعد</p></div>
  }

  const { kpis, top10, platforms, alerts, topByRole } = data
  const engagementRate = kpis.memberCount ? Math.round((kpis.activeNow / kpis.memberCount) * 100) : 0
  const categoryEntries = Object.entries(data.catTotals).sort((a, b) => b[1] - a[1])
  const maxCategoryPoints = Math.max(...categoryEntries.map(([, value]) => value), 1)
  const topPlatform = platforms[0]
  const quickActions = [
    { label: 'إضافة عضو', hint: 'إنشاء وإدارة الحسابات', icon: Users, tab: 'members' },
    { label: 'تسجيل نشاط', hint: 'إضافة مساهمة جديدة', icon: Plus, tab: 'activities' },
    { label: 'متابعة الأداء', hint: 'الحضور والالتزام', icon: TrendingUp, tab: 'pulse' },
    { label: 'إنشاء تقرير', hint: 'التقارير والذكاء الاصطناعي', icon: FileText, tab: 'reports' },
  ]

  const openAlert = (alert: DashboardData['alerts'][number]) => {
    if (alert.memberId && alert.tab === 'card') setCardMemberId(alert.memberId)
    switchTab(alert.tab)
  }

  return (
    <div className={`space-y-5 transition-opacity ${scopeLoading ? 'opacity-70' : ''}`} aria-busy={scopeLoading}>
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-primary-800 via-primary-700 to-primary-600 p-5 text-white shadow-lg md:p-7">
        <div className="absolute -start-20 -top-24 h-56 w-56 rounded-full bg-white/10" />
        <div className="absolute -bottom-28 end-1/4 h-52 w-52 rounded-full bg-primary-300/10" />
        <div className="relative grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <div>
            <Badge className="mb-4 bg-white/15 text-white">مركز قيادة الأثر</Badge>
            <h1 className="text-2xl font-black tracking-tight md:text-3xl">صورة تشغيلية موحّدة لأداء شبكة الرواد</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-primary-50">
              راقب نشاط الأعضاء والمنصات، التقط الحالات التي تحتاج تدخلاً، وانتقل مباشرة إلى الإجراء المناسب.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-white/12 px-3 py-1.5">الفترة: {scopeLabel(data.scope)}</span>
              <span className="rounded-full bg-white/12 px-3 py-1.5">نشاط الشهر الحالي: {engagementRate}%</span>
              <span className="rounded-full bg-white/12 px-3 py-1.5">تنبيهات تشغيلية: {alerts.length}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <div className="text-xs text-primary-100">المنصة الأعلى أثرًا</div>
              <div className="mt-2 line-clamp-2 text-sm font-bold">{topPlatform?.platform || 'لا توجد بيانات'}</div>
              <div className="mt-1 text-xl font-black">{topPlatform?.points?.toLocaleString('ar-SA') || 0} <span className="text-xs font-medium">نقطة</span></div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <div className="text-xs text-primary-100">متصدر الفترة</div>
              <div className="mt-2 line-clamp-2 text-sm font-bold">{kpis.topMember?.name || 'لا يوجد'}</div>
              <div className="mt-1 text-xl font-black">{kpis.topMember?.total?.toLocaleString('ar-SA') || 0} <span className="text-xs font-medium">نقطة</span></div>
            </div>
          </div>
        </div>
      </section>

      <form onSubmit={applyScope} className="card flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-[150px] flex-1">
          <label htmlFor="impact-dashboard-scope" className="mb-1.5 block text-xs font-bold text-neutral-600">نطاق المؤشرات</label>
          <NativeSelect
            id="impact-dashboard-scope"
            aria-label="نطاق المؤشرات"
            value={draftScope.type}
            onChange={event => {
              const type = event.target.value
              setDraftScope(type === 'month'
                ? { type, year: now.getFullYear(), month: now.getMonth() + 1 }
                : type === 'week'
                  ? { type, ref: now.toISOString().slice(0, 10) }
                  : { type })
            }}
          >
            <option value="all">الإجمالي التراكمي</option>
            <option value="month">شهر محدد</option>
            <option value="week">أسبوع محدد</option>
          </NativeSelect>
        </div>
        {draftScope.type === 'month' && (
          <>
            <div className="w-[110px]">
              <label htmlFor="impact-dashboard-year" className="mb-1.5 block text-xs font-bold text-neutral-600">السنة</label>
              <Input id="impact-dashboard-year" aria-label="سنة المؤشرات" type="number" min="2020" max="2100" value={draftScope.year || now.getFullYear()} onChange={event => setDraftScope(current => ({ ...current, year: Number(event.target.value) }))} />
            </div>
            <div className="min-w-[140px] flex-1">
              <label htmlFor="impact-dashboard-month" className="mb-1.5 block text-xs font-bold text-neutral-600">الشهر</label>
              <NativeSelect id="impact-dashboard-month" aria-label="شهر المؤشرات" value={draftScope.month || now.getMonth() + 1} onChange={event => setDraftScope(current => ({ ...current, month: Number(event.target.value) }))}>
                {MONTHS.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}
              </NativeSelect>
            </div>
          </>
        )}
        {draftScope.type === 'week' && (
          <div className="min-w-[180px] flex-1">
            <label htmlFor="impact-dashboard-week" className="mb-1.5 block text-xs font-bold text-neutral-600">مرجع الأسبوع</label>
            <Input id="impact-dashboard-week" aria-label="تاريخ أسبوع المؤشرات" type="date" value={draftScope.ref || now.toISOString().slice(0, 10)} onChange={event => setDraftScope(current => ({ ...current, ref: event.target.value }))} />
          </div>
        )}
        <Button type="submit" disabled={scopeLoading} className="h-10 min-w-[110px]">
          {scopeLoading ? 'جارٍ التحديث...' : 'تطبيق الفترة'}
        </Button>
        <Badge className="bg-neutral-100 text-neutral-600">{scopeLabel(data.scope)}</Badge>
      </form>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <KpiCard icon={Users} label="إجمالي الأعضاء" value={kpis.memberCount} color="bg-primary-100 text-primary-700" />
        <KpiCard icon={UserCheck} label="نشطون هذا الشهر" value={kpis.activeNow} color="bg-emerald-100 text-emerald-700" />
        <KpiCard icon={CheckCircle} label="أنشطة الفترة" value={kpis.actCount} color="bg-sky-100 text-sky-700" />
        <KpiCard icon={Star} label="نقاط الفترة" value={kpis.totalPoints.toLocaleString('ar-SA')} color="bg-amber-100 text-amber-700" />
        <KpiCard icon={Shield} label="الدروع الممنوحة" value={kpis.badgeCount} color="bg-orange-100 text-orange-700" />
        <KpiCard icon={Activity} label="معدل المشاركة" value={`${engagementRate}%`} color="bg-violet-100 text-violet-700" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <div className="card p-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-neutral-100 p-5">
            <div>
              <h2 className="font-bold text-neutral-900">أداء المنصات</h2>
              <p className="mt-1 text-xs text-neutral-500">مقارنة النقاط والأنشطة ومتوسط أثر العضو</p>
            </div>
            <Link href="/ar/admin/platforms-overview" className="btn-ghost btn-sm flex items-center gap-1.5">
              مركز المتابعة <ExternalLink size={14} />
            </Link>
          </div>
          {platforms.length ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">المنصة</TableHead>
                    <TableHead className="text-center">الأعضاء</TableHead>
                    <TableHead className="text-center">الأنشطة</TableHead>
                    <TableHead className="text-center">النقاط</TableHead>
                    <TableHead className="text-center">المتوسط</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {platforms.slice(0, 6).map((platform, index) => (
                    <TableRow key={platform.platform}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-xs font-black text-primary-700">{index + 1}</span>
                          <div>
                            <div className="max-w-[260px] truncate font-semibold text-neutral-800">{platform.platform}</div>
                            <div className="text-[11px] text-neutral-400">الأفضل: {platform.best}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{platform.count}</TableCell>
                      <TableCell className="text-center">{platform.acts}</TableCell>
                      <TableCell className="text-center font-bold">{platform.points.toLocaleString('ar-SA')}</TableCell>
                      <TableCell className="text-center"><Badge className="bg-neutral-100 text-neutral-700">{platform.avg}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : <EmptyDashboardState text="لا توجد أنشطة منصات ضمن الفترة المختارة" />}
        </div>

        <div className="card">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <h2 className="font-bold text-neutral-900">حالات تحتاج متابعة</h2>
              <p className="mt-1 text-xs text-neutral-500">تنبيهات محسوبة من السجلات الحالية</p>
            </div>
            <Badge className={alerts.length ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}>{alerts.length}</Badge>
          </div>
          {alerts.length ? (
            <div className="space-y-2.5">
              {alerts.slice(0, 5).map((alert, index) => (
                <button key={`${alert.title}-${index}`} type="button" onClick={() => openAlert(alert)} className="group flex w-full items-center gap-3 rounded-2xl border border-neutral-100 bg-neutral-50/70 p-3 text-right transition hover:border-primary-200 hover:bg-primary-50">
                  <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${alert.kind === 'danger' ? 'bg-red-100 text-red-700' : alert.kind === 'warn' ? 'bg-amber-100 text-amber-700' : alert.kind === 'ok' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                    <TriangleAlert size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-neutral-800">{alert.title}</span>
                    <span className="block truncate text-xs text-neutral-500">{alert.sub}</span>
                  </span>
                  <ChevronDown size={16} className="rotate-90 text-neutral-300 transition group-hover:text-primary-600" />
                </button>
              ))}
            </div>
          ) : <EmptyDashboardState text="لا توجد حالات عاجلة حاليًا" positive />}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <div className="card">
          <div className="mb-5">
            <h2 className="font-bold text-neutral-900">توزيع مجالات الأثر</h2>
            <p className="mt-1 text-xs text-neutral-500">النقاط حسب نوع المساهمة</p>
          </div>
          {categoryEntries.length ? (
            <div className="space-y-4">
              {categoryEntries.map(([category, value], index) => (
                <div key={category}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="font-semibold text-neutral-700">{category}</span>
                    <span className="font-bold text-neutral-900">{value.toLocaleString('ar-SA')}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                    <div className={`h-full rounded-full ${['bg-primary-500', 'bg-emerald-500', 'bg-amber-500', 'bg-violet-500'][index % 4]}`} style={{ width: `${Math.max((value / maxCategoryPoints) * 100, value ? 4 : 0)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : <EmptyDashboardState text="لا توجد نقاط ضمن الفترة" />}
        </div>

        <div className="card">
          <div className="mb-5">
            <h2 className="font-bold text-neutral-900">المتميزون حسب الصفة</h2>
            <p className="mt-1 text-xs text-neutral-500">أعلى عضو في كل مسار</p>
          </div>
          <div className="space-y-2.5">
            {Object.entries(topByRole).map(([role, member]) => (
              <div key={role} className="flex items-center gap-3 rounded-xl border border-neutral-100 p-3">
                <Crown size={16} className="text-amber-500" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-neutral-800">{member?.name || 'لا يوجد عضو'}</div>
                  <div className="text-xs text-neutral-500">{role}</div>
                </div>
                <span className="text-xs font-black text-primary-700">{member?.val || 0}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="mb-5">
            <h2 className="font-bold text-neutral-900">إجراءات سريعة</h2>
            <p className="mt-1 text-xs text-neutral-500">انتقل مباشرة إلى العمل المطلوب</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map(action => (
              <button key={action.tab} type="button" onClick={() => switchTab(action.tab)} className="rounded-2xl border border-neutral-100 bg-neutral-50 p-3 text-right transition hover:border-primary-200 hover:bg-primary-50">
                <action.icon size={18} className="mb-3 text-primary-600" />
                <span className="block text-sm font-bold text-neutral-800">{action.label}</span>
                <span className="mt-1 block text-[11px] leading-5 text-neutral-500">{action.hint}</span>
              </button>
            ))}
          </div>
          <Link href="/ar/admin/ai-governance" className="mt-3 flex items-center justify-between rounded-2xl bg-neutral-900 p-3 text-sm font-bold text-white transition hover:bg-neutral-800">
            مركز التقييم والتقويم الذكي
            <ExternalLink size={15} />
          </Link>
        </div>
      </section>

      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between border-b border-neutral-100 p-5">
          <div>
            <h2 className="font-bold text-neutral-900">ترتيب الرواد — {scopeLabel(data.scope)}</h2>
            <p className="mt-1 text-xs text-neutral-500">أعلى عشرة أعضاء حسب النقاط المعتمدة</p>
          </div>
          <Button unstyled onClick={() => switchTab('members')} className="btn-ghost btn-sm">عرض الأعضاء</Button>
        </div>
        {top10.length ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الترتيب</TableHead>
                  <TableHead className="text-right">العضو</TableHead>
                  <TableHead className="text-right">المنصة</TableHead>
                  <TableHead className="text-center">الأنشطة</TableHead>
                  <TableHead className="text-center">النقاط</TableHead>
                  <TableHead className="text-center">المستوى</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {top10.map((member, index) => (
                  <TableRow key={member.code}>
                    <TableCell><span className={`inline-flex size-7 items-center justify-center rounded-full text-xs font-black ${index < 3 ? 'bg-amber-100 text-amber-800' : 'bg-neutral-100 text-neutral-500'}`}>{index + 1}</span></TableCell>
                    <TableCell>
                      <div className="font-bold text-neutral-800">{member.name}</div>
                      <div className="text-[11px] text-neutral-400">ID: {member.code}</div>
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate text-neutral-600">{member.platformName || 'غير محدد'}</TableCell>
                    <TableCell className="text-center">{member.acts}</TableCell>
                    <TableCell className="text-center font-black">{member.total.toLocaleString('ar-SA')}</TableCell>
                    <TableCell className="text-center"><Badge className="bg-primary-100 text-primary-700">{member.level}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : <EmptyDashboardState text="لا يوجد ترتيب ضمن الفترة المختارة" />}
      </div>
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <div className="card group min-w-0 p-4 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className={`mb-3 flex size-10 items-center justify-center rounded-2xl ${color}`}><Icon size={18} /></div>
      <div className="truncate text-xl font-black text-neutral-900">{value}</div>
      <div className="mt-1 text-xs text-neutral-500">{label}</div>
    </div>
  )
}

function EmptyDashboardState({ text, positive = false }: { text: string; positive?: boolean }) {
  return (
    <div className="flex min-h-36 flex-col items-center justify-center px-5 py-8 text-center">
      {positive ? <CheckCircle size={26} className="mb-2 text-emerald-500" /> : <Activity size={26} className="mb-2 text-neutral-300" />}
      <p className="text-sm text-neutral-500">{text}</p>
    </div>
  )
}

// ═══════════════════════════════════════════════
// Tab: Members (الأعضاء)
// ═══════════════════════════════════════════════

function MembersTab({
  beneficiaries,
  logs,
  actions,
  fetchAll,
  qualityBonus,
  setCardMemberId,
  switchTab,
  pagination,
  onLoadMore,
  loadingMore,
}: {
  beneficiaries: BeneficiaryInfo[]
  logs: ImpactLogFull[]
  actions: ImpactActionItem[]
  fetchAll: () => void
  qualityBonus: Record<string, number>
  setCardMemberId: (id: string) => void
  switchTab: (tab: string) => void
  pagination: PaginationState
  onLoadMore: () => void
  loadingMore: boolean
}) {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [platformFilter, setPlatformFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'name' | 'points' | 'activities'>('newest')
  const [showModal, setShowModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editing, setEditing] = useState<BeneficiaryInfo | null>(null)
  const [form, setForm] = useState({ networkRole: '', platformId: '', impactNote: '', joinDate: '' })
  const [createForm, setCreateForm] = useState({
    firstName: '', lastName: '', code: '', email: '', phone: '',
    networkRole: '', platformId: '', joinDate: today(), impactNote: '',
  })
  const [submitting, setSubmitting] = useState(false)

  /** فتح نافذة إضافة عضو جديد */
  const openCreate = () => {
    setCreateForm({ firstName: '', lastName: '', code: '', email: '', phone: '', networkRole: '', platformId: '', joinDate: today(), impactNote: '' })
    setShowCreateModal(true)
  }

  const platformOptions = useMemo(() => {
    const platforms = new Map<string, string>()
    for (const member of beneficiaries) {
      if (member.platformId) platforms.set(member.platformId, member.platformName || member.platformId)
    }
    return Array.from(platforms.entries()).sort((a, b) => a[1].localeCompare(b[1], 'ar'))
  }, [beneficiaries])

  // تجميع النقاط والأنشطة بمرور واحد لتجنب تصفية السجل كاملًا لكل عضو.
  const memberMetrics = useMemo(() => {
    const map = new Map<string, { points: number; activities: number }>()
    const actionMap = new Map(actions.map(a => [a.id, a]))
    for (const log of logs) {
      const current = map.get(log.beneficiaryId) || { points: 0, activities: 0 }
      current.points += finalPoints(log as any, actionMap as any, qualityBonus as any)
      current.activities += 1
      map.set(log.beneficiaryId, current)
    }
    return map
  }, [logs, actions, qualityBonus])

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('ar')
    const result = beneficiaries.filter(member => {
      const searchable = [
        fullName(member.firstName, member.lastName), member.code, member.email,
        member.phone, member.platformName, member.networkRole,
      ].filter(Boolean).join(' ').toLocaleLowerCase('ar')
      if (query && !searchable.includes(query)) return false
      if (roleFilter && member.networkRole !== roleFilter) return false
      if (platformFilter && member.platformId !== platformFilter) return false
      if (statusFilter && member.status !== statusFilter) return false
      return true
    })

    return result.sort((a, b) => {
      if (sortBy === 'name') return fullName(a.firstName, a.lastName).localeCompare(fullName(b.firstName, b.lastName), 'ar')
      if (sortBy === 'points') return (memberMetrics.get(b.id)?.points || 0) - (memberMetrics.get(a.id)?.points || 0)
      if (sortBy === 'activities') return (memberMetrics.get(b.id)?.activities || 0) - (memberMetrics.get(a.id)?.activities || 0)
      return (new Date(b.joinDate || 0).getTime() - new Date(a.joinDate || 0).getTime())
    })
  }, [beneficiaries, memberMetrics, platformFilter, roleFilter, search, sortBy, statusFilter])

  const summary = useMemo(() => ({
    total: pagination.total ?? beneficiaries.length,
    active: beneficiaries.filter(member => member.status === 'ACTIVE').length,
    engaged: beneficiaries.filter(member => (memberMetrics.get(member.id)?.activities || 0) > 0).length,
    platforms: new Set(beneficiaries.map(member => member.platformId).filter(Boolean)).size,
  }), [beneficiaries, memberMetrics, pagination.total])

  const hasActiveFilters = Boolean(search || roleFilter || platformFilter || statusFilter || sortBy !== 'newest')
  const clearFilters = () => {
    setSearch('')
    setRoleFilter('')
    setPlatformFilter('')
    setStatusFilter('')
    setSortBy('newest')
  }

  const openEdit = (b: BeneficiaryInfo) => {
    setEditing(b)
    setForm({
      networkRole: b.networkRole || '',
      platformId: b.platformId || '',
      impactNote: b.impactNote || '',
      joinDate: b.joinDate ? new Date(b.joinDate).toISOString().slice(0, 10) : '',
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (!editing) return
      const res = await fetch(`/api/admin/members/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          networkRole: form.networkRole || null,
          impactNote: form.impactNote || null,
          joinDate: form.joinDate || null,
          platformId: form.platformId || null,
        }),
      })
      const data = await res.json()
      if (data.success) { toast.success('تم تحديث بيانات أثر العضو'); setShowModal(false); fetchAll() }
      else toast.error(data.message || 'فشل الحفظ')
    } catch { toast.error('فشل الحفظ') }
    finally { setSubmitting(false) }
  }

  /** إنشاء عضو جديد */
  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: createForm.firstName,
          lastName: createForm.lastName,
          email: createForm.email || null,
          phone: createForm.phone || null,
          networkRole: createForm.networkRole || null,
          platformId: createForm.platformId || null,
          impactNote: createForm.impactNote || null,
          status: 'ACTIVE',
          type: 'BENEFICIARY',
          joinDate: createForm.joinDate || undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('تم إضافة العضو بنجاح')
        setShowCreateModal(false)
        fetchAll()
      } else {
        toast.error(data.message || 'فشل إضافة العضو')
      }
    } catch { toast.error('فشل إضافة العضو') }
    finally { setSubmitting(false) }
  }

  const statusMeta: Record<string, { label: string; className: string }> = {
    ACTIVE: { label: 'نشط', className: 'bg-green-50 text-green-700 ring-green-600/15' },
    INACTIVE: { label: 'غير نشط', className: 'bg-neutral-100 text-neutral-600 ring-neutral-500/15' },
    SUSPENDED: { label: 'موقوف', className: 'bg-red-50 text-red-700 ring-red-600/15' },
  }

  const memberActions = (member: BeneficiaryInfo) => (
    <div className="flex items-center justify-end gap-1">
      <Button unstyled onClick={() => { setCardMemberId(member.id); switchTab('card') }} className="inline-flex size-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-primary-50 hover:text-primary-700" title="عرض بطاقة الرائد" aria-label={`عرض بطاقة ${fullName(member.firstName, member.lastName)}`}><Eye size={15} /></Button>
      <Button unstyled onClick={() => switchTab('activities')} className="inline-flex size-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-primary-50 hover:text-primary-700" title="تسجيل نشاط سريع" aria-label={`تسجيل نشاط لـ ${fullName(member.firstName, member.lastName)}`}><Plus size={15} /></Button>
      <Button unstyled onClick={() => openEdit(member)} className="inline-flex size-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-amber-50 hover:text-amber-700" title="تعديل بيانات العضو" aria-label={`تعديل ${fullName(member.firstName, member.lastName)}`}><Pencil size={15} /></Button>
    </div>
  )

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-primary-100 bg-gradient-to-l from-primary-900 via-primary-800 to-primary-700 text-white shadow-sm">
        <div className="flex flex-col gap-5 p-5 md:flex-row md:items-center md:justify-between md:p-6">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold text-primary-100"><Users size={15} /> إدارة مجتمع الرواد</div>
            <h2 className="text-xl font-bold md:text-2xl">سجل الأعضاء</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-primary-100">إدارة ملفات الأعضاء، ربطهم بالمنصات، ومتابعة نشاطهم ونقاط أثرهم من مساحة موحدة.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button unstyled
              onClick={() => {
                const data = filtered.map(b => ({
                  name: fullName(b.firstName, b.lastName),
                  code: b.code,
                  networkRole: b.networkRole || '',
                  platformName: b.platformName || '',
                  points: memberMetrics.get(b.id)?.points || 0,
                  status: b.status,
                }))
                exportMembersCSV(data)
              }}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-bold text-white hover:bg-white/20"
              title="تصدير CSV"
            >
              <Download size={16} />
              تصدير
            </Button>
            <Button unstyled onClick={openCreate} className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-primary-800 shadow-sm hover:bg-primary-50">
              <Plus size={16} />
              إضافة عضو
            </Button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'إجمالي الأعضاء', value: summary.total, icon: Users, color: 'bg-primary-50 text-primary-700' },
          { label: 'الأعضاء النشطون', value: summary.active, icon: UserRoundCheck, color: 'bg-green-50 text-green-700' },
          { label: 'لديهم نشاط مسجل', value: summary.engaged, icon: Activity, color: 'bg-amber-50 text-amber-700' },
          { label: 'المنصات الممثلة', value: summary.platforms, icon: Building2, color: 'bg-violet-50 text-violet-700' },
        ].map(item => (
          <div key={item.label} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`flex size-10 items-center justify-center rounded-xl ${item.color}`}><item.icon size={19} /></div>
              <div><div className="text-xl font-black text-neutral-950">{item.value.toLocaleString('ar-SA')}</div><div className="text-xs text-neutral-500">{item.label}</div></div>
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-100 p-4 md:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div><h3 className="flex items-center gap-2 font-bold text-neutral-900"><ListFilter size={17} className="text-primary-600" /> البحث والتصفية</h3><p className="mt-1 text-xs text-neutral-500">ابحث بالاسم أو الرمز أو البريد، ثم صفّ النتائج حسب المنصة والحالة.</p></div>
            {hasActiveFilters && <Button unstyled onClick={clearFilters} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-bold text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"><RotateCcw size={14} /> مسح الفلاتر</Button>}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="relative sm:col-span-2 xl:col-span-1">
              <Search size={17} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder="الاسم، رقم العضو، البريد..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pr-10"
              aria-label="البحث في الأعضاء"
            />
          </div>
          <NativeSelect value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="w-full" wrapperClassName="w-full" aria-label="تصفية حسب الصفة">
            <option value="">كل الصفات</option>
            {NETWORK_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </NativeSelect>
          <NativeSelect value={platformFilter} onChange={e => setPlatformFilter(e.target.value)} className="w-full" wrapperClassName="w-full" aria-label="تصفية حسب المنصة">
            <option value="">كل المنصات</option>
            {platformOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </NativeSelect>
          <NativeSelect value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full" wrapperClassName="w-full" aria-label="تصفية حسب الحالة">
            <option value="">كل الحالات</option><option value="ACTIVE">نشط</option><option value="INACTIVE">غير نشط</option><option value="SUSPENDED">موقوف</option>
          </NativeSelect>
          <NativeSelect value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)} className="w-full" wrapperClassName="w-full" aria-label="ترتيب الأعضاء">
            <option value="newest">الأحدث انضمامًا</option><option value="name">الاسم أبجديًا</option><option value="points">الأعلى نقاطًا</option><option value="activities">الأكثر نشاطًا</option>
          </NativeSelect>
        </div>
        </div>

        {filtered.length > 0 ? (
          <>
          <div className="hidden overflow-x-auto md:block">
            <Table className="w-full text-sm">
              <TableHeader>
                <TableRow className="border-b border-neutral-200 bg-neutral-50/80">
                  <TableHead className="text-right px-5 py-3 text-neutral-500">العضو</TableHead>
                  <TableHead className="text-right px-4 py-3 text-neutral-500">الصفة والمنصة</TableHead>
                  <TableHead className="text-center px-4 py-3 text-neutral-500">الأنشطة</TableHead>
                  <TableHead className="text-center px-4 py-3 text-neutral-500">النقاط</TableHead>
                  <TableHead className="text-center px-4 py-3 text-neutral-500">الحالة</TableHead>
                  <TableHead className="text-left px-5 py-3 text-neutral-500">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(b => (
                  <TableRow key={b.id} className="border-b border-neutral-100 transition-colors hover:bg-primary-50/30">
                    <TableCell className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 font-black text-primary-700">{b.firstName?.charAt(0)}{b.lastName?.charAt(0)}</div>
                        <div className="min-w-0">
                          <div className="font-bold text-neutral-900">{fullName(b.firstName, b.lastName)}</div>
                          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-neutral-400"><span className="font-mono">{b.code}</span>{b.email && <><span>•</span><span className="max-w-40 truncate" dir="ltr">{b.email}</span></>}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4"><Badge className="mb-1 bg-neutral-100 text-neutral-700">{b.networkRole || 'غير محدد'}</Badge><div className="max-w-56 truncate text-xs text-neutral-500">{b.platformName || 'غير مرتبط بمنصة'}</div></TableCell>
                    <TableCell className="px-4 py-4 text-center font-bold text-neutral-700">{memberMetrics.get(b.id)?.activities || 0}</TableCell>
                    <TableCell className="px-4 py-4 text-center"><span className="inline-flex min-w-12 justify-center rounded-lg bg-primary-50 px-2 py-1 font-black text-primary-700">{(memberMetrics.get(b.id)?.points || 0).toLocaleString('ar-SA')}</span></TableCell>
                    <TableCell className="px-4 py-4 text-center"><span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${(statusMeta[b.status] || statusMeta.INACTIVE).className}`}>{(statusMeta[b.status] || statusMeta.INACTIVE).label}</span></TableCell>
                    <TableCell className="px-5 py-4">{memberActions(b)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="divide-y divide-neutral-100 md:hidden">
            {filtered.map(member => (
              <article key={member.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-100 font-black text-primary-700">{member.firstName?.charAt(0)}{member.lastName?.charAt(0)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div><h4 className="font-bold text-neutral-900">{fullName(member.firstName, member.lastName)}</h4><p className="mt-0.5 font-mono text-[11px] text-neutral-400">{member.code}</p></div>
                      <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold ring-1 ring-inset ${(statusMeta[member.status] || statusMeta.INACTIVE).className}`}>{(statusMeta[member.status] || statusMeta.INACTIVE).label}</span>
                    </div>
                    <div className="mt-3 space-y-1.5 text-xs text-neutral-500">
                      <p className="flex items-center gap-2"><User size={13} />{member.networkRole || 'صفة غير محددة'}</p>
                      <p className="flex items-center gap-2"><Building2 size={13} /><span className="truncate">{member.platformName || 'غير مرتبط بمنصة'}</span></p>
                      {member.email && <p className="flex items-center gap-2"><Mail size={13} /><span className="truncate" dir="ltr">{member.email}</span></p>}
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3">
                      <div className="flex gap-3 text-xs"><span><b className="text-neutral-900">{memberMetrics.get(member.id)?.activities || 0}</b> نشاط</span><span><b className="text-primary-700">{(memberMetrics.get(member.id)?.points || 0).toLocaleString('ar-SA')}</b> نقطة</span></div>
                      {memberActions(member)}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 px-4 py-4 text-sm md:px-5">
            <span className="text-neutral-500">
              عرض <b className="text-neutral-800">{filtered.length}</b> نتيجة من أصل <b className="text-neutral-800">{pagination.total ?? beneficiaries.length}</b>
            </span>
            {pagination.hasMore && (
              <Button unstyled onClick={onLoadMore} disabled={loadingMore} className="btn-ghost btn-sm flex items-center gap-1.5">
                {loadingMore ? <div className="w-4 h-4 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" /> : <ChevronDown size={14} />}
                تحميل المزيد
              </Button>
            )}
          </div>
          </>
        ) : (
          <div className="px-5 py-14 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400"><Search size={21} /></div>
            <h3 className="mt-3 font-bold text-neutral-800">لا توجد نتائج مطابقة</h3>
            <p className="mt-1 text-sm text-neutral-500">جرّب تعديل عبارة البحث أو إزالة بعض الفلاتر.</p>
            {hasActiveFilters && <Button unstyled onClick={clearFilters} className="btn-ghost btn-sm mt-4">مسح الفلاتر</Button>}
          </div>
        )}
      </section>

      {/* Edit modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-bold text-neutral-900">تحديث بيانات الأثر</h2>
              <Button unstyled onClick={() => setShowModal(false)} className="p-1.5 text-neutral-400 hover:text-neutral-600" aria-label="إغلاق نافذة التعديل"><X size={18} /></Button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-member-role" className="block text-sm font-semibold text-neutral-700 mb-1">الصفة في الشبكة</label>
                  <NativeSelect id="edit-member-role" value={form.networkRole} onChange={e => setForm({ ...form, networkRole: e.target.value })} className="input-field">
                    <option value="">— اختر الصفة —</option>
                    {NETWORK_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </NativeSelect>
                </div>
                <div>
                  <label htmlFor="edit-member-join-date" className="block text-sm font-semibold text-neutral-700 mb-1">تاريخ الانضمام</label>
                  <Input id="edit-member-join-date" type="date" value={form.joinDate} onChange={e => setForm({ ...form, joinDate: e.target.value })} className="input-field" />
                </div>
              </div>
              <div>
                <label htmlFor="edit-member-platform" className="block text-sm font-semibold text-neutral-700 mb-1">المنصة التابعة</label>
                <NativeSelect id="edit-member-platform" value={form.platformId} onChange={e => setForm({ ...form, platformId: e.target.value })} className="input-field" wrapperClassName="w-full">
                  <option value="">— غير مرتبط بمنصة —</option>
                  {platformOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                </NativeSelect>
              </div>
              <div>
                <label htmlFor="edit-member-impact-note" className="block text-sm font-semibold text-neutral-700 mb-1">ملاحظات الأثر</label>
                <Textarea id="edit-member-impact-note" rows={3} value={form.impactNote} onChange={e => setForm({ ...form, impactNote: e.target.value })} className="input-field" placeholder="ملاحظات خاصة بلوحة الأثر..." />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button unstyled type="button" onClick={() => setShowModal(false)} className="btn-ghost btn-sm">إلغاء</Button>
                <Button unstyled type="submit" disabled={submitting} className="btn-primary btn-sm">{submitting ? 'جاري...' : 'حفظ'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-bold text-neutral-900 flex items-center gap-2"><UserCheck size={20} className="text-primary-600" /> إضافة عضو جديد</h2>
              <Button unstyled onClick={() => setShowCreateModal(false)} className="p-1.5 text-neutral-400 hover:text-neutral-600" aria-label="إغلاق نافذة إضافة عضو"><X size={18} /></Button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="new-member-first-name" className="block text-sm font-semibold text-neutral-700 mb-1">الاسم الأول *</label>
                  <Input id="new-member-first-name" required value={createForm.firstName} onChange={e => setCreateForm({ ...createForm, firstName: e.target.value })} className="input-field" placeholder="مثال: أحمد" />
                </div>
                <div>
                  <label htmlFor="new-member-last-name" className="block text-sm font-semibold text-neutral-700 mb-1">اسم العائلة *</label>
                  <Input id="new-member-last-name" required value={createForm.lastName} onChange={e => setCreateForm({ ...createForm, lastName: e.target.value })} className="input-field" placeholder="مثال: العمري" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="new-member-code" className="block text-sm font-semibold text-neutral-700 mb-1">رقم العضو</label>
                  <Input id="new-member-code" disabled value="يُولّد تلقائيًا بعد الحفظ" className="input-field" />
                </div>
                <div>
                  <label htmlFor="new-member-join-date" className="block text-sm font-semibold text-neutral-700 mb-1">تاريخ الانضمام</label>
                  <Input id="new-member-join-date" type="date" value={createForm.joinDate} onChange={e => setCreateForm({ ...createForm, joinDate: e.target.value })} className="input-field" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="new-member-email" className="block text-sm font-semibold text-neutral-700 mb-1">البريد الإلكتروني *</label>
                  <Input id="new-member-email" required type="email" value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })} className="input-field" placeholder="email@example.com" />
                </div>
                <div>
                  <label htmlFor="new-member-phone" className="block text-sm font-semibold text-neutral-700 mb-1">رقم الهاتف</label>
                  <Input id="new-member-phone" type="tel" value={createForm.phone} onChange={e => setCreateForm({ ...createForm, phone: e.target.value })} className="input-field" placeholder="+965..." />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="new-member-role" className="block text-sm font-semibold text-neutral-700 mb-1">الصفة في الشبكة</label>
                  <NativeSelect id="new-member-role" value={createForm.networkRole} onChange={e => setCreateForm({ ...createForm, networkRole: e.target.value })} className="input-field" wrapperClassName="w-full">
                    <option value="">— اختر الصفة —</option>
                    {NETWORK_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </NativeSelect>
                </div>
                <div>
                  <label htmlFor="new-member-platform" className="block text-sm font-semibold text-neutral-700 mb-1">المنصة التابعة *</label>
                  <NativeSelect id="new-member-platform" required value={createForm.platformId} onChange={e => setCreateForm({ ...createForm, platformId: e.target.value })} className="input-field" wrapperClassName="w-full">
                    <option value="">— اختر المنصة —</option>
                    {platformOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                  </NativeSelect>
                </div>
              </div>
              <div>
                <label htmlFor="new-member-impact-note" className="block text-sm font-semibold text-neutral-700 mb-1">ملاحظات الأثر</label>
                <Textarea id="new-member-impact-note" rows={2} value={createForm.impactNote} onChange={e => setCreateForm({ ...createForm, impactNote: e.target.value })} className="input-field" placeholder="ملاحظات أولية..." />
              </div>

              <div className="rounded-xl bg-primary-50 border border-primary-100 p-3 text-xs text-primary-700 flex items-start gap-2">
                <Info size={14} className="mt-0.5 flex-shrink-0" />
                <span>بعد إضافة العضو، يمكنك تسجيل أنشطته من تبويب <b>الأنشطة</b> لبدء احتساب نقاطه.</span>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button unstyled type="button" onClick={() => setShowCreateModal(false)} className="btn-ghost btn-sm">إلغاء</Button>
                <Button unstyled type="submit" disabled={submitting} className="btn-primary btn-sm">{submitting ? 'جاري...' : 'إضافة العضو'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════
// Tab: Activities (الأنشطة)
// ═══════════════════════════════════════════════

function ActivitiesTab({
  logs,
  actions,
  beneficiaries,
  fetchAll,
  qualityBonus,
  pagination,
  onLoadMore,
  loadingMore,
}: {
  logs: ImpactLogFull[]
  actions: ImpactActionItem[]
  beneficiaries: BeneficiaryInfo[]
  fetchAll: () => void
  qualityBonus: Record<string, number>
  pagination: PaginationState
  onLoadMore: () => void
  loadingMore: boolean
}) {
  const [filterMember, setFilterMember] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterSource, setFilterSource] = useState('')
  const [activitySearch, setActivitySearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<ImpactLogFull | null>(null)
  const [form, setForm] = useState({ beneficiaryId: '', actionId: '', count: '1', quality: 'ACCEPTABLE', status: 'PENDING_REVIEW', date: today(), link: '', note: '', rejectionReason: '', sourceType: 'MANUAL' })
  const [submitting, setSubmitting] = useState(false)

  const filtered = useMemo(() => {
    const query = activitySearch.trim().toLocaleLowerCase('ar')
    let result = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    if (filterMember) result = result.filter(l => l.beneficiaryId === filterMember)
    if (filterCategory) result = result.filter(l => l.action?.category === filterCategory)
    if (filterStatus) result = result.filter(l => l.status === filterStatus)
    if (filterSource) result = result.filter(l => (l as any).sourceType === filterSource)
    if (dateFrom) result = result.filter(l => l.date.slice(0, 10) >= dateFrom)
    if (dateTo) result = result.filter(l => l.date.slice(0, 10) <= dateTo)
    if (query) result = result.filter(log => [
      log.action?.name,
      log.beneficiary ? fullName(log.beneficiary.firstName, log.beneficiary.lastName) : '',
      log.beneficiary?.code,
      log.note,
    ].filter(Boolean).join(' ').toLocaleLowerCase('ar').includes(query))
    return result
  }, [logs, filterMember, filterCategory, filterStatus, filterSource, activitySearch, dateFrom, dateTo])

  const openCreate = () => {
    setEditing(null)
    setForm({ beneficiaryId: beneficiaries[0]?.id || '', actionId: actions[0]?.id || '', count: '1', quality: 'ACCEPTABLE', status: 'PENDING_REVIEW', date: today(), link: '', note: '', rejectionReason: '', sourceType: 'MANUAL' })
    setShowModal(true)
  }

  const openEdit = (log: ImpactLogFull) => {
    setEditing(log)
    setForm({
      beneficiaryId: log.beneficiaryId,
      actionId: log.actionId,
      count: String(log.count || 1),
      quality: log.quality,
      status: log.status,
      date: log.date ? log.date.slice(0, 10) : today(),
      link: log.link || '',
      note: log.note || '',
      rejectionReason: (log as any).rejectionReason || '',
      sourceType: (log as any).sourceType || 'MANUAL',
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const body = { ...form, id: editing?.id }
      const res = await fetch('/api/admin/impact/logs', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...body,
          rejectionReason: form.rejectionReason || undefined,
          sourceType: form.sourceType,
        }),
      })
      const data = await res.json()
      if (data.success) { toast.success(editing ? 'تم تحديث النشاط' : 'تم تسجيل النشاط'); setShowModal(false); fetchAll() }
      else toast.error(data.message || 'فشل')
    } catch { toast.error('فشل') }
    finally { setSubmitting(false) }
  }

  const delLog = async (id: string) => {
    if (!confirm('حذف هذا النشاط؟')) return
    try {
      const res = await fetch(`/api/admin/impact/logs?id=${id}`, { method: 'DELETE' })
      if ((await res.json()).success) { toast.success('تم الحذف'); fetchAll() }
      else toast.error('فشل الحذف')
    } catch { toast.error('فشل') }
  }

  const approveLog = async (id: string) => {
    try {
      const response = await fetch('/api/admin/impact/logs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'APPROVED' }),
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.message || 'تعذر اعتماد النشاط')
      toast.success('تم اعتماد النشاط واحتساب نقاطه')
      fetchAll()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'تعذر اعتماد النشاط')
    }
  }

  const actionMap = useMemo(() => buildActionMap(actions as any), [actions])
  const calcPts = useCallback((log: ImpactLogFull) => finalPoints(log as any, actionMap, qualityBonus as any), [actionMap, qualityBonus])
  const activitySummary = useMemo(() => ({
    total: filtered.length,
    approved: filtered.filter(log => log.status === 'APPROVED').length,
    pending: filtered.filter(log => log.status === 'PENDING_REVIEW').length,
    rejected: filtered.filter(log => log.status === 'REJECTED').length,
    points: filtered.filter(log => log.status === 'APPROVED').reduce((sum, log) => sum + calcPts(log), 0),
  }), [filtered, calcPts])
  const hasActivityFilters = Boolean(filterMember || filterCategory || filterStatus || filterSource || activitySearch || dateFrom || dateTo)
  const clearActivityFilters = () => {
    setFilterMember('')
    setFilterCategory('')
    setFilterStatus('')
    setFilterSource('')
    setActivitySearch('')
    setDateFrom('')
    setDateTo('')
  }

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-primary-100 bg-gradient-to-l from-primary-900 via-primary-800 to-primary-700 text-white shadow-sm">
        <div className="flex flex-col gap-5 p-5 md:flex-row md:items-center md:justify-between md:p-6">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold text-primary-100"><ClipboardCheck size={15} /> مركز توثيق الأثر</div>
            <h2 className="text-xl font-black md:text-2xl">سجل الأنشطة والمساهمات</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-primary-100">توثيق مساهمات الأعضاء، مراجعة الأدلة، واعتماد النقاط من سجل مركزي واحد.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button unstyled
              onClick={() => {
                const data = filtered.map(l => ({
                  date: dateLabel(l.date),
                  beneficiaryName: l.beneficiary ? fullName(l.beneficiary.firstName, l.beneficiary.lastName) : '—',
                  beneficiaryCode: l.beneficiary?.code || '—',
                  actionName: l.action?.name || '—',
                  category: l.action?.category || '',
                  count: l.count,
                  quality: QUALITY_LABELS[l.quality] || l.quality,
                  status: STATUS_LABELS[l.status] || l.status,
                  note: l.note ?? null,
                }))
                exportActivitiesCSV(data as any)
              }}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-bold text-white hover:bg-white/20"
              title="تصدير CSV"
            >
              <Download size={16} />
              تصدير
            </Button>
            <Button unstyled onClick={openCreate} className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-primary-800 shadow-sm hover:bg-primary-50"><Plus size={16} /> تسجيل نشاط</Button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          { label: 'إجمالي الأنشطة', value: activitySummary.total, tone: 'bg-primary-50 text-primary-700', icon: Activity },
          { label: 'معتمدة', value: activitySummary.approved, tone: 'bg-green-50 text-green-700', icon: CheckCircle },
          { label: 'قيد المراجعة', value: activitySummary.pending, tone: 'bg-amber-50 text-amber-700', icon: ClipboardCheck },
          { label: 'مرفوضة', value: activitySummary.rejected, tone: 'bg-red-50 text-red-700', icon: X },
          { label: 'النقاط المعتمدة', value: activitySummary.points, tone: 'bg-violet-50 text-violet-700', icon: Star },
        ].map(item => (
          <div key={item.label} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><div className={`flex size-9 items-center justify-center rounded-xl ${item.tone}`}><item.icon size={17} /></div><div><div className="text-xl font-black text-neutral-900">{item.value.toLocaleString('ar-SA')}</div><div className="text-[11px] text-neutral-500">{item.label}</div></div></div></div>
        ))}
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-100 p-4 md:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h3 className="flex items-center gap-2 font-bold text-neutral-900"><ListFilter size={17} className="text-primary-600" /> البحث والتصفية</h3><p className="mt-1 text-xs text-neutral-500">صفّ السجل حسب العضو والمحور والحالة والمصدر والفترة.</p></div>{hasActivityFilters && <Button unstyled onClick={clearActivityFilters} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-bold text-neutral-500 hover:bg-neutral-100"><RotateCcw size={14} /> مسح الفلاتر</Button>}</div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="relative sm:col-span-2">
            <Search size={17} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <Input value={activitySearch} onChange={event => setActivitySearch(event.target.value)} placeholder="اسم العضو، رقم العضو، النشاط..." className="w-full pr-10" aria-label="البحث في الأنشطة" />
          </div>
          <NativeSelect value={filterMember} onChange={e => setFilterMember(e.target.value)} className="w-full" wrapperClassName="w-full" aria-label="تصفية الأنشطة حسب العضو">
            <option value="">كل الأعضاء</option>
            {beneficiaries.map(b => <option key={b.id} value={b.id}>{fullName(b.firstName, b.lastName)} ({b.code})</option>)}
          </NativeSelect>
          <NativeSelect value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="w-full" wrapperClassName="w-full" aria-label="تصفية الأنشطة حسب المحور">
            <option value="">كل المحاور</option>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </NativeSelect>
          <NativeSelect value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full" wrapperClassName="w-full" aria-label="تصفية الأنشطة حسب الحالة">
            <option value="">كل الحالات</option>
            {APPROVAL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>)}
          </NativeSelect>
          <NativeSelect value={filterSource} onChange={e => setFilterSource(e.target.value)} className="w-full" wrapperClassName="w-full" aria-label="تصفية الأنشطة حسب المصدر">
            <option value="">كل المصادر</option><option value="MANUAL">يدوي</option><option value="PARTICIPATION">مشاركة</option><option value="ENROLLMENT">تسجيل</option><option value="REPORT">تقرير</option><option value="EVALUATION">تقييم</option><option value="EXTERNAL">خارجي</option>
          </NativeSelect>
          <label className="space-y-1"><span className="text-[11px] font-bold text-neutral-500">من تاريخ</span><Input type="date" value={dateFrom} onChange={event => setDateFrom(event.target.value)} className="w-full" /></label>
          <label className="space-y-1"><span className="text-[11px] font-bold text-neutral-500">إلى تاريخ</span><Input type="date" value={dateTo} onChange={event => setDateTo(event.target.value)} className="w-full" /></label>
        </div>
        </div>

        {filtered.length > 0 ? (
          <>
            <div className="hidden overflow-x-auto md:block">
            <Table className="w-full text-sm">
              <TableHeader>
                <TableRow className="border-b border-neutral-200">
                  <TableHead className="text-right p-3">العضو</TableHead>
                  <TableHead className="text-right p-3">النشاط</TableHead>
                  <TableHead className="text-right p-3">المحور</TableHead>
                  <TableHead className="text-center p-3">العدد</TableHead>
                  <TableHead className="text-right p-3">التاريخ</TableHead>
                  <TableHead className="text-center p-3">الجودة</TableHead>
                  <TableHead className="text-center p-3">النقاط</TableHead>
                  <TableHead className="text-center p-3">الحالة</TableHead>
                  <TableHead className="text-center p-3">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(log => {
                  const cat = log.action?.category || ''
                  const pts = calcPts(log)
                  return (
                    <TableRow key={log.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                      <TableCell className="p-3 font-semibold">{log.beneficiary ? fullName(log.beneficiary.firstName, log.beneficiary.lastName) : '—'}</TableCell>
                      <TableCell className="p-3">{log.action?.name || '—'}</TableCell>
                      <TableCell className="p-3"><Badge className={CATEGORY_COLORS[cat] || 'bg-neutral-100'}>{CATEGORY_LABELS[cat] || '—'}</Badge></TableCell>
                      <TableCell className="p-3 text-center font-mono">{log.count}</TableCell>
                      <TableCell className="p-3 text-xs">{dateLabel(log.date)}</TableCell>
                      <TableCell className="p-3 text-center text-xs">{QUALITY_LABELS[log.quality] || log.quality}</TableCell>
                      <TableCell className={`p-3 text-center font-mono font-bold ${pts < 0 ? 'text-red-600' : 'text-neutral-800'}`}>{pts}</TableCell>
                      <TableCell className="p-3 text-center"><Badge className={STATUS_COLORS[log.status] || 'bg-neutral-50'}>{STATUS_LABELS[log.status] || log.status}</Badge></TableCell>
                      <TableCell className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {log.link && <Link href={log.link} target="_blank" rel="noopener noreferrer" className="inline-flex size-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-primary-50 hover:text-primary-700" title="فتح الدليل" aria-label="فتح دليل النشاط"><ExternalLink size={14} /></Link>}
                          {log.status === 'PENDING_REVIEW' && <Button unstyled onClick={() => approveLog(log.id)} className="inline-flex size-8 items-center justify-center rounded-lg text-green-600 hover:bg-green-50 hover:text-green-700" title="اعتماد النشاط" aria-label="اعتماد النشاط"><CheckCircle size={14} /></Button>}
                          <Button unstyled onClick={() => openEdit(log)} className="inline-flex size-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-primary-50 hover:text-primary-700" title="تعديل النشاط" aria-label="تعديل النشاط"><Pencil size={14} /></Button>
                          <Button unstyled onClick={() => delLog(log.id)} className="inline-flex size-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-red-50 hover:text-red-700" title="حذف النشاط" aria-label="حذف النشاط"><Trash size={14} /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          <div className="divide-y divide-neutral-100 md:hidden">
            {filtered.map(log => {
              const points = calcPts(log)
              const category = log.action?.category || ''
              return (
                <article key={log.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><h4 className="truncate font-bold text-neutral-900">{log.action?.name || 'نشاط غير مسمى'}</h4><p className="mt-1 text-xs text-neutral-500">{log.beneficiary ? fullName(log.beneficiary.firstName, log.beneficiary.lastName) : 'عضو غير محدد'} · {dateLabel(log.date)}</p></div>
                    <span className={`rounded-lg px-2.5 py-1 font-mono text-sm font-black ${points < 0 ? 'bg-red-50 text-red-700' : 'bg-primary-50 text-primary-700'}`}>{points > 0 ? '+' : ''}{points.toLocaleString('ar-SA')}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2"><Badge className={CATEGORY_COLORS[category] || 'bg-neutral-100'}>{CATEGORY_LABELS[category] || 'غير مصنف'}</Badge><Badge className={STATUS_COLORS[log.status] || 'bg-neutral-50'}>{STATUS_LABELS[log.status] || log.status}</Badge><span className="text-[11px] text-neutral-500">{QUALITY_LABELS[log.quality] || log.quality} · العدد {log.count}</span></div>
                  <div className="mt-3 flex justify-end border-t border-neutral-100 pt-2">{log.link && <Link href={log.link} target="_blank" rel="noopener noreferrer" className="btn-ghost btn-sm no-underline">الدليل</Link>}{log.status === 'PENDING_REVIEW' && <Button unstyled onClick={() => approveLog(log.id)} className="btn-ghost btn-sm text-green-700">اعتماد</Button>}<Button unstyled onClick={() => openEdit(log)} className="btn-ghost btn-sm">تعديل</Button><Button unstyled onClick={() => delLog(log.id)} className="btn-ghost btn-sm text-red-600">حذف</Button></div>
                </article>
              )
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 px-4 py-4 text-sm md:px-5">
            <span className="text-neutral-500">
              عرض <b className="text-neutral-800">{filtered.length}</b> نتيجة من أصل <b className="text-neutral-800">{pagination.total ?? logs.length}</b>
            </span>
            {pagination.hasMore && (
              <Button unstyled onClick={onLoadMore} disabled={loadingMore} className="btn-ghost btn-sm flex items-center gap-1.5">
                {loadingMore ? <div className="w-4 h-4 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" /> : <ChevronDown size={14} />}
                تحميل المزيد
              </Button>
            )}
          </div>
          </>
        ) : <div className="px-5 py-14 text-center"><Activity size={28} className="mx-auto text-neutral-300" /><h3 className="mt-3 font-bold text-neutral-800">لا توجد أنشطة مطابقة</h3><p className="mt-1 text-sm text-neutral-500">عدّل الفلاتر أو سجّل نشاطًا جديدًا.</p>{hasActivityFilters && <Button unstyled onClick={clearActivityFilters} className="btn-ghost btn-sm mt-4">مسح الفلاتر</Button>}</div>}
      </section>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-bold text-neutral-900">{editing ? 'تعديل نشاط' : 'تسجيل نشاط جديد'}</h2>
              <Button unstyled onClick={() => setShowModal(false)} className="p-1.5 text-neutral-400 hover:text-neutral-600"><X size={18} /></Button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">العضو</label>
                  <NativeSelect required value={form.beneficiaryId} onChange={e => setForm({ ...form, beneficiaryId: e.target.value })} className="input-field">
                    {beneficiaries.map(b => <option key={b.id} value={b.id}>{fullName(b.firstName, b.lastName)} ({b.code})</option>)}
                  </NativeSelect>
                </div>
                <div>
                  <label className="mb-1 flex items-center gap-1 text-sm font-semibold text-neutral-700">
                    نوع النشاط <FieldHelp fieldKey="activity_type" label="نوع النشاط" />
                  </label>
                  <NativeSelect required value={form.actionId} onChange={e => setForm({ ...form, actionId: e.target.value })} className="input-field">
                    {actions.filter(a => a.isActive).map(a => <option key={a.id} value={a.id}>{a.name} ({a.points} نقطة)</option>)}
                  </NativeSelect>
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 flex items-center gap-1 text-sm font-semibold text-neutral-700">
                    التاريخ <FieldHelp fieldKey="activity_date" label="تاريخ النشاط" />
                  </label>
                  <Input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="mb-1 flex items-center gap-1 text-sm font-semibold text-neutral-700">
                    العدد <FieldHelp fieldKey="activity_count" label="العدد" />
                  </label>
                  <Input type="number" min="1" value={form.count} onChange={e => setForm({ ...form, count: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="mb-1 flex items-center gap-1 text-sm font-semibold text-neutral-700">
                    الجودة <FieldHelp fieldKey="activity_quality" label="الجودة" />
                  </label>
                  <NativeSelect value={form.quality} onChange={e => setForm({ ...form, quality: e.target.value })} className="input-field">
                    {QUALITIES.map(q => <option key={q} value={q}>{QUALITY_LABELS[q] || q}</option>)}
                  </NativeSelect>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 flex items-center gap-1 text-sm font-semibold text-neutral-700">
                    حالة الاعتماد <FieldHelp fieldKey="activity_status" label="حالة الاعتماد" />
                  </label>
                  <NativeSelect value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input-field">
                    {APPROVAL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>)}
                  </NativeSelect>
                </div>
                <div>
                  <label className="mb-1 flex items-center gap-1 text-sm font-semibold text-neutral-700">
                    المصدر <FieldHelp fieldKey="activity_source" label="مصدر النشاط" />
                  </label>
                  <NativeSelect value={form.sourceType} onChange={e => setForm({ ...form, sourceType: e.target.value })} className="input-field">
                    <option value="MANUAL">يدوي</option>
                    <option value="PARTICIPATION">مشاركة</option>
                    <option value="ENROLLMENT">تسجيل</option>
                    <option value="REPORT">تقرير</option>
                    <option value="EVALUATION">تقييم</option>
                    <option value="EXTERNAL">خارجي</option>
                  </NativeSelect>
                </div>
              </div>
              {form.status === 'REJECTED' && (
                <div>
                  <label className="mb-1 flex items-center gap-1 text-sm font-semibold text-red-700">
                    سبب الرفض * <FieldHelp fieldKey="activity_rejection_reason" label="سبب الرفض" />
                  </label>
                  <Textarea rows={2} required value={form.rejectionReason} onChange={e => setForm({ ...form, rejectionReason: e.target.value })} className="input-field border-red-300 focus:border-red-500" placeholder="يجب توضيح سبب رفض النشاط..." />
                </div>
              )}
              <div>
                <label className="mb-1 flex items-center gap-1 text-sm font-semibold text-neutral-700">
                  رابط الدليل <FieldHelp fieldKey="activity_evidence" label="رابط دليل النشاط" />
                </label>
                <Input value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} className="input-field" placeholder="https://..." />
              </div>
              <div>
                <label className="mb-1 flex items-center gap-1 text-sm font-semibold text-neutral-700">
                  ملاحظات <FieldHelp fieldKey="activity_note" label="ملاحظات النشاط" />
                </label>
                <Textarea rows={2} value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} className="input-field" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button unstyled type="button" onClick={() => setShowModal(false)} className="btn-ghost btn-sm">إلغاء</Button>
                <Button unstyled type="submit" disabled={submitting} className="btn-primary btn-sm">{submitting ? 'جاري...' : 'حفظ'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════
// Tab: Pulse (المتابعة الدورية)
// ═══════════════════════════════════════════════

function PulseTab({ beneficiaries, logs, actions, qualityBonus, setCardMemberId, switchTab }: { beneficiaries: BeneficiaryInfo[]; logs: ImpactLogFull[]; actions: ImpactActionItem[]; qualityBonus: Record<string, number>; setCardMemberId: (id: string) => void; switchTab: (tab: string) => void }) {
  const now = new Date()
  const curMonth = now.getMonth() + 1
  const curYear = now.getFullYear()
  const [pulseSearch, setPulseSearch] = useState('')
  const [pulseStatus, setPulseStatus] = useState('')
  const [pulsePlatform, setPulsePlatform] = useState('')

  const memberStatuses = useMemo(() => {
    const actionMap = buildActionMap(actions as any)
    const nowTime = Date.now()
    const logsByMember = new Map<string, ImpactLogFull[]>()
    for (const log of logs) {
      const current = logsByMember.get(log.beneficiaryId) || []
      current.push(log)
      logsByMember.set(log.beneficiaryId, current)
    }

    return beneficiaries.map(b => {
      const myLogs = logsByMember.get(b.id) || []
      const approved = myLogs.filter(l => l.status === 'APPROVED').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      const lastDate = approved[0]?.date || null
      const daysSince = lastDate ? Math.floor((nowTime - new Date(lastDate).getTime()) / 86400000) : Infinity
      const status = daysSince <= 7 ? { key: 'active', label: 'نشط هذا الأسبوع', dot: 'g' as const }
        : daysSince <= 30 ? { key: 'month', label: 'نشط هذا الشهر', dot: 'g' as const }
        : daysSince <= 60 ? { key: 'idle', label: 'خامل (٣٠–٦٠ يوم)', dot: 'o' as const }
        : { key: 'dormant', label: daysSince === Infinity ? 'لم يبدأ بعد' : 'متوقف (+٦٠ يوم)', dot: 'r' as const }

      const curPts = myLogs
        .filter(l => new Date(l.date).getFullYear() === curYear && new Date(l.date).getMonth() + 1 === curMonth)
        .reduce((s, l) => s + finalPoints(l as any, actionMap, qualityBonus as any), 0)

      return { ...b, myLogs, approved, lastDate, daysSince, status, curPts }
    })
  }, [beneficiaries, logs, actions, curMonth, curYear, qualityBonus])

  const idleMembers = memberStatuses.filter(m => m.status.key === 'idle' || m.status.key === 'dormant')
  const activeMembers = memberStatuses.filter(m => m.status.key === 'active' || m.status.key === 'month').sort((a, b) => b.curPts - a.curPts)
  const neverStarted = memberStatuses.filter(member => member.daysSince === Infinity).length
  const weeklyActive = memberStatuses.filter(member => member.status.key === 'active').length
  const monthlyActive = memberStatuses.filter(member => member.status.key === 'month').length
  const activeRate = memberStatuses.length ? Math.round(((weeklyActive + monthlyActive) / memberStatuses.length) * 100) : 0
  const platformOptions = useMemo(() => Array.from(new Map(beneficiaries.filter(member => member.platformId).map(member => [member.platformId!, member.platformName || member.platformId!])).entries()).sort((a, b) => a[1].localeCompare(b[1], 'ar')), [beneficiaries])
  const filteredStatuses = useMemo(() => {
    const query = pulseSearch.trim().toLocaleLowerCase('ar')
    return memberStatuses.filter(member => {
      if (pulseStatus && member.status.key !== pulseStatus) return false
      if (pulsePlatform && member.platformId !== pulsePlatform) return false
      if (query && ![fullName(member.firstName, member.lastName), member.code, member.platformName, member.networkRole].filter(Boolean).join(' ').toLocaleLowerCase('ar').includes(query)) return false
      return true
    }).sort((a, b) => b.daysSince - a.daysSince)
  }, [memberStatuses, pulsePlatform, pulseSearch, pulseStatus])

  const openMemberCard = (id: string) => {
    setCardMemberId(id)
    switchTab('card')
  }

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-primary-100 bg-gradient-to-l from-primary-950 via-primary-800 to-primary-700 p-5 text-white shadow-sm md:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div><div className="mb-2 flex items-center gap-2 text-xs font-bold text-primary-100"><TrendingUp size={15} /> مركز المتابعة الاستباقية</div><h2 className="text-xl font-black md:text-2xl">نبض شبكة الرواد</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-primary-100">رصد انتظام الأعضاء، اكتشاف حالات الانقطاع مبكرًا، وتحديد أولويات المتابعة.</p></div>
          <div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-4 text-center backdrop-blur"><div className="text-3xl font-black">{activeRate}%</div><div className="mt-1 text-xs text-primary-100">معدل النشاط خلال 30 يومًا</div></div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          { label: 'نشطون هذا الأسبوع', value: weeklyActive, tone: 'bg-green-50 text-green-700', icon: CheckCircle },
          { label: 'نشطون هذا الشهر', value: monthlyActive, tone: 'bg-primary-50 text-primary-700', icon: TrendingUp },
          { label: 'يحتاجون متابعة', value: idleMembers.length, tone: 'bg-amber-50 text-amber-700', icon: TriangleAlert },
          { label: 'لم يبدأوا بعد', value: neverStarted, tone: 'bg-red-50 text-red-700', icon: User },
          { label: 'بانتظار الاعتماد', value: logs.filter(log => log.status === 'PENDING_REVIEW').length, tone: 'bg-violet-50 text-violet-700', icon: ClipboardCheck },
        ].map(item => <div key={item.label} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><div className={`flex size-9 items-center justify-center rounded-xl ${item.tone}`}><item.icon size={17} /></div><div><div className="text-xl font-black text-neutral-900">{item.value.toLocaleString('ar-SA')}</div><div className="text-[11px] text-neutral-500">{item.label}</div></div></div></div>)}
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm md:p-5">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="relative"><Search size={17} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" /><Input value={pulseSearch} onChange={event => setPulseSearch(event.target.value)} placeholder="الاسم أو رقم العضو..." className="w-full pr-10" aria-label="البحث في المتابعة" /></div>
          <NativeSelect value={pulseStatus} onChange={event => setPulseStatus(event.target.value)} className="w-full" wrapperClassName="w-full" aria-label="تصفية المتابعة حسب الحالة"><option value="">كل حالات النشاط</option><option value="active">نشط هذا الأسبوع</option><option value="month">نشط هذا الشهر</option><option value="idle">خامل 30–60 يومًا</option><option value="dormant">متوقف أو لم يبدأ</option></NativeSelect>
          <NativeSelect value={pulsePlatform} onChange={event => setPulsePlatform(event.target.value)} className="w-full" wrapperClassName="w-full" aria-label="تصفية المتابعة حسب المنصة"><option value="">كل المنصات</option>{platformOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</NativeSelect>
        </div>
        <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-neutral-100" aria-label="توزيع حالات نشاط الأعضاء">
          <div className="bg-green-500" style={{ width: `${memberStatuses.length ? (weeklyActive / memberStatuses.length) * 100 : 0}%` }} />
          <div className="bg-primary-400" style={{ width: `${memberStatuses.length ? (monthlyActive / memberStatuses.length) * 100 : 0}%` }} />
          <div className="bg-amber-400" style={{ width: `${memberStatuses.length ? (memberStatuses.filter(member => member.status.key === 'idle').length / memberStatuses.length) * 100 : 0}%` }} />
          <div className="bg-red-400" style={{ width: `${memberStatuses.length ? (memberStatuses.filter(member => member.status.key === 'dormant').length / memberStatuses.length) * 100 : 0}%` }} />
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-bold text-neutral-500"><span className="before:ml-1 before:inline-block before:size-2 before:rounded-full before:bg-green-500">أسبوعي</span><span className="before:ml-1 before:inline-block before:size-2 before:rounded-full before:bg-primary-400">شهري</span><span className="before:ml-1 before:inline-block before:size-2 before:rounded-full before:bg-amber-400">خامل</span><span className="before:ml-1 before:inline-block before:size-2 before:rounded-full before:bg-red-400">متوقف</span></div>
      </section>

      {idleMembers.length > 0 && (
        <section className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="flex items-center gap-2 font-bold text-neutral-900"><TriangleAlert size={18} className="text-amber-600" /> أولوية المتابعة</h2><p className="mt-1 text-xs text-neutral-500">ابدأ بالأعضاء الأطول انقطاعًا أو الذين لم يسجلوا نشاطًا.</p></div><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">{idleMembers.length} عضوًا</span></div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {[...idleMembers].sort((a, b) => b.daysSince - a.daysSince).map(m => (
              <div key={m.id} className={`rounded-xl border p-4 ${m.status.key === 'dormant' ? 'border-red-200 bg-red-50/70' : 'border-amber-200 bg-amber-50/70'}`}>
                <div className="flex items-start gap-3">
                  <div className={`mt-1 size-2.5 shrink-0 rounded-full ${m.status.dot === 'r' ? 'bg-red-500' : 'bg-amber-500'}`} />
                  <div className="min-w-0 flex-1"><div className="truncate font-bold text-neutral-900">{fullName(m.firstName, m.lastName)}</div><div className="mt-1 text-xs text-neutral-500">{m.status.label}{m.daysSince !== Infinity ? ` · منذ ${m.daysSince.toLocaleString('ar-SA')} يومًا` : ''}</div><div className="mt-1 truncate text-[11px] text-neutral-400">{m.platformName || 'غير مرتبط بمنصة'} · {m.code}</div></div>
                </div>
                <div className="mt-3 flex justify-end border-t border-current/10 pt-2"><Button unstyled onClick={() => openMemberCard(m.id)} className="btn-ghost btn-sm flex items-center gap-1.5"><Eye size={13} /> عرض البطاقة</Button></div>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeMembers.length > 0 && (
        <section className="rounded-2xl border border-green-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="flex items-center gap-2 font-bold text-neutral-900"><TrendingUp size={18} className="text-green-600" /> الأكثر تفاعلاً هذا الشهر</h2><p className="mt-1 text-xs text-neutral-500">ترتيب الأعضاء النشطين حسب نقاط الشهر الحالي.</p></div><span className="text-xs font-bold text-green-700">{MONTHS[curMonth - 1]} {curYear}</span></div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {activeMembers.slice(0, 9).map(m => (
              <Button unstyled key={m.id} onClick={() => openMemberCard(m.id)} className="flex w-full items-center gap-3 rounded-xl border border-green-200 bg-green-50/50 p-3 text-right transition-colors hover:bg-green-100/60">
                <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold">{m.firstName?.charAt(0) || '؟'}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-neutral-800">{fullName(m.firstName, m.lastName)}</div>
                  <div className="text-xs text-neutral-500">{m.status.label}</div>
                </div>
                <div className="text-lg font-bold font-mono text-primary-700">{m.curPts.toLocaleString('ar-SA')}</div>
              </Button>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 p-5"><div><h2 className="flex items-center gap-2 font-bold text-neutral-900"><Users size={18} className="text-primary-600" /> سجل المتابعة الكامل</h2><p className="mt-1 text-xs text-neutral-500">حالة كل عضو، آخر نشاط معتمد، ونقاط الشهر.</p></div><span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold text-neutral-600">{filteredStatuses.length} نتيجة</span></div>
        {filteredStatuses.length ? (
          <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredStatuses.map(member => {
              const statusClass = member.status.key === 'active' ? 'bg-green-50 text-green-700' : member.status.key === 'month' ? 'bg-primary-50 text-primary-700' : member.status.key === 'idle' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
              return (
                <article key={member.id} className="rounded-xl border border-neutral-200 p-4 transition-colors hover:border-primary-200 hover:bg-primary-50/20">
                  <div className="flex items-start gap-3"><div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 font-black text-primary-700">{member.firstName?.charAt(0)}{member.lastName?.charAt(0)}</div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div><h3 className="truncate text-sm font-bold text-neutral-900">{fullName(member.firstName, member.lastName)}</h3><p className="mt-0.5 text-[11px] text-neutral-400">{member.code} · {member.platformName || 'دون منصة'}</p></div><span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${statusClass}`}>{member.status.label}</span></div></div></div>
                  <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-neutral-50 p-3 text-xs"><div><div className="text-neutral-400">آخر نشاط</div><div className="mt-1 font-bold text-neutral-700">{member.lastDate ? dateLabel(member.lastDate) : 'لا يوجد'}</div></div><div><div className="text-neutral-400">نقاط الشهر</div><div className="mt-1 font-black text-primary-700">{member.curPts.toLocaleString('ar-SA')}</div></div></div>
                  <div className="mt-3 flex justify-end"><Button unstyled onClick={() => openMemberCard(member.id)} className="btn-ghost btn-sm flex items-center gap-1.5"><Eye size={13} /> بطاقة العضو</Button></div>
                </article>
              )
            })}
          </div>
        ) : <div className="py-12 text-center"><Search size={27} className="mx-auto text-neutral-300" /><p className="mt-2 text-sm text-neutral-500">لا توجد نتائج مطابقة للفلاتر</p></div>}
      </section>
    </div>
  )
}

// ═══════════════════════════════════════════════
// Tab: Card (بطاقة الرائد)
// ═══════════════════════════════════════════════

function CardTab({ beneficiaries, logs, actions, awards, cardMemberId, setCardMemberId, qualityBonus }: {
  beneficiaries: BeneficiaryInfo[]; logs: ImpactLogFull[]; actions: ImpactActionItem[];
  awards: ImpactAwardFull[]; cardMemberId: string; setCardMemberId: (id: string) => void
  qualityBonus: Record<string, number>
}) {
  const [cardYear, setCardYear] = useState(new Date().getFullYear())
  const [cardMonth, setCardMonth] = useState(new Date().getMonth() + 1)
  const cardRef = useRef<HTMLDivElement>(null)

  if (beneficiaries.length === 0) {
    return <div className="card text-center py-12 text-neutral-400"><User size={36} className="mx-auto mb-3" /><p>أضف أعضاء أولاً</p></div>
  }

  const memberId = cardMemberId || beneficiaries[0]?.id
  if (!memberId) return null

  const b = beneficiaries.find(x => x.id === memberId)
  if (!b) return null

  const myLogs = logs.filter(l => l.beneficiaryId === memberId)
  const myAwards = awards.filter(a => a.beneficiaryId === memberId)
  const actionMap = buildActionMap(actions as any)

  const calcPts = (l: ImpactLogFull) => finalPoints(l as any, actionMap, qualityBonus as any)

  const total = myLogs.reduce((s, l) => s + calcPts(l), 0)
  const byCat: Record<string, number> = {}
  myLogs.forEach(l => {
    const cat = actionMap.get(l.actionId)?.category
    if (cat) byCat[cat] = (byCat[cat] || 0) + calcPts(l)
  })

  const levels = [{ name: 'عضو جديد', from: 0, to: 99 }, { name: 'عضو نشط', from: 100, to: 299 }, { name: 'عضو مؤثر', from: 300, to: 599 }, { name: 'عضو متميز', from: 600, to: 999 }, { name: 'رائد ذهبي', from: 1000, to: 1999 }, { name: 'سفير الرواد', from: 2000, to: 9999999 }]
  const lvl = levels.find(l => total >= l.from && total <= l.to) || levels[levels.length - 1]
  const progress = lvl.to >= 9999999 ? 100 : Math.min(100, Math.max(0, ((total - lvl.from) / (lvl.to - lvl.from + 1)) * 100))

  // Monthly/yearly
  const monthlyPts = myLogs.filter(l => new Date(l.date).getFullYear() === cardYear && new Date(l.date).getMonth() + 1 === cardMonth).reduce((s, l) => s + calcPts(l), 0)
  const yearlyPts = myLogs.filter(l => new Date(l.date).getFullYear() === cardYear).reduce((s, l) => s + calcPts(l), 0)
  const approvedActivities = myLogs.filter(log => log.status === 'APPROVED').length
  const shields = myAwards.filter(award => award.type === 'SHIELD')
  const rewards = myAwards.filter(award => award.type !== 'SHIELD')
  const currentLevelIndex = levels.findIndex(level => level.name === lvl.name)
  const nextLevel = currentLevelIndex >= 0 ? levels[currentLevelIndex + 1] : undefined
  const remainingToNext = nextLevel ? Math.max(0, nextLevel.from - total) : 0
  const maxCategoryPoints = Math.max(1, ...Object.values(byCat))
  const recentLogs = myLogs.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 12)
  const portfolioUrl = `/${'ar'}/member/${encodeURIComponent(b.code)}/portfolio`

  const copyPortfolioLink = async () => {
    const url = `${window.location.origin}${portfolioUrl}`
    await navigator.clipboard.writeText(url)
    toast.success('تم نسخ رابط ملف العضو')
  }

  const printCard = () => {
    if (cardRef.current) printElement(cardRef.current, `بطاقة الرائد - ${fullName(b.firstName, b.lastName)}`)
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden print:hidden">
        <div className="border-b border-neutral-100 bg-gradient-to-l from-primary-50/80 to-white px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 font-bold text-neutral-900"><IdCard size={19} className="text-primary-700" /> بطاقة الرائد</h2>
              <p className="mt-1 text-xs text-neutral-500">اختر العضو والفترة لاستعراض هويته الرقمية وملخص أثره.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button unstyled onClick={copyPortfolioLink} className="btn-ghost btn-sm flex items-center gap-1.5"><Copy size={14} /> نسخ الرابط</Button>
              <Link href={portfolioUrl} target="_blank" className="btn-ghost btn-sm flex items-center gap-1.5 no-underline"><ExternalLink size={14} /> الملف العام</Link>
              <Button unstyled onClick={printCard} className="btn-primary btn-sm flex items-center gap-1.5"><Printer size={14} /> طباعة البطاقة</Button>
            </div>
          </div>
        </div>
        <div className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_140px_170px] md:p-5">
          <label className="space-y-1.5">
            <span className="text-xs font-bold text-neutral-600">العضو</span>
            <NativeSelect value={memberId} onChange={e => setCardMemberId(e.target.value)} className="w-full" wrapperClassName="w-full" aria-label="اختيار العضو">
              {beneficiaries.map(m => <option key={m.id} value={m.id}>{fullName(m.firstName, m.lastName)} ({m.code})</option>)}
            </NativeSelect>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-bold text-neutral-600">السنة</span>
            <Input type="number" min={2020} max={2100} value={cardYear} onChange={e => setCardYear(+e.target.value)} className="w-full" aria-label="سنة البطاقة" />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-bold text-neutral-600">الشهر</span>
            <NativeSelect value={cardMonth} onChange={e => setCardMonth(+e.target.value)} className="w-full" wrapperClassName="w-full" aria-label="شهر البطاقة">
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </NativeSelect>
          </label>
        </div>
      </section>

      {/* Member Profile */}
      <div ref={cardRef} className="space-y-5 rounded-2xl bg-neutral-100/40 print:bg-white" dir="rtl">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-950 via-primary-800 to-primary-600 p-6 text-white shadow-lg md:p-8">
        <div className="absolute -left-16 -top-20 size-64 rounded-full bg-white/5" />
        <div className="absolute -bottom-24 right-1/3 size-52 rounded-full bg-secondary-400/10" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="flex size-24 shrink-0 items-center justify-center rounded-3xl border border-white/20 bg-white/10 text-4xl font-black shadow-xl backdrop-blur">{b.firstName?.charAt(0) || '؟'}{b.lastName?.charAt(0) || ''}</div>
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-primary-100"><Shield size={14} /> شبكة الرواد الإلكترونية <span className="h-1 w-1 rounded-full bg-primary-200" /> بطاقة عضو موحدة</div>
            <h3 className="text-2xl font-black md:text-3xl">{fullName(b.firstName, b.lastName)}</h3>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-primary-100">
              <span className="flex items-center gap-1.5"><User size={15} />{b.networkRole || 'صفة غير محددة'}</span>
              <span className="flex items-center gap-1.5"><Building2 size={15} />{b.platformName || 'غير مرتبط بمنصة'}</span>
              <span className="flex items-center gap-1.5"><CalendarDays size={15} />انضم {b.joinDate ? dateLabel(b.joinDate) : '—'}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:min-w-[270px]">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <div className="text-[11px] font-bold text-primary-100">رقم العضو</div>
              <div className="mt-1 font-mono text-2xl font-black tracking-wider">{b.code}</div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <div className="text-[11px] font-bold text-primary-100">المستوى الحالي</div>
              <div className="mt-1 text-lg font-black">{lvl.name}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Level Progress */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-neutral-900"><Target size={17} className="text-primary-600" /> التقدم في مسار الأثر</div>
            <p className="mt-1 text-xs text-neutral-500">{nextLevel ? `تبقى ${remainingToNext.toLocaleString('ar-SA')} نقطة للوصول إلى مستوى «${nextLevel.name}»` : 'وصل العضو إلى أعلى مستوى متاح'}</p>
          </div>
          <div className="text-left"><span className="text-2xl font-black text-primary-700">{total.toLocaleString('ar-SA')}</span><span className="text-xs text-neutral-400"> / {lvl.to >= 9999999 ? '∞' : lvl.to.toLocaleString('ar-SA')}</span></div>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-neutral-100" role="progressbar" aria-label="تقدم مستوى العضو" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-gradient-to-l from-primary-700 via-primary-500 to-secondary-400 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-2 flex justify-between text-[10px] font-bold text-neutral-400"><span>{lvl.name}</span><span>{Math.round(progress)}%</span></div>
      </section>

      {/* KPI Cards */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: `نقاط ${MONTHS[cardMonth - 1]}`, value: monthlyPts, icon: Star, tone: 'bg-primary-50 text-primary-700' },
          { label: `نقاط سنة ${cardYear}`, value: yearlyPts, icon: TrendingUp, tone: 'bg-primary-50 text-primary-700' },
          { label: 'الأنشطة المعتمدة', value: approvedActivities, icon: CheckCircle, tone: 'bg-green-50 text-green-700' },
          { label: 'الدروع والجوائز', value: myAwards.length, icon: Medal, tone: 'bg-amber-50 text-amber-700' },
        ].map(item => (
          <div key={item.label} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3"><div className={`flex size-10 items-center justify-center rounded-xl ${item.tone}`}><item.icon size={18} /></div><div><div className="text-xl font-black text-neutral-900">{item.value.toLocaleString('ar-SA')}</div><div className="text-xs text-neutral-500">{item.label}</div></div></div>
          </div>
        ))}
      </section>

      <div className="grid gap-5 xl:grid-cols-5">
        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm xl:col-span-3">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div><h2 className="flex items-center gap-2 font-bold text-neutral-900"><TrendingUp size={18} className="text-primary-600" /> توزيع نقاط الأثر</h2><p className="mt-1 text-xs text-neutral-500">مساهمة كل مجال في إجمالي نقاط العضو.</p></div>
            <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary-700">{total.toLocaleString('ar-SA')} نقطة</span>
          </div>
          <div className="space-y-4">
            {Object.keys(CATEGORY_LABELS).map(category => {
              const points = byCat[category] || 0
              const width = Math.max(points > 0 ? 5 : 0, (points / maxCategoryPoints) * 100)
              return (
                <div key={category}>
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-xs"><span className="font-bold text-neutral-700">{CATEGORY_LABELS[category]}</span><span className="font-mono font-black text-neutral-900">{points.toLocaleString('ar-SA')}</span></div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-neutral-100"><div className="h-full rounded-full bg-gradient-to-l from-primary-700 to-primary-400 transition-all" style={{ width: `${width}%` }} /></div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="flex items-center gap-2 font-bold text-neutral-900"><Medal size={18} className="text-amber-600" /> سجل التكريم</h2><p className="mt-1 text-xs text-neutral-500">الدروع والمكافآت التي حصل عليها العضو.</p></div><span className="text-xs font-bold text-neutral-400">{shields.length} درع · {rewards.length} مكافأة</span></div>
          {myAwards.length > 0 ? (
            <div className="space-y-2">
              {myAwards.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6).map(award => (
                <div key={award.id} className="flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50/50 p-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700"><Medal size={17} /></div>
                  <div className="min-w-0 flex-1"><div className="truncate text-sm font-bold text-neutral-900">{award.title}</div><div className="mt-0.5 text-[11px] text-neutral-500">{dateLabel(award.date)}{award.value ? ` · ${award.value} نقطة` : ''}</div></div>
                </div>
              ))}
            </div>
          ) : <div className="rounded-xl border border-dashed border-neutral-200 py-8 text-center"><Medal size={25} className="mx-auto text-neutral-300" /><p className="mt-2 text-sm text-neutral-400">لا توجد جوائز مسجلة بعد</p></div>}
        </section>
      </div>

      {/* Activities List */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="flex items-center gap-2 font-bold text-neutral-900"><Activity size={18} className="text-primary-600" /> سجل الأنشطة الأخير</h2><p className="mt-1 text-xs text-neutral-500">آخر 12 نشاطًا مع حالة الاعتماد والنقاط المحتسبة.</p></div><span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold text-neutral-600">{myLogs.length.toLocaleString('ar-SA')} نشاط</span></div>
        {recentLogs.length > 0 ? (
          <div className="divide-y divide-neutral-100">
            {recentLogs.map(log => {
              const pts = calcPts(log)
              return (
                <div key={log.id} className="flex items-center gap-3 py-3.5">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700"><Activity size={16} /></div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-neutral-900">{log.action?.name || 'نشاط غير مسمى'}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-neutral-500"><span>{dateLabel(log.date)}</span><Badge className={STATUS_COLORS[log.status] || ''}>{STATUS_LABELS[log.status] || log.status}</Badge><span>{QUALITY_LABELS[log.quality] || log.quality}</span></div>
                  </div>
                  <div className={`rounded-lg px-2.5 py-1 font-mono text-sm font-black ${pts < 0 ? 'bg-red-50 text-red-700' : 'bg-primary-50 text-primary-700'}`}>{pts > 0 ? '+' : ''}{pts.toLocaleString('ar-SA')}</div>
                </div>
              )
            })}
          </div>
        ) : <div className="rounded-xl border border-dashed border-neutral-200 py-10 text-center"><Activity size={26} className="mx-auto text-neutral-300" /><p className="mt-2 text-sm text-neutral-400">لا توجد أنشطة مسجلة لهذا العضو</p></div>}
      </section>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════
// Tab: Rewards (المكافآت)
// ═══════════════════════════════════════════════

function RewardsTab({ beneficiaries, logs, actions, awards, gates, fetchAll, qualityBonus }: {
  beneficiaries: BeneficiaryInfo[]; logs: ImpactLogFull[]; actions: ImpactActionItem[]; awards: ImpactAwardFull[]; gates: ImpactGateItem[]; fetchAll: () => void
  qualityBonus: Record<string, number>
}) {
  const [rYear, setRYear] = useState(new Date().getFullYear())
  const [rMonth, setRMonth] = useState(new Date().getMonth() + 1)
  const [showAwardModal, setShowAwardModal] = useState(false)
  const [awardForm, setAwardForm] = useState({ beneficiaryId: '', type: 'SHIELD', title: '', date: today(), value: '0', note: '' })
  const [submitting, setSubmitting] = useState(false)
  const [rewardSearch, setRewardSearch] = useState('')

  const actionMap = useMemo(() => buildActionMap(actions as any), [actions])

  const rewardRows = useMemo(() => {
    return beneficiaries.map(b => {
      const pts = logs
        .filter(l => l.beneficiaryId === b.id && new Date(l.date).getFullYear() === rYear && new Date(l.date).getMonth() + 1 === rMonth)
        .reduce((s, l) => s + finalPoints(l as any, actionMap, qualityBonus as any), 0)

      const gatePassed = gates.find(g => g.beneficiaryId === b.id && g.year === rYear && g.month === rMonth)?.passed ?? true
      let tier = 'لا مكافأة'
      if (gatePassed && pts > 0) {
        if (pts >= 400) tier = 'كاملة + درع'
        else if (pts >= 250) tier = 'متوسطة'
        else if (pts >= 150) tier = 'أساسية'
        else if (pts >= 100) tier = 'رمزية'
      }
      return { ...b, pts, gatePassed, tier, eligible: gatePassed && pts > 0 }
    }).sort((a, b) => b.pts - a.pts)
  }, [beneficiaries, logs, actionMap, gates, rYear, rMonth, qualityBonus])

  const visibleRewardRows = useMemo(() => {
    const query = rewardSearch.trim().toLocaleLowerCase('ar')
    if (!query) return rewardRows
    return rewardRows.filter(row => [
      fullName(row.firstName, row.lastName),
      row.code,
      row.platformName,
      row.networkRole,
    ].some(value => String(value || '').toLocaleLowerCase('ar').includes(query)))
  }, [rewardRows, rewardSearch])

  const rewardSummary = useMemo(() => ({
    eligible: rewardRows.filter(row => row.eligible).length,
    blocked: rewardRows.filter(row => !row.gatePassed).length,
    topScore: rewardRows[0]?.pts || 0,
    totalPoints: rewardRows.reduce((sum, row) => sum + row.pts, 0),
  }), [rewardRows])

  const toggleGate = async (beneficiaryId: string, year: number, month: number, currentPassed: boolean) => {
    try {
      const res = await fetch('/api/admin/impact/gates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ beneficiaryId, year, month, passed: !currentPassed }),
      })
      if ((await res.json()).success) { toast.success('تم تحديث البوابة'); fetchAll() }
    } catch { toast.error('فشل') }
  }

  const handleAwardSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/impact/awards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(awardForm),
      })
      if ((await res.json()).success) { toast.success('تم منح الدرع/المكافأة'); setShowAwardModal(false); fetchAll() }
    } catch { toast.error('فشل') }
    finally { setSubmitting(false) }
  }

  const delAward = async (id: string) => {
    if (!confirm('حذف هذا الدرع/المكافأة؟')) return
    try {
      if ((await (await fetch(`/api/admin/impact/awards?id=${id}`, { method: 'DELETE' })).json()).success) { toast.success('تم الحذف'); fetchAll() }
    } catch { toast.error('فشل') }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl overflow-hidden border border-amber-200 bg-gradient-to-l from-amber-50 via-white to-primary-50 p-5 md:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-800 mb-3">
              <Medal size={14} /> إدارة الاستحقاق والتقدير
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-neutral-950">مكافآت مبنية على الإنجاز الفعلي</h2>
            <p className="text-sm text-neutral-600 mt-2 max-w-2xl leading-6">راجع نقاط الفترة، تحقق من بوابة الالتزام، ثم امنح الدرع أو المكافأة مع بقاء سجل واضح لكل قرار.</p>
          </div>
          <Button unstyled onClick={() => { setAwardForm({ beneficiaryId: beneficiaries[0]?.id || '', type: 'SHIELD', title: BADGE_CATALOG[0], date: today(), value: '0', note: '' }); setShowAwardModal(true) }} className="btn-primary flex items-center justify-center gap-2">
            <Plus size={16} /> منح درع أو مكافأة
          </Button>
        </div>
      </section>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label: 'المستحقون', value: rewardSummary.eligible, hint: 'اجتازوا البوابة ولديهم نقاط', color: 'text-green-700 bg-green-50' },
          { label: 'بوابة متعثرة', value: rewardSummary.blocked, hint: 'تحتاج مراجعة قبل الصرف', color: 'text-red-700 bg-red-50' },
          { label: 'أعلى رصيد', value: rewardSummary.topScore, hint: 'نقطة في الفترة', color: 'text-amber-700 bg-amber-50' },
          { label: 'إجمالي النقاط', value: rewardSummary.totalPoints, hint: `${MONTHS[rMonth - 1]} ${rYear}`, color: 'text-primary-700 bg-primary-50' },
        ].map(item => (
          <div key={item.label} className="rounded-2xl border border-neutral-200 bg-white p-4">
            <div className={`w-fit rounded-lg px-2.5 py-1 text-xl font-bold ${item.color}`}>{item.value.toLocaleString('ar-SA')}</div>
            <div className="font-semibold text-sm text-neutral-800 mt-3">{item.label}</div>
            <div className="text-[11px] text-neutral-500 mt-1">{item.hint}</div>
          </div>
        ))}
      </div>

      {/* Monthly eligibility table */}
      <div className="card mb-6">
        <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4 mb-5">
          <div>
            <h2 className="font-bold text-neutral-900 flex items-center gap-2"><Calculator size={18} className="text-primary-600" /> حاسبة الاستحقاق الشهري</h2>
            <p className="text-xs text-neutral-500 mt-1">تغيير حالة البوابة ينعكس فورًا على أهلية العضو للمكافأة.</p>
          </div>
          <div className="grid sm:grid-cols-[minmax(220px,1fr)_100px_140px] gap-2 w-full xl:w-auto">
            <div className="relative">
              <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <Input value={rewardSearch} onChange={e => setRewardSearch(e.target.value)} placeholder="بحث بالاسم أو الرمز أو المنصة" className="pe-9" />
            </div>
            <Input aria-label="السنة" type="number" min={2020} max={2100} value={rYear} onChange={e => setRYear(+e.target.value)} />
            <NativeSelect aria-label="الشهر" value={rMonth} onChange={e => setRMonth(+e.target.value)} wrapperClassName="w-full">
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </NativeSelect>
          </div>
        </div>
        {visibleRewardRows.length > 0 ? (
          <div className="overflow-x-auto">
            <Table className="w-full text-sm">
              <TableHeader>
                <TableRow className="border-b border-neutral-200">
                  <TableHead className="text-right p-3">العضو</TableHead>
                  <TableHead className="text-center p-3">نقاط الشهر</TableHead>
                  <TableHead className="text-center p-3">البوابة</TableHead>
                  <TableHead className="text-center p-3">الاستحقاق</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleRewardRows.map(r => (
                  <TableRow key={r.id} className="border-b border-neutral-100">
                    <TableCell className="p-3 font-semibold">{fullName(r.firstName, r.lastName)}</TableCell>
                    <TableCell className="p-3 text-center font-mono font-bold">{r.pts}</TableCell>
                    <TableCell className="p-3 text-center">
                      <Button unstyled onClick={() => toggleGate(r.id, rYear, rMonth, r.gatePassed)} className={`btn-sm px-3 py-1 rounded-lg text-xs ${r.gatePassed ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {r.gatePassed ? '✓ منجزة' : '✕ متعثرة'}
                      </Button>
                    </TableCell>
                    <TableCell className="p-3 text-center">
                      <Badge className={r.eligible ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-red-50 text-red-700'}>
                        {r.eligible ? r.tier : 'لا استحقاق'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : <p className="text-center py-8 text-neutral-400">{rewardSearch ? 'لا توجد نتائج مطابقة للبحث' : 'لا يوجد أعضاء'}</p>}
      </div>

      {/* Awards History */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-neutral-900 flex items-center gap-2"><Medal size={18} className="text-primary-600" /> سجل الدروع والمكافآت</h2>
          <Badge className="bg-neutral-100 text-neutral-700 border border-neutral-200">{awards.length} سجل</Badge>
        </div>
        {awards.length > 0 ? (
          <div className="overflow-x-auto">
            <Table className="w-full text-sm">
              <TableHeader>
                <TableRow className="border-b border-neutral-200">
                  <TableHead className="text-right p-3">المستلم</TableHead>
                  <TableHead className="text-center p-3">النوع</TableHead>
                  <TableHead className="text-right p-3">المسمى</TableHead>
                  <TableHead className="text-right p-3">التاريخ</TableHead>
                  <TableHead className="text-center p-3">حذف</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {awards.map(a => (
                  <TableRow key={a.id} className="border-b border-neutral-100">
                    <TableCell className="p-3 font-semibold">{a.beneficiary ? fullName(a.beneficiary.firstName, a.beneficiary.lastName) : '—'}</TableCell>
                    <TableCell className="p-3 text-center"><Badge className={a.type === 'SHIELD' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}>{(AWARD_TYPES as any)[a.type] || a.type}</Badge></TableCell>
                    <TableCell className="p-3">{a.title}</TableCell>
                    <TableCell className="p-3 text-xs">{dateLabel(a.date)}</TableCell>
                    <TableCell className="p-3 text-center"><Button unstyled onClick={() => delAward(a.id)} className="text-neutral-400 hover:text-red-600"><Trash size={13} /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : <p className="text-center py-8 text-neutral-400"><Medal size={36} className="mx-auto mb-3 text-neutral-300" />لا توجد دروع أو مكافآت</p>}
      </div>

      {showAwardModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-bold text-neutral-900">منح درع أو مكافأة</h2>
              <Button unstyled onClick={() => setShowAwardModal(false)} className="p-1.5 text-neutral-400 hover:text-neutral-600"><X size={18} /></Button>
            </div>
            <form onSubmit={handleAwardSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">العضو</label>
                <NativeSelect required value={awardForm.beneficiaryId} onChange={e => setAwardForm({ ...awardForm, beneficiaryId: e.target.value })} className="input-field">
                  {beneficiaries.map(b => <option key={b.id} value={b.id}>{fullName(b.firstName, b.lastName)}</option>)}
                </NativeSelect>
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">النوع</label>
                <NativeSelect value={awardForm.type} onChange={e => setAwardForm({ ...awardForm, type: e.target.value })} className="input-field">
                  <option value="SHIELD">درع</option>
                  <option value="REWARD">مكافأة مالية</option>
                </NativeSelect>
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">اسم الدرع / وصف المكافأة</label>
                <Input required value={awardForm.title} onChange={e => setAwardForm({ ...awardForm, title: e.target.value })} list="badgeList" className="input-field" />
                <datalist id="badgeList">{BADGE_CATALOG.map(b => <option key={b} value={b} />)}</datalist>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">التاريخ</label>
                  <Input type="date" required value={awardForm.date} onChange={e => setAwardForm({ ...awardForm, date: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">القيمة (للمكافأة)</label>
                  <Input type="number" value={awardForm.value} onChange={e => setAwardForm({ ...awardForm, value: e.target.value })} className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">ملاحظات</label>
                <Input value={awardForm.note} onChange={e => setAwardForm({ ...awardForm, note: e.target.value })} className="input-field" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button unstyled type="button" onClick={() => setShowAwardModal(false)} className="btn-ghost btn-sm">إلغاء</Button>
                <Button unstyled type="submit" disabled={submitting} className="btn-primary btn-sm">{submitting ? 'جاري...' : 'منح'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════
// Tab: Reports (التقارير)
// ═══════════════════════════════════════════════

function ReportInsightList({ title, items, tone, emptyLabel = 'لا توجد بيانات كافية' }: {
  title: string
  items: string[]
  tone: 'primary' | 'success' | 'warning' | 'neutral'
  emptyLabel?: string
}) {
  const styles = {
    primary: 'border-primary-100 bg-gradient-to-br from-primary-50/60 to-white text-primary-700 shadow-sm',
    success: 'border-green-100 bg-gradient-to-br from-green-50/60 to-white text-green-700 shadow-sm',
    warning: 'border-amber-100 bg-gradient-to-br from-amber-50/60 to-white text-amber-700 shadow-sm',
    neutral: 'border-neutral-200 bg-gradient-to-br from-neutral-50 to-white text-neutral-600 shadow-sm',
  }
  const dotColors = {
    primary: 'bg-primary-400',
    success: 'bg-green-400',
    warning: 'bg-amber-400',
    neutral: 'bg-neutral-400',
  }
  return (
    <section className={`rounded-2xl border p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${styles[tone]}`}>
      <h4 className="font-bold text-sm mb-3 flex items-center gap-2">{title}</h4>
      {items.length ? (
        <ul className="space-y-2.5">
          {items.map((item, index) => (
            <li key={`${title}-${index}`} className="text-sm leading-6 flex items-start gap-3 text-neutral-700 group">
              <span className={`mt-2.5 w-2 h-2 rounded-full ${dotColors[tone]} shrink-0 transition-transform group-hover:scale-125`} />
              <span className="transition-colors group-hover:text-neutral-900">{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex items-center gap-2 text-sm opacity-60 py-2">
          <Info size={14} />
          {emptyLabel}
        </div>
      )}
    </section>
  )
}

function ReportsTab({ beneficiaries, logs, actions, qualityBonus }: { beneficiaries: BeneficiaryInfo[]; logs: ImpactLogFull[]; actions: ImpactActionItem[]; qualityBonus: Record<string, number> }) {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams<{ locale: string }>()
  const userRole = (session?.user as any)?.role || ''
  const isSystemManager = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN'

  const [repType, setRepType] = useState<'monthly' | 'yearly'>('monthly')
  const [repYear, setRepYear] = useState(new Date().getFullYear())
  const [repMonth, setRepMonth] = useState(new Date().getMonth() + 1)

  // AI state
  const [aiReport, setAiReport] = useState<{ report: SmartImpactReport; metrics: ImpactReportMetrics; generatedAt: string } | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [savedReports, setSavedReports] = useState<Array<{ id: string; title: string; periodType: string; periodYear: number; periodMonth: number | null; createdAt: string; reportScope: 'NETWORK' }>>([])

  const actionMap = useMemo(() => buildActionMap(actions as any), [actions])

  const calcPts = (l: ImpactLogFull) => finalPoints(l as any, actionMap, qualityBonus as any)

  useEffect(() => {
    if (!isSystemManager) return
    fetch('/api/admin/ai/impact-report?scope=network', { cache: 'no-store' })
      .then(response => response.json())
      .then(result => { if (result.success) setSavedReports(result.data) })
      .catch(() => undefined)
  }, [isSystemManager])

  // AI handlers
  const handleGenerateSmartReport = async () => {
    if (!isSystemManager) { toast.error('إدارة النظام فقط'); return }
    setAiLoading(true)
    try {
      const res = await fetch('/api/admin/ai/impact-report', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportScope: 'network',
          periodType: repType,
          year: repYear,
          ...(repType === 'monthly' && { month: repMonth }),
          platformId: '',
          networkRole: '',
        }),
      })
      const data = await res.json()
      if (data.success) {
        setAiReport(data.data)
        toast.success('تم إنشاء التقرير وحفظه')
        router.push(`/${params.locale || 'ar'}/admin/impact/ai-reports/${data.data.id}`)
      }
      else toast.error(data.message || 'فشل')
    } catch { toast.error('فشل الاتصال بـ Gemini') }
    finally { setAiLoading(false) }
  }

  const copySmartReport = async () => {
    if (!aiReport) return
    const { report } = aiReport
    const list = (items: string[]) => items.map(item => `- ${item}`).join('\n')
    const text = [
      report.title, '', 'الملخص التنفيذي', report.executiveSummary, '',
      'قراءة الأداء', report.performanceNarrative, '', 'أبرز النجاحات', list(report.highlights), '',
      'المخاطر والتنبيهات', list(report.risks), '', 'التوصيات',
      report.recommendations.map(item => `- [${item.priority}] ${item.title}: ${item.action}`).join('\n'), '',
      'رؤى المنصات', list(report.platformInsights), '', 'رؤى الأعضاء', list(report.memberInsights), '',
      'تركيز الفترة القادمة', list(report.nextPeriodFocus), '', 'ملاحظات البيانات', list(report.dataNotes),
    ].join('\n')
    await navigator.clipboard.writeText(text)
    toast.success('تم نسخ التقرير الذكي')
  }

  // Filter
  const reportRows = beneficiaries.map(b => {
    const myLogs = logs.filter(l => l.beneficiaryId === b.id)
    let filteredLogs = myLogs
    if (repType === 'monthly') filteredLogs = myLogs.filter(l => new Date(l.date).getFullYear() === repYear && new Date(l.date).getMonth() + 1 === repMonth)
    else if (repType === 'yearly') filteredLogs = myLogs.filter(l => new Date(l.date).getFullYear() === repYear)

    return { ...b, pts: filteredLogs.reduce((s, l) => s + calcPts(l), 0), actCount: filteredLogs.length }
  }).sort((a, b) => b.pts - a.pts)

  const totalPts = reportRows.reduce((s, r) => s + r.pts, 0)
  const totalActs = reportRows.reduce((s, r) => s + r.actCount, 0)
  const activeCount = reportRows.filter(r => r.pts > 0).length
  const participationRate = reportRows.length ? Math.round((activeCount / reportRows.length) * 100) : 0

  const titleMap = { monthly: `التقرير الشهري (${MONTHS[repMonth - 1]} ${repYear})`, yearly: `التقرير السنوي (${repYear})` }

  const exportReportData = () => {
    downloadCSV(reportRows.map((row, index) => ({
      'الترتيب': index + 1,
      'رمز العضو': row.code || '',
      'الاسم': fullName(row.firstName, row.lastName),
      'المنصة': row.platformName || '',
      'الصفة': row.networkRole || '',
      'عدد الأنشطة': row.actCount,
      'النقاط': row.pts,
    })), `تقرير-أثر-${repType === 'monthly' ? `${repYear}-${String(repMonth).padStart(2, '0')}` : repYear}.csv`)
    toast.success('تم تصدير بيانات التقرير')
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-primary-900 via-primary-700 to-secondary-700 p-6 md:p-8 text-white shadow-2xl">
        {/* عناصر زخرفية خلفية */}
        <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute -bottom-8 left-1/3 h-32 w-32 rounded-full bg-secondary-500/10 blur-2xl" />
        <div className="absolute right-1/4 top-1/2 h-20 w-20 rounded-full bg-primary-300/8 blur-xl" />
        <div className="absolute inset-0 opacity-[0.03]">
          <svg viewBox="0 0 400 200" className="h-full w-full" preserveAspectRatio="none">
            <defs><pattern id="reports-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" /></pattern></defs>
            <rect width="100%" height="100%" fill="url(#reports-grid)" />
          </svg>
        </div>

        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/12 border border-white/20 px-3.5 py-1.5 text-xs font-bold mb-4 backdrop-blur-sm shadow-sm">
              <FileText size={14} className="text-secondary-300" /> مركز تقارير أثر الرواد
            </div>
            <h2 className="text-2xl md:text-3xl font-black leading-tight">من البيانات إلى قرار قابل للتنفيذ</h2>
            <p className="text-sm text-white/75 mt-3 max-w-2xl leading-7">أنشئ تقرير أداء شبكة رواد الكلي الذي يجمع جميع المنصات والأعضاء. تقارير المنصات تُنشأ بصورة مستقلة من مركز متابعة المنصات.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button unstyled onClick={exportReportData} className="group relative overflow-hidden rounded-xl bg-white px-5 py-3 text-sm font-bold text-primary-800 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5">
              <span className="relative z-10 flex items-center gap-2">
                <Download size={16} /> تصدير CSV
              </span>
            </Button>
            {isSystemManager && (
              <Link href={`/${params.locale || 'ar'}/admin/impact/ai-reports`} className="group relative overflow-hidden rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-bold text-white shadow-md backdrop-blur-sm transition-all duration-300 hover:bg-white/20 hover:shadow-lg no-underline">
                <span className="relative z-10 flex items-center gap-2">
                  <FileText size={16} /> أرشيف التقارير الذكية
                </span>
              </Link>
            )}
          </div>
        </div>
      </section>

      <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm mb-6 overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100 bg-gradient-to-l from-primary-50/70 to-white">
          <h3 className="font-bold text-neutral-900 flex items-center gap-2"><Settings size={17} className="text-primary-600" /> إعداد تقرير أداء شبكة رواد — الكلي</h3>
          <p className="text-xs text-neutral-500 mt-1">هذا التقرير يشمل جميع المنصات وصفات الأعضاء. لإنشاء تقرير منصة محددة استخدم مركز متابعة المنصات.</p>
        </div>
        <div className="p-4 md:p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <label className="space-y-1.5">
            <span className="text-xs font-semibold text-neutral-600">نوع التقرير</span>
            <NativeSelect value={repType} onChange={e => setRepType(e.target.value as 'monthly' | 'yearly')} className="w-full" wrapperClassName="w-full">
              <option value="monthly">تقرير شهري</option>
              <option value="yearly">تقرير سنوي</option>
            </NativeSelect>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-semibold text-neutral-600">السنة</span>
            <Input type="number" min={2020} max={2100} value={repYear} onChange={e => setRepYear(+e.target.value)} className="w-full" />
          </label>
          {repType === 'monthly' && (
            <label className="space-y-1.5">
              <span className="text-xs font-semibold text-neutral-600">الشهر</span>
              <NativeSelect value={repMonth} onChange={e => setRepMonth(+e.target.value)} className="w-full" wrapperClassName="w-full">
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </NativeSelect>
            </label>
          )}
          <div className="rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-xs leading-5 text-primary-800">
            <strong>النطاق ثابت:</strong> الشبكة كاملة بجميع المنصات والأعضاء.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label: 'نطاق التقرير', value: reportRows.length, hint: 'عضوًا ضمن المرشحات', tone: 'bg-primary-50 text-primary-700' },
          { label: 'نسبة المشاركة', value: `${participationRate}%`, hint: `${activeCount} أعضاء متفاعلين`, tone: 'bg-green-50 text-green-700' },
          { label: 'إجمالي الأنشطة', value: totalActs, hint: 'نشاطًا في الفترة', tone: 'bg-purple-50 text-purple-700' },
          { label: 'إجمالي النقاط', value: totalPts, hint: titleMap[repType], tone: 'bg-amber-50 text-amber-700' },
        ].map(item => (
          <div key={item.label} className="rounded-2xl border border-neutral-200 bg-white p-4">
            <div className={`inline-flex rounded-lg px-2.5 py-1 text-xl font-bold ${item.tone}`}>{typeof item.value === 'number' ? item.value.toLocaleString('ar-SA') : item.value}</div>
            <div className="font-semibold text-sm text-neutral-800 mt-3">{item.label}</div>
            <div className="text-[11px] text-neutral-500 mt-1">{item.hint}</div>
          </div>
        ))}
      </div>

      {isSystemManager && savedReports.length > 0 && (
        <div className="relative overflow-hidden rounded-3xl border border-primary-100/60 bg-gradient-to-br from-primary-50/40 to-white p-5 md:p-6 mb-5 shadow-md">
          <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-primary-100/30 blur-3xl" />
          <div className="relative">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="font-bold text-neutral-900 flex items-center gap-2 text-base"><FileText size={18} className="text-primary-600" /> تقارير شبكة رواد الكلية المحفوظة</h3>
                <p className="text-xs text-neutral-500 mt-1">يعرض هذا القسم تقارير الشبكة الكلية فقط، دون تقارير المنصات.</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-3 py-1.5 text-[11px] font-bold text-primary-700">
                  <FileText size={12} /> {savedReports.length} تقريرًا
                </span>
                <Link href={`/${params.locale || 'ar'}/admin/impact/ai-reports`} className="inline-flex items-center gap-1 rounded-xl border border-primary-200 bg-white px-3.5 py-2 text-xs font-bold text-primary-700 shadow-sm transition-all hover:bg-primary-50 hover:shadow-md no-underline">
                  عرض الأرشيف
                  <ExternalLink size={12} />
                </Link>
              </div>
            </div>
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
              {savedReports.slice(0, 6).map(report => (
                <Link key={report.id} href={`/${params.locale || 'ar'}/admin/impact/ai-reports/${report.id}`} className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-4 no-underline shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-primary-200">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-50/0 to-primary-50/50 opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary-100 text-primary-600"><Star size={12} /></span>
                      <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[9px] font-bold text-primary-600">{report.periodType === 'monthly' ? 'شهري' : 'سنوي'}</span>
                    </div>
                    <div className="font-semibold text-sm text-neutral-800 line-clamp-2 leading-6">{report.title}</div>
                    <div className="flex items-center gap-2 mt-2 text-[11px] text-neutral-400">
                      <CalendarDays size={11} />
                      {report.periodType === 'monthly' && report.periodMonth ? `${MONTHS[report.periodMonth - 1]} ` : ''}{report.periodYear}
                      <span className="text-neutral-300">•</span>
                      {new Date(report.createdAt).toLocaleDateString('ar-SA')}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* طباعة + التقرير */}
      <div className="flex flex-wrap justify-end gap-2 mb-3">
        <Button unstyled onClick={exportReportData} className="btn-ghost btn-sm flex items-center gap-1.5">
          <Download size={14} />
          تصدير البيانات
        </Button>
        <Button unstyled
          onClick={() => {
            const printArea = document.getElementById('reportPrintArea')
            if (!printArea) return
            const smartReport = document.getElementById('smartAiReport')
            const win = window.open('', '_blank', 'width=800,height=600')
            if (!win) return
            win.document.write(`
              <html dir="rtl"><head><meta charset="utf-8"><title>تقرير لوحة الأثر</title>
              <style>body{font-family:"IBM Plex Sans Arabic",system-ui,sans-serif;padding:30px;color:#222}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #ccc;padding:8px;text-align:right}th{background:#f5f5f5}.text-center{text-align:center}.text-xs{font-size:12px;color:#666}</style>
              </head><body>${smartReport?.innerHTML || ''}${printArea.innerHTML}</body></html>
            `)
            win.document.close()
            win.focus()
            setTimeout(() => win.print(), 300)
          }}
          className="btn-ghost btn-sm flex items-center gap-1.5"
        >
          <Printer size={14} />
          طباعة التقرير
        </Button>
        {isSystemManager && (
          <>
            <Button unstyled
              onClick={handleGenerateSmartReport}
              disabled={aiLoading}
              className="btn-ghost btn-sm flex items-center gap-1.5 text-primary-600"
            >
              {aiLoading ? <div className="w-4 h-4 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" /> : <Star size={14} />}
              {aiLoading ? 'جاري تحليل كامل بيانات الشبكة...' : 'توليد تقرير أداء الشبكة الكلي'}
            </Button>
          </>
        )}
      </div>

      {/* Expanded AI report — تصميم ثري ثلاثي الأبعاد */}
      {aiReport && (
        <div id="smartAiReport" className="relative overflow-hidden rounded-3xl border-2 border-primary-200/60 bg-gradient-to-br from-white via-primary-50/30 to-white p-6 md:p-8 mb-5 shadow-xl space-y-6 transition-all duration-500">
          {/* عناصر زخرفية خلفية */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-primary-200/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-secondary-200/20 blur-3xl" />
          <div className="pointer-events-none absolute left-1/3 top-1/2 h-40 w-40 rounded-full bg-primary-100/20 blur-2xl" />

          {/* رأس التقرير */}
          <div className="relative">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-lg shadow-primary-500/20">
                  <Star size={22} />
                  <div className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-secondary-400 ring-2 ring-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-primary-900">{aiReport.report.title}</h3>
                  <p className="text-sm text-neutral-500 mt-1.5 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-0.5 text-[11px] font-bold text-primary-700">
                      تحليل {aiReport.metrics.dataQuality.recordsAnalyzed.toLocaleString('ar-SA')} سجلًا
                    </span>
                    <span className="text-neutral-300">•</span>
                    <span>{new Date(aiReport.generatedAt).toLocaleString('ar-SA')}</span>
                  </p>
                </div>
              </div>
              <div className="flex gap-2 print:hidden">
                <Button unstyled onClick={copySmartReport} className="group flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-xs font-bold text-neutral-700 shadow-sm transition-all hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700 hover:shadow-md">
                  <ClipboardCheck size={14} className="transition-transform group-hover:scale-110" /> نسخ التقرير
                </Button>
                <Button unstyled onClick={() => setAiReport(null)} className="group flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-xs font-bold text-neutral-500 shadow-sm transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 hover:shadow-md">
                  <X size={14} /> إخفاء
                </Button>
              </div>
            </div>
          </div>

          {/* بطاقات المؤشرات الرئيسية — 3D effect */}
          <div className="relative grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'إجمالي النقاط', value: aiReport.metrics.totalPoints.toLocaleString('ar-SA'), icon: Star, gradient: 'from-amber-400 to-amber-600', shadow: 'shadow-amber-500/15' },
              { label: 'إجمالي الأنشطة', value: aiReport.metrics.totalActivities.toLocaleString('ar-SA'), icon: Activity, gradient: 'from-primary-500 to-primary-700', shadow: 'shadow-primary-500/15' },
              { label: 'نسبة الاعتماد', value: `${aiReport.metrics.approvalRate}%`, icon: ShieldCheck, gradient: 'from-emerald-500 to-emerald-700', shadow: 'shadow-emerald-500/15' },
              { label: 'الأعضاء النشطون', value: `${aiReport.metrics.activeMembers}/${aiReport.metrics.memberCount}`, icon: Users, gradient: 'from-violet-500 to-violet-700', shadow: 'shadow-violet-500/15' },
            ].map(({ label, value, icon: Icon, gradient, shadow }) => (
              <div key={label} className="group relative overflow-hidden rounded-2xl border border-neutral-100 bg-white p-5 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-[0.03] transition-opacity group-hover:opacity-[0.06]`} />
                <div className="relative">
                  <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-sm ${shadow}`}>
                    <Icon size={18} />
                  </div>
                  <div className="text-2xl font-black text-neutral-900">{value}</div>
                  <div className="mt-1 text-xs font-semibold text-neutral-500">{label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* الملخص التنفيذي — بطاقة مميزة */}
          <section className="relative overflow-hidden rounded-2xl border-r-4 border-primary-500 bg-gradient-to-l from-primary-50/80 to-white p-5 shadow-sm">
            <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-primary-500 to-primary-300 opacity-50" />
            <h4 className="mb-3 flex items-center gap-2 text-base font-bold text-primary-900">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-100 text-primary-600"><FileText size={14} /></span>
              الملخص التنفيذي
            </h4>
            <p className="text-sm leading-8 text-neutral-700">{aiReport.report.executiveSummary}</p>
          </section>

          {/* قراءة الأداء */}
          <section className="relative overflow-hidden rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
            <h4 className="mb-3 flex items-center gap-2 text-base font-bold text-neutral-900">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-secondary-100 to-secondary-200 text-secondary-700"><TrendingUp size={14} /></span>
              قراءة الأداء والمقارنة
            </h4>
            <p className="text-sm leading-8 text-neutral-600">{aiReport.report.performanceNarrative}</p>
          </section>

          {/* النجاحات والمخاطر */}
          <div className="grid md:grid-cols-2 gap-4">
            <ReportInsightList title="🌟 أبرز النجاحات" items={aiReport.report.highlights} tone="success" />
            <ReportInsightList title="⚠️ المخاطر والتنبيهات" items={aiReport.report.risks} tone="warning" emptyLabel="لا توجد مخاطر بارزة في البيانات المتاحة" />
          </div>

          {/* التوصيات التنفيذية — 3D cards */}
          <section>
            <h4 className="mb-4 flex items-center gap-2 text-base font-bold text-neutral-900">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 text-primary-700"><Target size={14} /></span>
              التوصيات التنفيذية
            </h4>
            <div className="grid md:grid-cols-2 gap-4">
              {aiReport.report.recommendations.map((item, index) => (
                <div key={`${item.title}-${index}`} className="group relative overflow-hidden rounded-2xl border border-neutral-100 bg-white p-5 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-50/0 to-primary-50/40 opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="relative">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-100 text-xs font-black text-primary-700 shadow-sm">{index + 1}</span>
                      <span className={`rounded-full px-3 py-1 text-[10px] font-bold shadow-sm ${
                        item.priority === 'عالية' ? 'bg-red-50 text-red-700 ring-1 ring-red-200' :
                        item.priority === 'متوسطة' ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' :
                        'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                      }`}>
                        أولوية {item.priority}
                      </span>
                    </div>
                    <strong className="block text-sm font-bold text-neutral-900 mb-2">{item.title}</strong>
                    <p className="text-sm leading-6 text-neutral-600">{item.action}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* الرؤى والملاحظات */}
          <div className="grid md:grid-cols-2 gap-4">
            <ReportInsightList title="🔍 رؤى المنصات" items={aiReport.report.platformInsights} tone="primary" />
            <ReportInsightList title="👥 رؤى الأعضاء" items={aiReport.report.memberInsights} tone="primary" />
            <ReportInsightList title="🎯 تركيز الفترة القادمة" items={aiReport.report.nextPeriodFocus} tone="success" />
            <ReportInsightList title="📋 ملاحظات جودة البيانات" items={aiReport.report.dataNotes} tone="neutral" emptyLabel="لا توجد ملاحظات" />
          </div>

          {/* تذييل التقرير */}
          <div className="flex items-center justify-between rounded-2xl bg-neutral-50/80 border border-neutral-100 px-5 py-3">
            <p className="text-[11px] text-neutral-500 flex items-center gap-2">
              <Info size={13} className="text-neutral-400" />
              هذا التقرير مساعد تحليلي قابل للمراجعة ولا ينفذ قرارات اعتماد تلقائية.
            </p>
            <span className="text-[10px] text-neutral-400 font-mono">v1.0 • AI-Powered</span>
          </div>
        </div>
      )}

      {/* Report Content */}
      <div className="card p-8" id="reportPrintArea">
        <div className="text-center border-b-2 border-primary-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-primary-800">شبكة الرواد الإلكترونية</h2>
          <h3 className="text-lg text-neutral-600 mt-1">{titleMap[repType]}</h3>
          <p className="text-sm text-neutral-400 mt-2">تاريخ الاستخراج: {dateLabel(today())}</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-amber-50 rounded-xl p-4 text-center ring-1 ring-amber-200"><div className="text-2xl font-bold text-amber-700">{totalPts}</div><div className="text-xs text-amber-600">مجموع النقاط</div></div>
          <div className="bg-primary-50 rounded-xl p-4 text-center ring-1 ring-primary-200"><div className="text-2xl font-bold text-primary-700">{activeCount}</div><div className="text-xs text-primary-600">الأعضاء المتفاعلون</div></div>
          <div className="bg-secondary-50 rounded-xl p-4 text-center ring-1 ring-secondary-200"><div className="text-2xl font-bold text-secondary-700">{totalActs}</div><div className="text-xs text-secondary-600">إجمالي الأنشطة</div></div>
        </div>

        {/* فائزو الفترة */}
        {reportRows.filter(r => r.pts > 0).length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {(() => {
              const top = reportRows.filter(r => r.pts > 0)
              const leader = top[0]
              const influencer = top.filter(r => r.networkRole === 'مؤثر رقمي').sort((a, b) => b.pts - a.pts)[0]
              const researcher = top.filter(r => r.networkRole === 'باحث ومفكر').sort((a, b) => b.pts - a.pts)[0]
              const volunteer = top.filter(r => r.networkRole === 'متطوع').sort((a, b) => b.pts - a.pts)[0]
              const winners = [
                { title: '🏆 رائد الفترة', name: leader ? fullName(leader.firstName, leader.lastName) : '—', pts: leader?.pts || 0, color: 'from-amber-400 to-amber-600' },
                { title: '📱 مؤثر الفترة', name: influencer ? fullName(influencer.firstName, influencer.lastName) : '—', pts: influencer?.pts || 0, color: 'from-primary-500 to-primary-700' },
                { title: '🔬 باحث الفترة', name: researcher ? fullName(researcher.firstName, researcher.lastName) : '—', pts: researcher?.pts || 0, color: 'from-green-400 to-emerald-600' },
                { title: '🤝 متطوع الفترة', name: volunteer ? fullName(volunteer.firstName, volunteer.lastName) : '—', pts: volunteer?.pts || 0, color: 'from-purple-400 to-indigo-600' },
              ]
              return winners.map((w, i) => (
                <div key={i} className={`bg-gradient-to-br ${w.color} rounded-xl p-4 text-white`}>
                  <div className="text-xs opacity-80 font-semibold mb-1">{w.title}</div>
                  <div className="font-bold text-base truncate">{w.name}</div>
                  {w.pts > 0 && <div className="text-xs opacity-80 mt-1 font-mono">{w.pts} نقطة</div>}
                </div>
              ))
            })()}
          </div>
        )}

        <h3 className="font-bold text-neutral-800 mb-3">أعلى الأعضاء أداءً</h3>
        {reportRows.filter(r => r.pts > 0).length > 0 ? (
          <Table className="w-full text-sm border">
            <TableHeader><TableRow className="bg-neutral-50"><TableHead className="text-center p-2 border">#</TableHead><TableHead className="text-right p-2 border">الاسم</TableHead><TableHead className="text-right p-2 border">الصفة</TableHead><TableHead className="text-center p-2 border">الأنشطة</TableHead><TableHead className="text-center p-2 border">النقاط</TableHead></TableRow></TableHeader>
            <TableBody>
              {reportRows.filter(r => r.pts > 0).slice(0, 20).map((r, i) => (
                <TableRow key={r.id}><TableCell className="text-center p-2 border">{i + 1}</TableCell><TableCell className="p-2 border font-semibold">{fullName(r.firstName, r.lastName)}</TableCell><TableCell className="p-2 border">{r.networkRole || '—'}</TableCell><TableCell className="text-center p-2 border">{r.actCount}</TableCell><TableCell className="text-center p-2 border font-mono font-bold">{r.pts}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        ) : <p className="text-center py-8 text-neutral-400">لا توجد تفاعلات مسجلة</p>}

        <div className="mt-8 pt-4 border-t text-center text-xs text-neutral-400">
          تم إنشاء هذا التقرير آلياً عبر نظام "لوحة أثر الرواد"
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════
// Tab: Settings (الإعدادات)
// ═══════════════════════════════════════════════

function SettingsTab({ actions: initialActions, fetchAll }: { actions: ImpactActionItem[]; fetchAll: () => void }) {
  const [localActions, setLocalActions] = useState(initialActions)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', points: '10', category: 'DIGITAL_ACTIVITY', note: '' })
  const [submitting, setSubmitting] = useState(false)
  const [section, setSection] = useState<'catalog' | 'quality' | 'levels' | 'tiers'>('catalog')
  const [settings, setSettings] = useState<any>(null)
  const [actionSearch, setActionSearch] = useState('')

  useEffect(() => { setLocalActions(initialActions) }, [initialActions])

  useEffect(() => {
    fetch('/api/admin/impact/settings').then(r => r.json()).then(d => {
      if (d.success) setSettings(d.data)
    }).catch(() => {})
  }, [])

  const saveSettings = async (key: string, value: any) => {
    try {
      const res = await fetch('/api/admin/impact/settings', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: JSON.stringify(value) }),
      })
      if ((await res.json()).success) toast.success('تم حفظ الإعدادات')
    } catch { toast.error('فشل') }
    finally { fetchAll() }
  }

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault(); setSubmitting(true)
    try {
      const res = await fetch('/api/admin/impact/actions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, points: Number(form.points) }),
      })
      if ((await res.json()).success) { toast.success('تمت إضافة النشاط'); setShowModal(false); fetchAll() }
    } catch { toast.error('فشل') }
    finally { setSubmitting(false) }
  }

  const delAction = async (id: string) => {
    if (!confirm('تعطيل/حذف هذا النوع؟')) return
    try { if ((await (await fetch('/api/admin/impact/actions?id=' + id, { method: 'DELETE' })).json()).success) { toast.success('تم'); fetchAll() } } catch { toast.error('فشل') }
  }

  const grouped = useMemo(() => {
    const groups: Record<string, ImpactActionItem[]> = {}
    const query = actionSearch.trim().toLocaleLowerCase('ar')
    for (const a of localActions) {
      if (query && ![a.name, a.note, CATEGORY_LABELS[a.category]].some(value => String(value || '').toLocaleLowerCase('ar').includes(query))) continue
      const cat = a.category || 'OTHER'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(a)
    }
    return groups
  }, [localActions, actionSearch])

  const actionStats = useMemo(() => {
    const active = localActions.filter(action => action.isActive)
    const points = active.map(action => action.points)
    return {
      total: active.length,
      categories: new Set(active.map(action => action.category)).size,
      average: points.length ? Math.round(points.reduce((sum, point) => sum + point, 0) / points.length) : 0,
      max: points.length ? Math.max(...points) : 0,
    }
  }, [localActions])

  const sectionOpts = [
    { key: 'catalog' as const, label: 'كتالوج الأنشطة', icon: Settings },
    { key: 'quality' as const, label: 'بونص الجودة', icon: Star },
    { key: 'levels' as const, label: 'المستويات', icon: TrendingUp },
    { key: 'tiers' as const, label: 'شرائح المكافآت', icon: Medal },
  ]

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-neutral-200 bg-gradient-to-l from-neutral-900 via-neutral-800 to-primary-900 text-white p-5 md:p-6">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0"><Settings size={20} /></div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold">إعدادات احتساب الأثر</h2>
            <p className="text-sm text-white/70 mt-2 max-w-2xl leading-6">هذه القيم هي المرجع المركزي للنقاط والجودة والمستويات والمكافآت. راجع أثر أي تعديل قبل حفظه لأنه ينعكس على التقارير والاستحقاق.</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label: 'الأنشطة الفعالة', value: actionStats.total, hint: 'نوع نشاط قابل للتسجيل' },
          { label: 'محاور القياس', value: actionStats.categories, hint: 'تصنيفًا مستخدمًا' },
          { label: 'متوسط النقاط', value: actionStats.average, hint: 'لكل نشاط' },
          { label: 'أعلى وزن', value: actionStats.max, hint: 'نقطة للنشاط' },
        ].map(item => (
          <div key={item.label} className="rounded-2xl border border-neutral-200 bg-white p-4">
            <div className="text-2xl font-bold text-primary-700">{item.value.toLocaleString('ar-SA')}</div>
            <div className="font-semibold text-sm text-neutral-800 mt-2">{item.label}</div>
            <div className="text-[11px] text-neutral-500 mt-1">{item.hint}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-2 flex items-center gap-2 overflow-x-auto">
        {sectionOpts.map(s => (
          <Button unstyled key={s.key} onClick={() => setSection(s.key)}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap flex items-center gap-1.5 ${section === s.key ? 'bg-primary-600 text-white shadow-sm' : 'text-neutral-600 hover:bg-neutral-100'}`}>
            <s.icon size={14} /> {s.label}
          </Button>
        ))}
      </div>

      {section === 'catalog' && (
        <div className="card">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-5">
            <div>
              <h2 className="font-bold text-neutral-900 flex items-center gap-2"><Settings size={18} className="text-primary-600" /> كتالوج الأنشطة</h2>
              <p className="text-xs text-neutral-500 mt-1">عرّف الأنشطة وأوزانها مرة واحدة ليستخدمها مديرو المنصات بصورة موحدة.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
              <div className="relative min-w-0 sm:min-w-[260px]">
                <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <Input value={actionSearch} onChange={e => setActionSearch(e.target.value)} placeholder="ابحث في الأنشطة والمحاور" className="pe-9" />
              </div>
              {showModal ? null : <Button unstyled onClick={() => { setForm({ name: '', points: '10', category: 'DIGITAL_ACTIVITY', note: '' }); setShowModal(true) }} className="btn-primary btn-sm flex items-center justify-center gap-1"><Plus size={14} /> إضافة نشاط</Button>}
            </div>
          </div>
          {Object.entries(grouped).length > 0 ? Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} className="mb-6">
              <div className="flex items-center justify-between gap-3 mb-2 bg-neutral-50 p-2.5 rounded-xl">
                <h3 className="font-semibold text-neutral-700">{CATEGORY_LABELS[cat] || cat}</h3>
                <Badge className="bg-white text-neutral-600 border border-neutral-200">{items.length} نشاط</Badge>
              </div>
              <div className="overflow-x-auto">
                <Table className="w-full text-sm">
                  <TableHeader><TableRow className="border-b border-neutral-100"><TableHead className="text-right p-2 text-neutral-500">اسم النشاط</TableHead><TableHead className="text-center p-2 text-neutral-500">النقاط</TableHead><TableHead className="text-right p-2 text-neutral-500">ملاحظات</TableHead><TableHead className="text-center p-2 text-neutral-500">حذف</TableHead></TableRow></TableHeader>
                  <TableBody>{items.map(a => (<TableRow key={a.id} className="border-b border-neutral-50 hover:bg-neutral-50"><TableCell className="p-2 font-semibold">{a.name}</TableCell><TableCell className="p-2 text-center font-mono font-bold">{a.points}</TableCell><TableCell className="p-2 text-xs text-neutral-500">{a.note || '—'}</TableCell><TableCell className="p-2 text-center"><Button unstyled onClick={() => delAction(a.id)} className="text-neutral-400 hover:text-red-600"><Trash size={13} /></Button></TableCell></TableRow>))}</TableBody>
                </Table>
              </div>
            </div>
          )) : (
            <div className="py-12 text-center text-neutral-400">
              <Search size={32} className="mx-auto mb-3 text-neutral-300" />
              لا توجد أنشطة مطابقة لعبارة البحث
            </div>
          )}
        </div>
      )}

      {section === 'quality' && settings && (
        <div className="card p-5">
          <h2 className="font-bold text-neutral-900 mb-4 flex items-center gap-2"><Star size={18} className="text-primary-600" /> بونص الجودة</h2>
          <p className="text-sm text-neutral-500 mb-4">النقاط الإضافية (أو المخصومة) حسب مستوى جودة النشاط</p>
          <div className="rounded-xl border border-blue-200 bg-blue-50 text-blue-800 p-3 text-xs leading-6 mb-5 flex gap-2">
            <Info size={16} className="shrink-0 mt-0.5" /> يُضاف بونص الجودة إلى نقاط النشاط بعد المراجعة. القيم السالبة تخصم من الرصيد ولا تغيّر وزن النشاط الأصلي.
          </div>
          <div className="space-y-3 max-w-md">
            {Object.entries(settings.qualityBonus as Record<string, number>).map(([key, val]) => (
              <div key={key} className="flex items-center gap-3">
                <span className="w-24 text-sm font-semibold text-neutral-700">{QUALITY_LABELS[key] || key}</span>
                <Input type="number" defaultValue={val} onBlur={e => {
                  const newVal = Number(e.target.value)
                  if (!isNaN(newVal) && newVal !== val) {
                    const updated = { ...settings.qualityBonus, [key]: newVal }
                    setSettings({ ...settings, qualityBonus: updated })
                    saveSettings('qualityBonus', updated)
                  }
                }} className="input-field max-w-[100px] text-center" />
                <span className="text-xs text-neutral-400">نقطة</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {section === 'levels' && settings && (
        <div className="card p-5">
          <h2 className="font-bold text-neutral-900 mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-primary-600" /> المستويات</h2>
          <p className="text-sm text-neutral-500 mb-5">تأكد من اتصال النطاقات وعدم تداخلها حتى يحصل كل عضو على مستوى واحد فقط.</p>
          <div className="space-y-3 max-w-lg">
            {(settings.levels as any[]).map((lv: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-32 text-sm font-semibold text-neutral-700">{lv.name}</span>
                <span className="text-xs text-neutral-400">من</span>
                <Input type="number" defaultValue={lv.from} onBlur={e => {
                  const n = Number(e.target.value); if (!isNaN(n)) {
                    const u = settings.levels.map((l: any, j: number) => j === i ? { ...l, from: n } : l)
                    setSettings({ ...settings, levels: u }); saveSettings('levels', u)
                  }
                }} className="input-field max-w-[90px] text-center" />
                <span className="text-xs text-neutral-400">إلى</span>
                <Input type="number" defaultValue={lv.to} onBlur={e => {
                  const n = Number(e.target.value); if (!isNaN(n)) {
                    const u = settings.levels.map((l: any, j: number) => j === i ? { ...l, to: n } : l)
                    setSettings({ ...settings, levels: u }); saveSettings('levels', u)
                  }
                }} className="input-field max-w-[90px] text-center" />
              </div>
            ))}
          </div>
        </div>
      )}

      {section === 'tiers' && settings && (
        <div className="card p-5">
          <h2 className="font-bold text-neutral-900 mb-4 flex items-center gap-2"><Medal size={18} className="text-primary-600" /> شرائح المكافآت</h2>
          <p className="text-sm text-neutral-500 mb-5">تحدد الشرائح وصف الاستحقاق بعد اجتياز بوابة الالتزام، ولا تمنح المكافأة تلقائيًا.</p>
          <div className="space-y-3 max-w-lg">
            {(settings.rewardTiers as any[]).map((tier: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-24 text-sm font-semibold text-neutral-700">{tier.name}</span>
                <span className="text-xs text-neutral-400">من</span>
                <Input type="number" defaultValue={tier.from} onBlur={e => {
                  const n = Number(e.target.value); if (!isNaN(n)) {
                    const u = settings.rewardTiers.map((t: any, j: number) => j === i ? { ...t, from: n } : t)
                    setSettings({ ...settings, rewardTiers: u }); saveSettings('rewardTiers', u)
                  }
                }} className="input-field max-w-[90px] text-center" />
                <span className="text-xs text-neutral-400">إلى</span>
                <Input type="number" defaultValue={tier.to} onBlur={e => {
                  const n = Number(e.target.value); if (!isNaN(n)) {
                    const u = settings.rewardTiers.map((t: any, j: number) => j === i ? { ...t, to: n } : t)
                    setSettings({ ...settings, rewardTiers: u }); saveSettings('rewardTiers', u)
                  }
                }} className="input-field max-w-[90px] text-center" />
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b"><h2 className="font-bold text-neutral-900">إضافة نشاط جديد</h2><Button unstyled onClick={() => setShowModal(false)} className="p-1.5 text-neutral-400 hover:text-neutral-600"><X size={18} /></Button></div>
            <form onSubmit={handleAdd} className="p-5 space-y-4">
              <div><label className="block text-sm font-semibold text-neutral-700 mb-1">اسم النشاط</label><Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" /></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-semibold text-neutral-700 mb-1">النقاط</label><Input type="number" value={form.points} onChange={e => setForm({ ...form, points: e.target.value })} className="input-field" /></div><div><label className="block text-sm font-semibold text-neutral-700 mb-1">المحور</label><NativeSelect value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input-field">{Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</NativeSelect></div></div>
              <div><label className="block text-sm font-semibold text-neutral-700 mb-1">ملاحظات</label><Input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} className="input-field" /></div>
              <div className="flex justify-end gap-3 pt-4 border-t"><Button unstyled type="button" onClick={() => setShowModal(false)} className="btn-ghost btn-sm">إلغاء</Button><Button unstyled type="submit" disabled={submitting} className="btn-primary btn-sm">{submitting ? 'جاري...' : 'إضافة'}</Button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
