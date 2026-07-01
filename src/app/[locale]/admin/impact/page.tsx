'use client'

/**
 * لوحة أثر الرواد — Impact Dashboard
 * نظام النقاط والمستويات والمكافآت والدروع
 * مبني على النموذج المرجعي: lawhat_athar_alruwwad
 */

import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Activity, Bell, Book, Calculator, ChartBar, TrendingUp, PieChart,
  CheckCircle, ClipboardCheck, Clock, Crown, Download, Eye,
  FileText, Flag, Settings, Heart, Hourglass, IdCard,
  Info, Medal, Monitor, Moon, Pencil, Plus, Printer,
  Scale, ShieldCheck, Shield, LayoutGrid, Star, Trash, TrendingUp as TrendIcon,
  User, UserCheck, Users, UserRound, TriangleAlert, X,
  Search, ChevronDown, ChevronUp
} from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { finalPoints, buildActionMap, type ImpactCategory } from '@/lib/impact-scoring'
import { exportMembersCSV, exportActivitiesCSV } from '@/lib/export-csv'

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

interface MemberCardData {
  member: BeneficiaryInfo
  entries: ImpactLogFull[]
  awards: ImpactAwardFull[]
  total: number
  level: { name: string; from: number; to: number; desc?: string }
  progress: number
  nextLevel: { name: string; gap: number } | null
  byCategory: Record<string, number>
  monthlyTrend: number[]
  yearlyPoints: number
  monthlyPoints: number
  rank: number
  platformRank: number
  status: { key: string; label: string; dot: string; since: number }
  lastActive: string | null
  journey: Array<{ date: string; type: string; title: string; note?: string; icon: string; cls: string }>
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
  DIGITAL_ACTIVITY: 'bg-cyan-100 text-cyan-700',
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

function scorePct(score: number | null, maxScore: number) {
  if (score === null || !maxScore) return null
  return Math.round((score / maxScore) * 100)
}

function fullName(f?: string, l?: string) { return [f, l].filter(Boolean).join(' ') || '—' }

const scopeLabel = (sc: { type: string; year?: number; month?: number; ref?: string }) => {
  if (sc.type === 'month' && sc.year && sc.month) return `${MONTHS[sc.month - 1]} ${sc.year}`
  if (sc.type === 'week' && sc.ref) return `الأسبوع المنتهي ${sc.ref}`
  return 'الإجمالي التراكمي'
}

// ═══════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════

export default function ImpactDashboardPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tabParam = searchParams.get('tab') || 'dashboard'
  const [activeTab, setActiveTab] = useState(tabParam)
  const [loading, setLoading] = useState(true)

  // Sync tab state with URL
  useEffect(() => {
    setActiveTab(tabParam)
  }, [tabParam])

  /** تغيير التبويب مع تحديث الرابط */
  const switchTab = (tab: string) => {
    setActiveTab(tab)
    const params = new URLSearchParams(searchParams.toString())
    if (tab === 'dashboard') {
      params.delete('tab')
    } else {
      params.set('tab', tab)
    }
    const qs = params.toString()
    router.replace(`/ar/admin/impact${qs ? `?${qs}` : ''}`, { scroll: false })
  }

  // Data states
  const [beneficiaries, setBeneficiaries] = useState<BeneficiaryInfo[]>([])
  const [actions, setActions] = useState<ImpactActionItem[]>([])
  const [logs, setLogs] = useState<ImpactLogFull[]>([])
  const [awards, setAwards] = useState<ImpactAwardFull[]>([])
  const [gates, setGates] = useState<ImpactGateItem[]>([])
  const [dashData, setDashData] = useState<DashboardData | null>(null)
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set(['dashboard']))
  const [tabLoading, setTabLoading] = useState(false)

  /** التحميل الأولي — Dashboard فقط */
  useEffect(() => {
    const init = async () => {
      setLoading(true)
      try {
        const [dashRes] = await Promise.all([
          fetch('/api/admin/impact/dashboard').then(r => r.json()),
        ])
        if (dashRes.success) setDashData(dashRes.data || null)
      } catch (e) {
        console.error('Failed to load dashboard:', e)
        toast.error('فشل تحميل لوحة الأثر')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  /** تحميل بيانات التبويب عند أول زيارة */
  const ensureTabData = useCallback(async (tab: string) => {
    if (loadedTabs.has(tab)) return
    setTabLoading(true)
    try {
      const newLoaded = new Set(loadedTabs)
      if (tab === 'members' || tab === 'card' || tab === 'pulse') {
        if (!loadedTabs.has('members')) {
          const [benRes, actRes] = await Promise.all([
            fetch('/api/admin/members?limit=500').then(r => r.json()),
            fetch('/api/admin/impact/actions').then(r => r.json()),
          ])
          if (benRes.success) setBeneficiaries(benRes.data?.members || benRes.data || [])
          if (actRes.success) setActions(actRes.data || [])
          newLoaded.add('members')
        }
      }
      if (tab === 'activities' || tab === 'card' || tab === 'pulse' || tab === 'rewards' || tab === 'reports' || tab === 'dashboard') {
        if (!loadedTabs.has('logs')) {
          const [logRes] = await Promise.all([
            fetch('/api/admin/impact/logs?limit=2000').then(r => r.json()),
          ])
          if (logRes.success) setLogs(logRes.data || [])
          newLoaded.add('logs')
        }
      }
      if (tab === 'rewards' || tab === 'card') {
        if (!loadedTabs.has('awards_gates')) {
          const [awdRes, gateRes] = await Promise.all([
            fetch('/api/admin/impact/awards').then(r => r.json()),
            fetch('/api/admin/impact/gates').then(r => r.json()),
          ])
          if (awdRes.success) setAwards(awdRes.data || [])
          if (gateRes.success) setGates(gateRes.data || [])
          newLoaded.add('awards_gates')
        }
      }
      setLoadedTabs(newLoaded)
    } catch (e) {
      console.error('Failed to load tab data:', e)
    } finally {
      setTabLoading(false)
    }
  }, [loadedTabs])

  /** عند تبديل التبويب، حمّل بياناته */
  useEffect(() => {
    ensureTabData(activeTab)
  }, [activeTab, ensureTabData])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [benRes, actRes, logRes, awdRes, gateRes, dashRes] = await Promise.all([
        fetch('/api/admin/members?limit=500').then(r => r.json()),
        fetch('/api/admin/impact/actions').then(r => r.json()),
        fetch('/api/admin/impact/logs?limit=2000').then(r => r.json()),
        fetch('/api/admin/impact/awards').then(r => r.json()),
        fetch('/api/admin/impact/gates').then(r => r.json()),
        fetch('/api/admin/impact/dashboard').then(r => r.json()),
      ])

      if (benRes.success) setBeneficiaries(benRes.data?.members || benRes.data || [])
      if (actRes.success) setActions(actRes.data || [])
      if (logRes.success) setLogs(logRes.data || [])
      if (awdRes.success) setAwards(awdRes.data || [])
      if (gateRes.success) setGates(gateRes.data || [])
      if (dashRes.success) setDashData(dashRes.data || null)
      setLoadedTabs(new Set(['dashboard', 'members', 'logs', 'awards_gates']))
    } catch (e) {
      console.error('Failed to load impact data:', e)
      toast.error('فشل تحميل بيانات لوحة الأثر')
    } finally {
      setLoading(false)
    }
  }, [])

  // Compute member card data
  const [cardMemberId, setCardMemberId] = useState<string>('')

  /** إعدادات الجودة الديناميكية من ImpactSettings — إن لم تكن محفوظة، نستخدم الافتراضية */
  const qualityBonus: Record<string, number> = dashData?.settings?.qualityBonus ?? { WEAK: -3, ACCEPTABLE: 0, GOOD: 3, EXCELLENT: 6, EXCEPTIONAL: 10 }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
          <p className="mt-3 text-sm text-neutral-400">جاري تحميل لوحة الأثر...</p>
        </div>
      </div>
    )
  }

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
          <button onClick={fetchAll} className="btn-ghost btn-sm flex items-center gap-1.5" title="تحديث كل البيانات">
            <Download size={14} />
            تحديث
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'dashboard' && <DashboardTab dashData={dashData} actions={actions} logs={logs} />}
      {activeTab === 'members' && <MembersTab beneficiaries={beneficiaries} logs={logs} actions={actions} fetchAll={fetchAll} qualityBonus={qualityBonus} setCardMemberId={setCardMemberId} switchTab={switchTab} />}
      {activeTab === 'activities' && <ActivitiesTab logs={logs} actions={actions} beneficiaries={beneficiaries} fetchAll={fetchAll} qualityBonus={qualityBonus} />}
      {activeTab === 'pulse' && <PulseTab beneficiaries={beneficiaries} logs={logs} actions={actions} qualityBonus={qualityBonus} />}
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
    </div>
  )
}

// ═══════════════════════════════════════════════
// Tab: Dashboard (الرئيسية)
// ═══════════════════════════════════════════════

function DashboardTab({ dashData, actions, logs }: { dashData: DashboardData | null; actions: ImpactActionItem[]; logs: ImpactLogFull[] }) {
  const [scope, setScope] = useState<{ type: string; year?: number; month?: number; ref?: string }>({ type: 'all' })

  if (!dashData) {
    return <div className="card text-center py-12 text-neutral-400"><Shield size={36} className="mx-auto mb-3 text-neutral-300" /><p>لا توجد بيانات للوحة الأثر بعد</p></div>
  }

  const { kpis, catTotals, top10 } = dashData
  const d = dashData

  return (
    <div>
      {/* Scope selector */}
      <div className="card p-4 mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-neutral-700">نطاق العرض:</label>
          <select value={scope.type} onChange={e => setScope({ ...scope, type: e.target.value })} className="input-field max-w-[140px]">
            <option value="all">الإجمالي</option>
            <option value="month">شهري</option>
            <option value="week">أسبوعي</option>
          </select>
        </div>
        {scope.type === 'month' && (
          <div className="flex items-center gap-3">
            <input type="number" value={scope.year || new Date().getFullYear()} className="input-field max-w-[100px]" placeholder="السنة" onChange={e => setScope({ ...scope, year: +e.target.value })} />
            <select value={scope.month || new Date().getMonth() + 1} className="input-field max-w-[140px]" onChange={e => setScope({ ...scope, month: +e.target.value })}>
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>
        )}
        <Badge className="bg-neutral-100 text-neutral-600">{scopeLabel(scope)}</Badge>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <KpiCard icon={Users} label="الأعضاء" value={kpis.memberCount} color="bg-primary-100 text-primary-600" />
        <KpiCard icon={UserCheck} label="النشطون" value={kpis.activeNow} color="bg-green-100 text-green-600" />
        <KpiCard icon={CheckCircle} label="الأنشطة" value={kpis.actCount} color="bg-teal-100 text-teal-600" />
        <KpiCard icon={Star} label="النقاط" value={kpis.totalPoints} color="bg-amber-100 text-amber-600" />
        <KpiCard icon={Shield} label="الدروع" value={kpis.badgeCount} color="bg-orange-100 text-orange-600" />
        <KpiCard icon={Crown} label="المتصدر" value={kpis.topMember?.name ?? '—'} color="bg-purple-100 text-purple-600" isText />
      </div>

      {/* Top 10 Table */}
      <div className="card mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-neutral-900 flex items-center gap-2"><LayoutGrid size={18} className="text-primary-600" /> الترتيب — {scopeLabel(scope)}</h2>
          <span className="text-xs text-neutral-500">{top10.length} عضو</span>
        </div>
        {top10.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-right p-3 text-neutral-500 font-semibold">#</th>
                  <th className="text-right p-3 text-neutral-500 font-semibold">العضو</th>
                  <th className="text-right p-3 text-neutral-500 font-semibold">الصفة</th>
                  <th className="text-center p-3 text-neutral-500 font-semibold">النقاط</th>
                  <th className="text-center p-3 text-neutral-500 font-semibold">المستوى</th>
                </tr>
              </thead>
              <tbody>
                {top10.map((m, i) => (
                  <tr key={i} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <td className="p-3">
                      <span className={`w-7 h-7 rounded-full inline-flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-400 text-white' : i === 1 ? 'bg-slate-400 text-white' : i === 2 ? 'bg-amber-700 text-white' : 'bg-neutral-100 text-neutral-500'}`}>{i + 1}</span>
                    </td>
                    <td className="p-3 font-semibold">{m.name}</td>
                    <td className="p-3"><Badge className="bg-neutral-100 text-neutral-600">{m.networkRole || '—'}</Badge></td>
                    <td className="p-3 text-center font-mono font-bold">{m.total}</td>
                    <td className="p-3 text-center"><Badge className="bg-primary-100 text-primary-700">{m.level}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-center py-8 text-neutral-400">لا يوجد أعضاء بعد</p>}
      </div>
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, color, isText }: { icon: any; label: string; value: string | number; color: string; isText?: boolean }) {
  return (
    <div className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}><Icon size={18} /></div>
      <div>
        <div className={`${isText ? 'text-sm' : 'text-lg'} font-bold text-neutral-900`}>{value}</div>
        <div className="text-xs text-neutral-500">{label}</div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════
// Tab: Members (الأعضاء)
// ═══════════════════════════════════════════════

function MembersTab({ beneficiaries, logs, actions, fetchAll, qualityBonus, setCardMemberId, switchTab }: { beneficiaries: BeneficiaryInfo[]; logs: ImpactLogFull[]; actions: ImpactActionItem[]; fetchAll: () => void; qualityBonus: Record<string, number>; setCardMemberId: (id: string) => void; switchTab: (tab: string) => void }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
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
    setCreateForm({ firstName: '', lastName: '', code: `R-${String(beneficiaries.length + 1).padStart(3, '0')}`, email: '', phone: '', networkRole: '', platformId: '', joinDate: today(), impactNote: '' })
    setShowCreateModal(true)
  }

  const filtered = useMemo(() => {
    return beneficiaries.filter(b => {
      const name = fullName(b.firstName, b.lastName)
      if (search && !name.includes(search) && !b.code.includes(search)) return false
      if (roleFilter && b.networkRole !== roleFilter) return false
      return true
    })
  }, [beneficiaries, search, roleFilter])

  // For each member, compute total points
  const memberPoints = useMemo(() => {
    const map = new Map<string, number>()
    const actionMap = new Map(actions.map(a => [a.id, a]))
    for (const b of beneficiaries) {
      const pts = logs
        .filter(l => l.beneficiaryId === b.id)
        .reduce((sum, l) => {
          return sum + finalPoints(l as any, actionMap as any, qualityBonus as any)
        }, 0)
      map.set(b.id, pts)
    }
    return map
  }, [beneficiaries, logs, actions, qualityBonus])

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
          code: createForm.code,
          email: createForm.email || null,
          phone: createForm.phone || null,
          networkRole: createForm.networkRole || null,
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

  return (
    <div>
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-neutral-900 flex items-center gap-2"><Users size={18} className="text-primary-600" /> سجل الأعضاء</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const data = filtered.map(b => ({
                  name: fullName(b.firstName, b.lastName),
                  code: b.code,
                  networkRole: b.networkRole || '',
                  platformName: b.platformName || '',
                  points: memberPoints.get(b.id) || 0,
                  status: b.status,
                }))
                exportMembersCSV(data)
              }}
              className="btn-ghost btn-sm flex items-center gap-1.5"
              title="تصدير CSV"
            >
              <Download size={14} />
              تصدير
            </button>
            <button onClick={openCreate} className="btn-primary btn-sm flex items-center gap-1.5">
              <Plus size={14} />
              إضافة عضو
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex-1 min-w-[200px]">
            <input
              placeholder="🔍 بحث بالاسم أو الكود"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field"
            />
          </div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="input-field max-w-[200px]">
            <option value="">كل الصفات</option>
            {NETWORK_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-right p-3 text-neutral-500">الكود</th>
                  <th className="text-right p-3 text-neutral-500">الاسم</th>
                  <th className="text-right p-3 text-neutral-500">الصفة</th>
                  <th className="text-right p-3 text-neutral-500">المنصة</th>
                  <th className="text-center p-3 text-neutral-500">النقاط</th>
                  <th className="text-center p-3 text-neutral-500">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(b => (
                  <tr key={b.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <td className="p-3 font-mono text-xs">{b.code}</td>
                    <td className="p-3 font-semibold">{fullName(b.firstName, b.lastName)}</td>
                    <td className="p-3"><Badge className="bg-neutral-100 text-neutral-600">{b.networkRole || '—'}</Badge></td>
                    <td className="p-3 text-xs">{b.platformName || b.platformId || '—'}</td>
                    <td className="p-3 text-center font-mono font-bold">{memberPoints.get(b.id) || 0}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => { setCardMemberId(b.id); switchTab('card') }}
                          className="p-1.5 text-neutral-400 hover:text-teal-600"
                          title="بطاقة الرائد"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => router.push('/ar/admin/impact?tab=activities')}
                          className="p-1.5 text-neutral-400 hover:text-primary-600"
                          title="تسجيل نشاط سريع"
                        >
                          <Plus size={14} />
                        </button>
                        <button onClick={() => openEdit(b)} className="p-1.5 text-neutral-400 hover:text-primary-600" title="تعديل">
                          <Pencil size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-center py-8 text-neutral-400">لا يوجد أعضاء مطابقون</p>}
      </div>

      {/* Edit modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-bold text-neutral-900">تحديث بيانات الأثر</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-neutral-400 hover:text-neutral-600"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">الصفة في الشبكة</label>
                  <select value={form.networkRole} onChange={e => setForm({ ...form, networkRole: e.target.value })} className="input-field">
                    <option value="">— اختر الصفة —</option>
                    {NETWORK_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">تاريخ الانضمام</label>
                  <input type="date" value={form.joinDate} onChange={e => setForm({ ...form, joinDate: e.target.value })} className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">ملاحظات الأثر</label>
                <textarea rows={3} value={form.impactNote} onChange={e => setForm({ ...form, impactNote: e.target.value })} className="input-field" placeholder="ملاحظات خاصة بلوحة الأثر..." />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="btn-ghost btn-sm">إلغاء</button>
                <button type="submit" disabled={submitting} className="btn-primary btn-sm">{submitting ? 'جاري...' : 'حفظ'}</button>
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
              <button onClick={() => setShowCreateModal(false)} className="p-1.5 text-neutral-400 hover:text-neutral-600"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">الاسم الأول *</label>
                  <input required value={createForm.firstName} onChange={e => setCreateForm({ ...createForm, firstName: e.target.value })} className="input-field" placeholder="مثال: أحمد" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">اسم العائلة *</label>
                  <input required value={createForm.lastName} onChange={e => setCreateForm({ ...createForm, lastName: e.target.value })} className="input-field" placeholder="مثال: العمري" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">رمز العضو</label>
                  <input value={createForm.code} onChange={e => setCreateForm({ ...createForm, code: e.target.value })} className="input-field" placeholder="R-001" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">تاريخ الانضمام</label>
                  <input type="date" value={createForm.joinDate} onChange={e => setCreateForm({ ...createForm, joinDate: e.target.value })} className="input-field" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">البريد الإلكتروني</label>
                  <input type="email" value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })} className="input-field" placeholder="email@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">رقم الهاتف</label>
                  <input type="tel" value={createForm.phone} onChange={e => setCreateForm({ ...createForm, phone: e.target.value })} className="input-field" placeholder="+965..." />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">الصفة في الشبكة</label>
                <select value={createForm.networkRole} onChange={e => setCreateForm({ ...createForm, networkRole: e.target.value })} className="input-field">
                  <option value="">— اختر الصفة —</option>
                  {NETWORK_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">ملاحظات الأثر</label>
                <textarea rows={2} value={createForm.impactNote} onChange={e => setCreateForm({ ...createForm, impactNote: e.target.value })} className="input-field" placeholder="ملاحظات أولية..." />
              </div>

              <div className="rounded-xl bg-primary-50 border border-primary-100 p-3 text-xs text-primary-700 flex items-start gap-2">
                <Info size={14} className="mt-0.5 flex-shrink-0" />
                <span>بعد إضافة العضو، يمكنك تسجيل أنشطته من تبويب <b>الأنشطة</b> لبدء احتساب نقاطه.</span>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-ghost btn-sm">إلغاء</button>
                <button type="submit" disabled={submitting} className="btn-primary btn-sm">{submitting ? 'جاري...' : 'إضافة العضو'}</button>
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

function ActivitiesTab({ logs, actions, beneficiaries, fetchAll, qualityBonus }: { logs: ImpactLogFull[]; actions: ImpactActionItem[]; beneficiaries: BeneficiaryInfo[]; fetchAll: () => void; qualityBonus: Record<string, number> }) {
  const [filterMember, setFilterMember] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<ImpactLogFull | null>(null)
  const [form, setForm] = useState({ beneficiaryId: '', actionId: '', count: '1', quality: 'ACCEPTABLE', status: 'PENDING_REVIEW', date: today(), link: '', note: '', rejectionReason: '', sourceType: 'MANUAL' })
  const [submitting, setSubmitting] = useState(false)

  const filtered = useMemo(() => {
    let result = [...logs].reverse()
    if (filterMember) result = result.filter(l => l.beneficiaryId === filterMember)
    if (filterCategory) result = result.filter(l => l.action?.category === filterCategory)
    if (filterStatus) result = result.filter(l => l.status === filterStatus)
    return result
  }, [logs, filterMember, filterCategory, filterStatus])

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

  const actionMap = useMemo(() => buildActionMap(actions as any), [actions])
  const calcPts = (log: ImpactLogFull) => finalPoints(log as any, actionMap, qualityBonus as any)

  return (
    <div>
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-neutral-900 flex items-center gap-2"><ClipboardCheck size={18} className="text-primary-600" /> سجل الأنشطة</h2>
          <div className="flex items-center gap-2">
            <button
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
              className="btn-ghost btn-sm flex items-center gap-1.5"
              title="تصدير CSV"
            >
              <Download size={14} />
              تصدير
            </button>
            <button onClick={openCreate} className="btn-primary btn-sm flex items-center gap-1"><Plus size={14} /> تسجيل نشاط</button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 mb-4">
          <select value={filterMember} onChange={e => setFilterMember(e.target.value)} className="input-field max-w-[220px]">
            <option value="">كل الأعضاء</option>
            {beneficiaries.map(b => <option key={b.id} value={b.id}>{fullName(b.firstName, b.lastName)}</option>)}
          </select>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="input-field max-w-[200px]">
            <option value="">كل المحاور</option>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field max-w-[160px]">
            <option value="">كل الحالات</option>
            {APPROVAL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>)}
          </select>
        </div>

        {filtered.length > 0 ? (
          <>
            <div className="flex items-center gap-4 mb-3 p-3 bg-neutral-50 rounded-lg text-sm">
              <span className="text-neutral-500">عدد الأنشطة: <b className="text-neutral-800">{filtered.length}</b></span>
              <span className="text-neutral-500">إجمالي النقاط (المعتمدة): <b className="text-primary-700 font-mono">{filtered.filter(l => l.status === 'APPROVED').reduce((s, l) => s + calcPts(l), 0)}</b></span>
              <span className="text-neutral-500">قيد المراجعة: <b className="text-amber-700">{filtered.filter(l => l.status === 'PENDING_REVIEW').length}</b></span>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-right p-3">العضو</th>
                  <th className="text-right p-3">النشاط</th>
                  <th className="text-right p-3">المحور</th>
                  <th className="text-center p-3">العدد</th>
                  <th className="text-right p-3">التاريخ</th>
                  <th className="text-center p-3">الجودة</th>
                  <th className="text-center p-3">النقاط</th>
                  <th className="text-center p-3">الحالة</th>
                  <th className="text-center p-3">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(log => {
                  const cat = log.action?.category || ''
                  const pts = calcPts(log)
                  return (
                    <tr key={log.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                      <td className="p-3 font-semibold">{log.beneficiary ? fullName(log.beneficiary.firstName, log.beneficiary.lastName) : '—'}</td>
                      <td className="p-3">{log.action?.name || '—'}</td>
                      <td className="p-3"><Badge className={CATEGORY_COLORS[cat] || 'bg-neutral-100'}>{CATEGORY_LABELS[cat] || '—'}</Badge></td>
                      <td className="p-3 text-center font-mono">{log.count}</td>
                      <td className="p-3 text-xs">{dateLabel(log.date)}</td>
                      <td className="p-3 text-center text-xs">{QUALITY_LABELS[log.quality] || log.quality}</td>
                      <td className={`p-3 text-center font-mono font-bold ${pts < 0 ? 'text-red-600' : 'text-neutral-800'}`}>{pts}</td>
                      <td className="p-3 text-center"><Badge className={STATUS_COLORS[log.status] || 'bg-neutral-50'}>{STATUS_LABELS[log.status] || log.status}</Badge></td>
                      <td className="p-3 text-center">
                        <button onClick={() => openEdit(log)} className="p-1 text-neutral-400 hover:text-primary-600"><Pencil size={13} /></button>
                        <button onClick={() => delLog(log.id)} className="p-1 text-neutral-400 hover:text-red-600"><Trash size={13} /></button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          </>
        ) : <p className="text-center py-8 text-neutral-400">لا توجد أنشطة مسجلة</p>}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-bold text-neutral-900">{editing ? 'تعديل نشاط' : 'تسجيل نشاط جديد'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-neutral-400 hover:text-neutral-600"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">العضو</label>
                  <select required value={form.beneficiaryId} onChange={e => setForm({ ...form, beneficiaryId: e.target.value })} className="input-field">
                    {beneficiaries.map(b => <option key={b.id} value={b.id}>{fullName(b.firstName, b.lastName)} ({b.code})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">نوع النشاط</label>
                  <select required value={form.actionId} onChange={e => setForm({ ...form, actionId: e.target.value })} className="input-field">
                    {actions.filter(a => a.isActive).map(a => <option key={a.id} value={a.id}>{a.name} ({a.points} نقطة)</option>)}
                  </select>
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">التاريخ</label>
                  <input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">العدد</label>
                  <input type="number" min="1" value={form.count} onChange={e => setForm({ ...form, count: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">الجودة</label>
                  <select value={form.quality} onChange={e => setForm({ ...form, quality: e.target.value })} className="input-field">
                    {QUALITIES.map(q => <option key={q} value={q}>{QUALITY_LABELS[q] || q}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">حالة الاعتماد</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input-field">
                    {APPROVAL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">المصدر</label>
                  <select value={form.sourceType} onChange={e => setForm({ ...form, sourceType: e.target.value })} className="input-field">
                    <option value="MANUAL">يدوي</option>
                    <option value="PARTICIPATION">مشاركة</option>
                    <option value="ENROLLMENT">تسجيل</option>
                    <option value="REPORT">تقرير</option>
                    <option value="EVALUATION">تقييم</option>
                    <option value="EXTERNAL">خارجي</option>
                  </select>
                </div>
              </div>
              {form.status === 'REJECTED' && (
                <div>
                  <label className="block text-sm font-semibold text-red-700 mb-1">سبب الرفض *</label>
                  <textarea rows={2} required value={form.rejectionReason} onChange={e => setForm({ ...form, rejectionReason: e.target.value })} className="input-field border-red-300 focus:border-red-500" placeholder="يجب توضيح سبب رفض النشاط..." />
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">رابط الدليل</label>
                <input value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} className="input-field" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">ملاحظات</label>
                <textarea rows={2} value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} className="input-field" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="btn-ghost btn-sm">إلغاء</button>
                <button type="submit" disabled={submitting} className="btn-primary btn-sm">{submitting ? 'جاري...' : 'حفظ'}</button>
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

function PulseTab({ beneficiaries, logs, actions, qualityBonus }: { beneficiaries: BeneficiaryInfo[]; logs: ImpactLogFull[]; actions: ImpactActionItem[]; qualityBonus: Record<string, number> }) {
  const now = new Date()
  const curMonth = now.getMonth() + 1
  const curYear = now.getFullYear()

  const memberStatuses = useMemo(() => {
    const actionMap = buildActionMap(actions as any)

    return beneficiaries.map(b => {
      const myLogs = logs.filter(l => l.beneficiaryId === b.id)
      const approved = myLogs.filter(l => l.status === 'APPROVED').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      const lastDate = approved[0]?.date || null
      const daysSince = lastDate ? Math.floor((now.getTime() - new Date(lastDate).getTime()) / 86400000) : Infinity
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

  return (
    <div>
      <div className="card mb-6">
        <h2 className="font-bold text-neutral-900 mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-primary-600" /> رصد نبض الشبكة</h2>
        <p className="text-sm text-neutral-500 mb-4">تحليل حالة النشاط للأعضاء حسب آخر نشاط معتمد</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-green-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-700">{memberStatuses.filter(m => m.status.key === 'active').length}</div>
            <div className="text-xs text-green-600">نشطون هذا الأسبوع</div>
          </div>
          <div className="bg-amber-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-amber-700">{idleMembers.length}</div>
            <div className="text-xs text-amber-600">خاملون / متوقفون</div>
          </div>
          <div className="bg-teal-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-teal-700">{activeMembers.length}</div>
            <div className="text-xs text-teal-600">متفاعلون</div>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-purple-700">{logs.filter(l => l.status === 'PENDING_REVIEW').length}</div>
            <div className="text-xs text-purple-600">بانتظار الاعتماد</div>
          </div>
        </div>
      </div>

      {idleMembers.length > 0 && (
        <div className="card mb-6">
          <h2 className="font-bold text-neutral-900 mb-4 flex items-center gap-2"><TriangleAlert size={18} className="text-amber-600" /> أعضاء يحتاجون متابعة</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {idleMembers.map(m => (
              <div key={m.id} className={`border rounded-xl p-3 flex items-center gap-3 ${m.status.key === 'dormant' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
                <div className={`w-2 h-2 rounded-full ${m.status.dot === 'r' ? 'bg-red-500' : 'bg-amber-500'}`} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-neutral-800">{fullName(m.firstName, m.lastName)}</div>
                  <div className="text-xs text-neutral-500">{m.status.label}{m.daysSince !== Infinity ? ` · ${m.daysSince} يوم` : ''}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeMembers.length > 0 && (
        <div className="card">
          <h2 className="font-bold text-neutral-900 mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-green-600" /> الأكثر تفاعلاً هذا الشهر</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeMembers.slice(0, 9).map(m => (
              <div key={m.id} className="border border-green-200 rounded-xl p-3 flex items-center gap-3 bg-green-50/50">
                <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold">{m.firstName?.charAt(0) || '؟'}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-neutral-800">{fullName(m.firstName, m.lastName)}</div>
                  <div className="text-xs text-neutral-500">{m.status.label}</div>
                </div>
                <div className="text-lg font-bold font-mono text-primary-700">{m.curPts}</div>
              </div>
            ))}
          </div>
        </div>
      )}
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

  return (
    <div>
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[220px]">
            <select value={memberId} onChange={e => setCardMemberId(e.target.value)} className="input-field">
              {beneficiaries.map(m => <option key={m.id} value={m.id}>{fullName(m.firstName, m.lastName)} ({m.code})</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input type="number" value={cardYear} onChange={e => setCardYear(+e.target.value)} className="input-field max-w-[100px]" />
            <select value={cardMonth} onChange={e => setCardMonth(+e.target.value)} className="input-field max-w-[140px]">
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Member Profile */}
      <div className="card mb-6 p-6 bg-gradient-to-l from-neutral-50 to-white border-2 border-primary-200">
        <div className="flex flex-wrap items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-600 to-teal-500 text-white flex items-center justify-center text-3xl font-bold shadow-lg">{b.firstName?.charAt(0) || '؟'}</div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-neutral-900">{fullName(b.firstName, b.lastName)} <Badge className="bg-primary-100 text-primary-700 text-sm">{b.code}</Badge></h3>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-neutral-500">
              <span>🛡️ {b.networkRole || '—'}</span>
              <span>📋 {b.platformName || b.platformId || '—'}</span>
              <span>📅 انضم: {b.joinDate ? dateLabel(b.joinDate) : '—'}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-white rounded-xl p-3 border shadow-sm">
              <div className="text-xs text-neutral-500">الإجمالي</div>
              <div className="text-2xl font-bold text-primary-700 font-mono">{total}</div>
            </div>
            <div className="bg-white rounded-xl p-3 border shadow-sm">
              <div className="text-xs text-neutral-500">الدروع</div>
              <div className="text-2xl font-bold text-amber-600">{myAwards.filter(a => a.type === 'SHIELD').length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Level Progress */}
      <div className="card mb-6 p-4">
        <div className="flex justify-between text-sm font-semibold mb-2">
          <span>المستوى: {lvl.name}</span>
          <span>{total} / {lvl.to >= 9999999 ? '∞' : lvl.to}</span>
        </div>
        <div className="h-3 bg-neutral-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-teal-500 to-amber-400 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="card p-4 text-center"><div className="text-xs text-neutral-500">نقاط الشهر</div><div className="text-xl font-bold font-mono">{monthlyPts}</div></div>
        <div className="card p-4 text-center"><div className="text-xs text-neutral-500">النقاط السنوية</div><div className="text-xl font-bold font-mono">{yearlyPts}</div></div>
        <div className="card p-4 text-center"><div className="text-xs text-neutral-500">الدروع</div><div className="text-xl font-bold">{myAwards.filter(a => a.type === 'SHIELD').length}</div></div>
        <div className="card p-4 text-center"><div className="text-xs text-neutral-500">الأنشطة</div><div className="text-xl font-bold">{myLogs.length}</div></div>
      </div>

      {/* Activities List */}
      <div className="card">
        <h2 className="font-bold text-neutral-900 mb-4 flex items-center gap-2"><Activity size={18} className="text-primary-600" /> آخر الأنشطة</h2>
        {myLogs.length > 0 ? (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {myLogs.slice().reverse().slice(0, 30).map(log => {
              const pts = calcPts(log)
              return (
                <div key={log.id} className="border rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm">{log.action?.name || '—'}</div>
                    <div className="flex gap-2 mt-1 text-xs text-neutral-500">
                      <span>{dateLabel(log.date)}</span>
                      <Badge className={STATUS_COLORS[log.status] || ''}>{STATUS_LABELS[log.status] || log.status}</Badge>
                      <span>{QUALITY_LABELS[log.quality]}</span>
                    </div>
                  </div>
                  <div className={`font-mono font-bold ${pts < 0 ? 'text-red-600' : 'text-primary-700'}`}>{pts}</div>
                </div>
              )
            })}
          </div>
        ) : <p className="text-center py-6 text-neutral-400">لا توجد أنشطة مسجلة</p>}
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
    <div>
      {/* Monthly eligibility table */}
      <div className="card mb-6">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="font-bold text-neutral-900 flex items-center gap-2"><Calculator size={18} className="text-primary-600" /> حاسبة الاستحقاق الشهري</h2>
          <input type="number" value={rYear} onChange={e => setRYear(+e.target.value)} className="input-field max-w-[90px]" />
          <select value={rMonth} onChange={e => setRMonth(+e.target.value)} className="input-field max-w-[130px]">
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </div>
        {rewardRows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-right p-3">العضو</th>
                  <th className="text-center p-3">نقاط الشهر</th>
                  <th className="text-center p-3">البوابة</th>
                  <th className="text-center p-3">الاستحقاق</th>
                </tr>
              </thead>
              <tbody>
                {rewardRows.map(r => (
                  <tr key={r.id} className="border-b border-neutral-100">
                    <td className="p-3 font-semibold">{fullName(r.firstName, r.lastName)}</td>
                    <td className="p-3 text-center font-mono font-bold">{r.pts}</td>
                    <td className="p-3 text-center">
                      <button onClick={() => toggleGate(r.id, rYear, rMonth, r.gatePassed)} className={`btn-sm px-3 py-1 rounded-lg text-xs ${r.gatePassed ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {r.gatePassed ? '✓ منجزة' : '✕ متعثرة'}
                      </button>
                    </td>
                    <td className="p-3 text-center">
                      <Badge className={r.eligible ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-red-50 text-red-700'}>
                        {r.eligible ? r.tier : 'لا استحقاق'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-center py-6 text-neutral-400">لا يوجد أعضاء</p>}
      </div>

      {/* Awards History */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-neutral-900 flex items-center gap-2"><Medal size={18} className="text-primary-600" /> سجل الدروع والمكافآت</h2>
          <button onClick={() => { setAwardForm({ beneficiaryId: beneficiaries[0]?.id || '', type: 'SHIELD', title: BADGE_CATALOG[0], date: today(), value: '0', note: '' }); setShowAwardModal(true) }} className="btn-primary btn-sm flex items-center gap-1"><Plus size={14} /> منح درع/مكافأة</button>
        </div>
        {awards.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-right p-3">المستلم</th>
                  <th className="text-center p-3">النوع</th>
                  <th className="text-right p-3">المسمى</th>
                  <th className="text-right p-3">التاريخ</th>
                  <th className="text-center p-3">حذف</th>
                </tr>
              </thead>
              <tbody>
                {awards.map(a => (
                  <tr key={a.id} className="border-b border-neutral-100">
                    <td className="p-3 font-semibold">{a.beneficiary ? fullName(a.beneficiary.firstName, a.beneficiary.lastName) : '—'}</td>
                    <td className="p-3 text-center"><Badge className={a.type === 'SHIELD' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}>{(AWARD_TYPES as any)[a.type] || a.type}</Badge></td>
                    <td className="p-3">{a.title}</td>
                    <td className="p-3 text-xs">{dateLabel(a.date)}</td>
                    <td className="p-3 text-center"><button onClick={() => delAward(a.id)} className="text-neutral-400 hover:text-red-600"><Trash size={13} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-center py-8 text-neutral-400"><Medal size={36} className="mx-auto mb-3 text-neutral-300" />لا توجد دروع أو مكافآت</p>}
      </div>

      {showAwardModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-bold text-neutral-900">منح درع أو مكافأة</h2>
              <button onClick={() => setShowAwardModal(false)} className="p-1.5 text-neutral-400 hover:text-neutral-600"><X size={18} /></button>
            </div>
            <form onSubmit={handleAwardSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">العضو</label>
                <select required value={awardForm.beneficiaryId} onChange={e => setAwardForm({ ...awardForm, beneficiaryId: e.target.value })} className="input-field">
                  {beneficiaries.map(b => <option key={b.id} value={b.id}>{fullName(b.firstName, b.lastName)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">النوع</label>
                <select value={awardForm.type} onChange={e => setAwardForm({ ...awardForm, type: e.target.value })} className="input-field">
                  <option value="SHIELD">درع</option>
                  <option value="REWARD">مكافأة مالية</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">اسم الدرع / وصف المكافأة</label>
                <input required value={awardForm.title} onChange={e => setAwardForm({ ...awardForm, title: e.target.value })} list="badgeList" className="input-field" />
                <datalist id="badgeList">{BADGE_CATALOG.map(b => <option key={b} value={b} />)}</datalist>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">التاريخ</label>
                  <input type="date" required value={awardForm.date} onChange={e => setAwardForm({ ...awardForm, date: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">القيمة (للمكافأة)</label>
                  <input type="number" value={awardForm.value} onChange={e => setAwardForm({ ...awardForm, value: e.target.value })} className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">ملاحظات</label>
                <input value={awardForm.note} onChange={e => setAwardForm({ ...awardForm, note: e.target.value })} className="input-field" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowAwardModal(false)} className="btn-ghost btn-sm">إلغاء</button>
                <button type="submit" disabled={submitting} className="btn-primary btn-sm">{submitting ? 'جاري...' : 'منح'}</button>
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

function ReportsTab({ beneficiaries, logs, actions, qualityBonus }: { beneficiaries: BeneficiaryInfo[]; logs: ImpactLogFull[]; actions: ImpactActionItem[]; qualityBonus: Record<string, number> }) {
  const { data: session } = useSession()
  const userRole = (session?.user as any)?.role || ''
  const isSuperAdmin = userRole === 'SUPER_ADMIN'

  const [repType, setRepType] = useState<'monthly' | 'weekly' | 'yearly'>('monthly')
  const [repYear, setRepYear] = useState(new Date().getFullYear())
  const [repMonth, setRepMonth] = useState(new Date().getMonth() + 1)
  const [repPlat, setRepPlat] = useState('')
  const [repRole, setRepRole] = useState('')

  // AI state
  const [aiSummary, setAiSummary] = useState('')
  const [aiAnalysis, setAiAnalysis] = useState<{ comparison: string; trends: string[] } | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  const actionMap = useMemo(() => buildActionMap(actions as any), [actions])

  const calcPts = (l: ImpactLogFull) => finalPoints(l as any, actionMap, qualityBonus as any)

  // AI handlers
  const handleGenerateSummary = async () => {
    if (!isSuperAdmin) { toast.error('الإدارة العليا فقط'); return }
    setAiLoading(true)
    try {
      const periodName = repType === 'monthly'
        ? `${MONTHS[repMonth - 1]} ${repYear}`
        : repType === 'yearly' ? `السنة ${repYear}` : 'الأسبوع الحالي'

      const totalPts = reportRows.reduce((s, r) => s + r.pts, 0)
      const activeCount = reportRows.filter(r => r.pts > 0).length
      const totalActs = reportRows.reduce((s, r) => s + r.actCount, 0)
      const top = reportRows[0]
      // المنصة الأنشط
      const platMap = new Map<string, number>()
      reportRows.filter(r => r.platformId).forEach(r => { const k = r.platformName || r.platformId!; platMap.set(k, (platMap.get(k) || 0) + r.actCount) })
      let topPlat = '—', topPlatCnt = 0
      for (const [k, v] of platMap) { if (v > topPlatCnt) { topPlatCnt = v; topPlat = k } }

      const res = await fetch('/api/admin/ai/report-summary', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodName,
          totalPoints: totalPts, activeMembers: activeCount, totalActivities: totalActs,
          topMember: top ? fullName(top.firstName, top.lastName) : '—',
          topMemberPoints: top?.pts || 0,
          topPlatform: topPlat, topPlatformApproved: topPlatCnt,
          memberCount: reportRows.length, platformCount: platMap.size,
          pendingCount: logs.filter(l => l.status === 'PENDING_REVIEW').length,
        }),
      })
      const data = await res.json()
      if (data.success) { setAiSummary(data.data.text); toast.success('تم توليد الملخص') }
      else toast.error(data.message || 'فشل')
    } catch { toast.error('فشل الاتصال بـ DeepSeek') }
    finally { setAiLoading(false) }
  }

  const handleAnalyze = async () => {
    if (!isSuperAdmin) { toast.error('الإدارة العليا فقط'); return }
    setAiLoading(true)
    try {
      const periodName = `${MONTHS[repMonth - 1]} ${repYear}`
      // بيانات الشهر الحالي
      const curPts = reportRows.reduce((s, r) => s + r.pts, 0)
      const curActive = reportRows.filter(r => r.pts > 0).length
      const curActs = reportRows.reduce((s, r) => s + r.actCount, 0)
      // الشهر السابق
      const prevMonth = repMonth === 1 ? 12 : repMonth - 1
      const prevYear = repMonth === 1 ? repYear - 1 : repYear
      const prevRows = beneficiaries.map(b => {
        const prevLogs = logs.filter(l => l.beneficiaryId === b.id && new Date(l.date).getFullYear() === prevYear && new Date(l.date).getMonth() + 1 === prevMonth)
        return prevLogs.reduce((s, l) => s + calcPts(l), 0)
      })
      const prevPts = prevRows.reduce((s, r) => s + r, 0)
      const prevActive = prevRows.filter(r => r > 0).length
      const prevActs = logs.filter(l => new Date(l.date).getFullYear() === prevYear && new Date(l.date).getMonth() + 1 === prevMonth).length
      // platforms
      const platData: Array<{ name: string; current: number; previous: number }> = []
      const platSet = new Set(beneficiaries.map(b => b.platformName || b.platformId).filter(Boolean) as string[])
      for (const p of platSet) {
        const cur = reportRows.filter(r => (r.platformName || r.platformId) === p).reduce((s, r) => s + r.actCount, 0)
        const prev = logs.filter(l => (l.platformId === p) && new Date(l.date).getFullYear() === prevYear && new Date(l.date).getMonth() + 1 === prevMonth).length
        platData.push({ name: p, current: cur, previous: prev })
      }

      const res = await fetch('/api/admin/ai/report-analysis', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodName,
          current: { totalPoints: curPts, activeMembers: curActive, totalActivities: curActs },
          previous: { totalPoints: prevPts, activeMembers: prevActive, totalActivities: prevActs },
          platforms: platData.slice(0, 10),
        }),
      })
      const data = await res.json()
      if (data.success) { setAiAnalysis(data.data); toast.success('تم التحليل') }
      else toast.error(data.message || 'فشل')
    } catch { toast.error('فشل الاتصال بـ DeepSeek') }
    finally { setAiLoading(false) }
  }

  // Filter
  let filtered = beneficiaries
  if (repPlat) filtered = filtered.filter(b => b.platformId === repPlat)
  if (repRole) filtered = filtered.filter(b => b.networkRole === repRole)

  const reportRows = filtered.map(b => {
    const myLogs = logs.filter(l => l.beneficiaryId === b.id)
    let filteredLogs = myLogs
    if (repType === 'monthly') filteredLogs = myLogs.filter(l => new Date(l.date).getFullYear() === repYear && new Date(l.date).getMonth() + 1 === repMonth)
    else if (repType === 'yearly') filteredLogs = myLogs.filter(l => new Date(l.date).getFullYear() === repYear)

    return { ...b, pts: filteredLogs.reduce((s, l) => s + calcPts(l), 0), actCount: filteredLogs.length }
  }).sort((a, b) => b.pts - a.pts)

  const totalPts = reportRows.reduce((s, r) => s + r.pts, 0)
  const totalActs = reportRows.reduce((s, r) => s + r.actCount, 0)
  const activeCount = reportRows.filter(r => r.pts > 0).length

  const titleMap = { monthly: `التقرير الشهري (${MONTHS[repMonth - 1]} ${repYear})`, weekly: 'التقرير الأسبوعي', yearly: `التقرير السنوي (${repYear})` }

  return (
    <div>
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <select value={repType} onChange={e => setRepType(e.target.value as any)} className="input-field max-w-[130px]">
            <option value="monthly">تقرير شهري</option>
            <option value="yearly">تقرير سنوي</option>
          </select>
          <input type="number" value={repYear} onChange={e => setRepYear(+e.target.value)} className="input-field max-w-[90px]" />
          {repType === 'monthly' && (
            <select value={repMonth} onChange={e => setRepMonth(+e.target.value)} className="input-field max-w-[120px]">
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          )}
          <select value={repPlat} onChange={e => setRepPlat(e.target.value)} className="input-field max-w-[180px]">
            <option value="">كل المنصات</option>
            {(() => {
              const platforms = new Map<string, string>() // id -> name
              for (const b of beneficiaries) {
                if (b.platformId && !platforms.has(b.platformId)) {
                  platforms.set(b.platformId, b.platformName || b.platformId)
                }
              }
              return Array.from(platforms.entries()).map(([id, name]) => <option key={id} value={id}>{name}</option>)
            })()}
          </select>
          <select value={repRole} onChange={e => setRepRole(e.target.value)} className="input-field max-w-[150px]">
            <option value="">كل الصفات</option>
            {NETWORK_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      {/* طباعة + التقرير */}
      <div className="flex justify-end mb-3">
        <button
          onClick={() => {
            const printArea = document.getElementById('reportPrintArea')
            if (!printArea) return
            const win = window.open('', '_blank', 'width=800,height=600')
            if (!win) return
            win.document.write(`
              <html dir="rtl"><head><meta charset="utf-8"><title>تقرير لوحة الأثر</title>
              <style>body{font-family:sans-serif;padding:30px;color:#222}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #ccc;padding:8px;text-align:right}th{background:#f5f5f5}.text-center{text-align:center}.text-xs{font-size:12px;color:#666}</style>
              </head><body>${printArea.innerHTML}</body></html>
            `)
            win.document.close()
            win.focus()
            setTimeout(() => win.print(), 300)
          }}
          className="btn-ghost btn-sm flex items-center gap-1.5"
        >
          <Printer size={14} />
          طباعة التقرير
        </button>
        {isSuperAdmin && (
          <>
            <button
              onClick={handleGenerateSummary}
              disabled={aiLoading}
              className="btn-ghost btn-sm flex items-center gap-1.5 text-primary-600"
            >
              {aiLoading ? <div className="w-4 h-4 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" /> : <Star size={14} />}
              توليد ملخص ذكي
            </button>
            <button
              onClick={handleAnalyze}
              disabled={aiLoading}
              className="btn-ghost btn-sm flex items-center gap-1.5 text-teal-600"
            >
              <TrendingUp size={14} />
              تحليل الاتجاهات
            </button>
          </>
        )}
      </div>

      {/* AI Summary */}
      {aiSummary && (
        <div className="card p-5 mb-4 border-2 border-primary-200 bg-gradient-to-l from-primary-50/50 to-white">
          <div className="flex items-center gap-2 mb-3">
            <Star size={16} className="text-primary-600" />
            <h3 className="font-bold text-primary-800 text-sm">الملخص الذكي</h3>
            <span className="text-[10px] bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full">مساعد ذكي</span>
          </div>
          <p className="text-neutral-700 text-sm leading-relaxed">{aiSummary}</p>
          <button onClick={() => setAiSummary('')} className="text-xs text-neutral-400 hover:text-red-500 mt-2">إخفاء</button>
        </div>
      )}

      {/* AI Analysis */}
      {aiAnalysis && (
        <div className="card p-5 mb-4 border-2 border-teal-200 bg-gradient-to-l from-teal-50/50 to-white">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-teal-600" />
            <h3 className="font-bold text-teal-800 text-sm">التحليل الذكي</h3>
            <span className="text-[10px] bg-teal-100 text-teal-600 px-2 py-0.5 rounded-full">مساعد ذكي</span>
          </div>
          <p className="text-neutral-700 text-sm leading-relaxed mb-3">{aiAnalysis.comparison}</p>
          {aiAnalysis.trends.length > 0 && (
            <ul className="space-y-1">
              {aiAnalysis.trends.map((t, i) => (
                <li key={i} className="text-sm text-neutral-600 flex items-start gap-2">
                  <span className="text-teal-500 mt-1">•</span> {t}
                </li>
              ))}
            </ul>
          )}
          <button onClick={() => setAiAnalysis(null)} className="text-xs text-neutral-400 hover:text-red-500 mt-2">إخفاء</button>
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
          <div className="bg-amber-50 rounded-xl p-4 text-center"><div className="text-2xl font-bold text-amber-700">{totalPts}</div><div className="text-xs text-amber-600">مجموع النقاط</div></div>
          <div className="bg-teal-50 rounded-xl p-4 text-center"><div className="text-2xl font-bold text-teal-700">{activeCount}</div><div className="text-xs text-teal-600">الأعضاء المتفاعلون</div></div>
          <div className="bg-purple-50 rounded-xl p-4 text-center"><div className="text-2xl font-bold text-purple-700">{totalActs}</div><div className="text-xs text-purple-600">إجمالي الأنشطة</div></div>
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
                { title: '📱 مؤثر الفترة', name: influencer ? fullName(influencer.firstName, influencer.lastName) : '—', pts: influencer?.pts || 0, color: 'from-cyan-400 to-teal-600' },
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
          <table className="w-full text-sm border">
            <thead><tr className="bg-neutral-50"><th className="text-center p-2 border">#</th><th className="text-right p-2 border">الاسم</th><th className="text-right p-2 border">الصفة</th><th className="text-center p-2 border">الأنشطة</th><th className="text-center p-2 border">النقاط</th></tr></thead>
            <tbody>
              {reportRows.filter(r => r.pts > 0).slice(0, 20).map((r, i) => (
                <tr key={r.id}><td className="text-center p-2 border">{i + 1}</td><td className="p-2 border font-semibold">{fullName(r.firstName, r.lastName)}</td><td className="p-2 border">{r.networkRole || '—'}</td><td className="text-center p-2 border">{r.actCount}</td><td className="text-center p-2 border font-mono font-bold">{r.pts}</td></tr>
              ))}
            </tbody>
          </table>
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
    for (const a of localActions) { const cat = a.category || 'OTHER'; if (!groups[cat]) groups[cat] = []; groups[cat].push(a) }
    return groups
  }, [localActions])

  const sectionOpts = [
    { key: 'catalog' as const, label: 'كتالوج الأنشطة', icon: Settings },
    { key: 'quality' as const, label: 'بونص الجودة', icon: Star },
    { key: 'levels' as const, label: 'المستويات', icon: TrendingUp },
    { key: 'tiers' as const, label: 'شرائح المكافآت', icon: Medal },
  ]

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 overflow-x-auto">
        {sectionOpts.map(s => (
          <button key={s.key} onClick={() => setSection(s.key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap flex items-center gap-1.5 ${section === s.key ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}>
            <s.icon size={14} /> {s.label}
          </button>
        ))}
      </div>

      {section === 'catalog' && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-neutral-900 flex items-center gap-2"><Settings size={18} className="text-primary-600" /> كتالوج الأنشطة</h2>
            {showModal ? null : <button onClick={() => { setForm({ name: '', points: '10', category: 'DIGITAL_ACTIVITY', note: '' }); setShowModal(true) }} className="btn-primary btn-sm flex items-center gap-1"><Plus size={14} /> إضافة نشاط</button>}
          </div>
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} className="mb-6">
              <h3 className="font-semibold text-neutral-700 mb-2 bg-neutral-50 p-2 rounded-lg">{CATEGORY_LABELS[cat] || cat}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-neutral-100"><th className="text-right p-2 text-neutral-500">اسم النشاط</th><th className="text-center p-2 text-neutral-500">النقاط</th><th className="text-right p-2 text-neutral-500">ملاحظات</th><th className="text-center p-2 text-neutral-500">حذف</th></tr></thead>
                  <tbody>{items.map(a => (<tr key={a.id} className="border-b border-neutral-50 hover:bg-neutral-50"><td className="p-2 font-semibold">{a.name}</td><td className="p-2 text-center font-mono font-bold">{a.points}</td><td className="p-2 text-xs text-neutral-500">{a.note || '—'}</td><td className="p-2 text-center"><button onClick={() => delAction(a.id)} className="text-neutral-400 hover:text-red-600"><Trash size={13} /></button></td></tr>))}</tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {section === 'quality' && settings && (
        <div className="card p-5">
          <h2 className="font-bold text-neutral-900 mb-4 flex items-center gap-2"><Star size={18} className="text-primary-600" /> بونص الجودة</h2>
          <p className="text-sm text-neutral-500 mb-4">النقاط الإضافية (أو المخصومة) حسب مستوى جودة النشاط</p>
          <div className="space-y-3 max-w-md">
            {Object.entries(settings.qualityBonus as Record<string, number>).map(([key, val]) => (
              <div key={key} className="flex items-center gap-3">
                <span className="w-24 text-sm font-semibold text-neutral-700">{QUALITY_LABELS[key] || key}</span>
                <input type="number" defaultValue={val} onBlur={e => {
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
          <div className="space-y-3 max-w-lg">
            {(settings.levels as any[]).map((lv: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-32 text-sm font-semibold text-neutral-700">{lv.name}</span>
                <span className="text-xs text-neutral-400">من</span>
                <input type="number" defaultValue={lv.from} onBlur={e => {
                  const n = Number(e.target.value); if (!isNaN(n)) {
                    const u = settings.levels.map((l: any, j: number) => j === i ? { ...l, from: n } : l)
                    setSettings({ ...settings, levels: u }); saveSettings('levels', u)
                  }
                }} className="input-field max-w-[90px] text-center" />
                <span className="text-xs text-neutral-400">إلى</span>
                <input type="number" defaultValue={lv.to} onBlur={e => {
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
          <div className="space-y-3 max-w-lg">
            {(settings.rewardTiers as any[]).map((tier: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-24 text-sm font-semibold text-neutral-700">{tier.name}</span>
                <span className="text-xs text-neutral-400">من</span>
                <input type="number" defaultValue={tier.from} onBlur={e => {
                  const n = Number(e.target.value); if (!isNaN(n)) {
                    const u = settings.rewardTiers.map((t: any, j: number) => j === i ? { ...t, from: n } : t)
                    setSettings({ ...settings, rewardTiers: u }); saveSettings('rewardTiers', u)
                  }
                }} className="input-field max-w-[90px] text-center" />
                <span className="text-xs text-neutral-400">إلى</span>
                <input type="number" defaultValue={tier.to} onBlur={e => {
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
            <div className="flex items-center justify-between p-5 border-b"><h2 className="font-bold text-neutral-900">إضافة نشاط جديد</h2><button onClick={() => setShowModal(false)} className="p-1.5 text-neutral-400 hover:text-neutral-600"><X size={18} /></button></div>
            <form onSubmit={handleAdd} className="p-5 space-y-4">
              <div><label className="block text-sm font-semibold text-neutral-700 mb-1">اسم النشاط</label><input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" /></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-semibold text-neutral-700 mb-1">النقاط</label><input type="number" value={form.points} onChange={e => setForm({ ...form, points: e.target.value })} className="input-field" /></div><div><label className="block text-sm font-semibold text-neutral-700 mb-1">المحور</label><select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input-field">{Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div></div>
              <div><label className="block text-sm font-semibold text-neutral-700 mb-1">ملاحظات</label><input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} className="input-field" /></div>
              <div className="flex justify-end gap-3 pt-4 border-t"><button type="button" onClick={() => setShowModal(false)} className="btn-ghost btn-sm">إلغاء</button><button type="submit" disabled={submitting} className="btn-primary btn-sm">{submitting ? 'جاري...' : 'إضافة'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}