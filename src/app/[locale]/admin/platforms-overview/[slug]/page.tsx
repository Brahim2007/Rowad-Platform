'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  Activity, AlertTriangle, ArrowRight, BarChart3, BookOpen, Building2,
  BellRing, CheckCircle2, ClipboardCheck, FileText, FolderKanban, Gauge, History, Mail,
  RefreshCw, Send, ShieldCheck, Sparkles, Target, TrendingDown, TrendingUp, UserCheck, Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'

const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']

interface MonitoringData {
  platform: { id: string; name: string; slug: string; description: string; vision: string | null; logo: string | null; color: string | null; isActive: boolean }
  period: { year: number; month: number; previousYear: number; previousMonth: number }
  health: {
    score: number
    status: 'HEALTHY' | 'WATCH' | 'CRITICAL'
    alerts: Array<{ severity: 'danger' | 'warning' | 'info'; code: string; title: string; detail: string; target: string }>
  }
  manager: { id: string; fullName: string; email: string; lastLoginAt: string | null; createdAt: string } | null
  managerHistory: Array<{
    id: string; assignmentRole: string; startedAt: string; endedAt: string | null; assignedBy: string | null; note: string | null
    adminUser: { id: string; fullName: string; email: string; isActive: boolean }
  }>
  kpis: {
    members: number; activeMembers: number; activeRate: number; activities: number
    approvedActivities: number; pendingActivities: number; stalePending: number; approvalRate: number
    points: number; pointsTrend: number; activitiesTrend: number
    reports: { total: number; approved: number; pending: number }
    documents: number; evaluationScore: number | null; openTasks: number; overdueTasks: number
  }
  members: {
    top: MemberRow[]
    inactive: MemberRow[]
    recent: MemberRow[]
  }
  activities: {
    recent: Array<{ id: string; memberName: string; memberCode: string; actionName: string; status: string; date: string; points: number; note: string | null; rejectionReason: string | null }>
    pending: Array<{ id: string; date: string; note: string | null; action: { name: string } | null; beneficiary: { firstName: string; lastName: string; code: string } | null }>
  }
  programs: Array<{ id: string; name: string; slug: string; isActive: boolean; startDate: string | null; endDate: string | null; _count: { activities: number; enrollments: number; submittedReports: number } }>
  projects: Array<{ id: string; title: string; slug: string; status: string; startDate: string | null; endDate: string | null }>
  reports: Array<{ id: string; status: string; submittedBy: string | null; submittedAt: string | null; reviewedAt: string | null; createdAt: string; template: { title: string; category: string } }>
  documents: Array<{ id: string; title: string; type: string; status: string; periodYear: number | null; periodMonth: number | null; createdAt: string }>
  evaluations: Array<{ id: string; title: string; type: string; score: number | null; maxScore: number; status: string; evaluatedAt: string; recommendations: string | null }>
  tasks: Array<{ id: string; title: string; status: string; priority: string; assignee: string | null; dueDate: string | null }>
  indicators: Array<{ id: string; indicatorKey: string; indicatorName: string; value: number; target: number | null; unit: string | null; period: string; recordedAt: string }>
  dataQuality: { logsWithoutPlatform: number }
}

interface MemberRow {
  id: string; code: string; firstName: string; lastName: string; name: string
  email: string | null; networkRole: string | null; joinDate: string | null
  points: number; activities: number; lastActivity: string | null; isActiveInPeriod: boolean
}

interface AiAlertProposal {
  id: string
  rule: string
  recipientId: string
  recipientType: 'ADMIN' | 'PLATFORM_MANAGER' | 'MEMBER'
  recipientName: string
  severity: 'SUCCESS' | 'INFO' | 'WARNING' | 'CRITICAL'
  title: string
  body: string
  evidence: string
}

type TabKey = 'overview' | 'manager' | 'members' | 'activities' | 'programs' | 'reports' | 'governance' | 'alerts'

function dateLabel(value: string | null) {
  return value ? new Date(value).toLocaleDateString('ar-SA') : '—'
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    APPROVED: { label: 'معتمد', cls: 'bg-green-50 text-green-700 border-green-200' },
    PENDING_REVIEW: { label: 'قيد المراجعة', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    REJECTED: { label: 'مرفوض', cls: 'bg-red-50 text-red-700 border-red-200' },
    DRAFT: { label: 'مسودة', cls: 'bg-neutral-100 text-neutral-600 border-neutral-200' },
    SUBMITTED: { label: 'مرفوع', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    REVIEWED: { label: 'مراجع', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
    FINAL: { label: 'نهائي', cls: 'bg-teal-50 text-teal-700 border-teal-200' },
  }
  const item = map[status] || { label: status, cls: 'bg-neutral-50 text-neutral-600 border-neutral-200' }
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${item.cls}`}>{item.label}</span>
}

function Trend({ value }: { value: number }) {
  if (!value) return <span className="text-xs text-neutral-400">دون تغير</span>
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold ${value > 0 ? 'text-green-700' : 'text-red-700'}`}>
      {value > 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
      {value > 0 ? '+' : ''}{value}%
    </span>
  )
}

export default function PlatformMonitoringPage() {
  const params = useParams<{ locale: string; slug: string }>()
  const { data: session } = useSession()
  const now = new Date()
  const [data, setData] = useState<MonitoringData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabKey>('overview')
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [memberSearch, setMemberSearch] = useState('')
  const [alertProposals, setAlertProposals] = useState<AiAlertProposal[]>([])
  const [selectedAlertIds, setSelectedAlertIds] = useState<Set<string>>(new Set())
  const [analyzingAlerts, setAnalyzingAlerts] = useState(false)
  const [sendingAlerts, setSendingAlerts] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/platforms-overview/${params.slug}?year=${year}&month=${month}`, { cache: 'no-store' })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.message || 'تعذر تحميل بيانات المنصة')
      setData(result.data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'تعذر تحميل بيانات المنصة')
    } finally {
      setLoading(false)
    }
  }, [params.slug, year, month])

  useEffect(() => { load() }, [load])

  const analyzeAlerts = async () => {
    setAnalyzingAlerts(true)
    try {
      const response = await fetch(`/api/admin/platforms-overview/${params.slug}/ai-alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, month, send: false, useAi: true }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.message || 'تعذر تحليل التنبيهات')
      const proposals = (result.data.proposals || []) as AiAlertProposal[]
      setAlertProposals(proposals)
      setSelectedAlertIds(new Set(proposals.map(item => item.id)))
      toast.success(result.data.aiUsed ? 'اكتمل التحليل وصياغة الرسائل بالذكاء الاصطناعي' : 'اكتمل التحليل بالقواعد التشغيلية')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'تعذر تحليل التنبيهات')
    } finally {
      setAnalyzingAlerts(false)
    }
  }

  const sendAlerts = async () => {
    if (!selectedAlertIds.size) return toast.error('اختر إشعارًا واحدًا على الأقل')
    setSendingAlerts(true)
    try {
      const response = await fetch(`/api/admin/platforms-overview/${params.slug}/ai-alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, month, send: true, useAi: true, selectedIds: Array.from(selectedAlertIds) }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.message || 'تعذر إرسال الإشعارات')
      toast.success(`تم إرسال ${result.data.sent} إشعار${result.data.skipped ? `، وتجاوز ${result.data.skipped} مكرر` : ''}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'تعذر إرسال الإشعارات')
    } finally {
      setSendingAlerts(false)
    }
  }

  const filteredMembers = useMemo(() => {
    if (!data) return []
    const query = memberSearch.trim().toLocaleLowerCase('ar')
    const rows = data.members.recent
    if (!query) return rows
    return rows.filter(member => [member.name, member.code, member.email, member.networkRole].some(value => String(value || '').toLocaleLowerCase('ar').includes(query)))
  }, [data, memberSearch])

  if (loading && !data) {
    return <div className="py-24 text-center"><div className="w-9 h-9 rounded-full border-4 border-primary-100 border-t-primary-600 animate-spin mx-auto" /><p className="text-sm text-neutral-500 mt-3">جاري إعداد غرفة المتابعة...</p></div>
  }
  if (!data) return <div className="p-8 text-center text-neutral-500">تعذر تحميل بيانات المنصة.</div>

  const { platform, health, kpis } = data
  const locale = params.locale || 'ar'
  const userRole = (session?.user as { role?: string } | undefined)?.role
  const canManageSmartAlerts = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN'
  const healthStyle = health.status === 'HEALTHY'
    ? 'from-emerald-700 to-teal-600'
    : health.status === 'WATCH'
      ? 'from-amber-700 to-orange-600'
      : 'from-red-800 to-rose-700'

  const tabs: Array<{ key: TabKey; label: string; icon: typeof Gauge }> = [
    { key: 'overview', label: 'الملخص', icon: Gauge },
    ...(canManageSmartAlerts ? [{ key: 'alerts' as const, label: 'التنبيهات الذكية', icon: BellRing }] : []),
    { key: 'manager', label: 'الإدارة', icon: UserCheck },
    { key: 'members', label: 'الأعضاء', icon: Users },
    { key: 'activities', label: 'الأنشطة', icon: Activity },
    { key: 'programs', label: 'البرامج والمشاريع', icon: BookOpen },
    { key: 'reports', label: 'التقارير والوثائق', icon: FileText },
    { key: 'governance', label: 'الجودة والمهام', icon: ShieldCheck },
  ]
  const kpiCards: Array<{ label: string; value: string | number; hint: string; icon: LucideIcon }> = [
    { label: 'الأعضاء', value: kpis.members, hint: `${kpis.activeMembers} نشط`, icon: Users },
    { label: 'نسبة المشاركة', value: `${kpis.activeRate}%`, hint: 'خلال الفترة', icon: UserCheck },
    { label: 'النقاط', value: kpis.points, hint: `${kpis.pointsTrend}% تغير`, icon: Target },
    { label: 'الأنشطة', value: kpis.activities, hint: `${kpis.approvedActivities} معتمد`, icon: Activity },
    { label: 'نسبة الاعتماد', value: `${kpis.approvalRate}%`, hint: `${kpis.pendingActivities} معلق`, icon: CheckCircle2 },
    { label: 'التقارير', value: kpis.reports.total, hint: `${kpis.reports.approved} معتمد`, icon: FileText },
    { label: 'التقييم', value: kpis.evaluationScore === null ? '—' : `${kpis.evaluationScore}%`, hint: 'ضمان الجودة', icon: ShieldCheck },
    { label: 'المهام', value: kpis.openTasks, hint: `${kpis.overdueTasks} متأخر`, icon: ClipboardCheck },
  ]

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className={`rounded-3xl overflow-hidden bg-gradient-to-l ${healthStyle} text-white p-5 md:p-7`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <Link href={`/${locale}/admin/platforms-overview`} className="inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-white no-underline mb-4"><ArrowRight size={14} /> مركز متابعة المنصات</Link>
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0"><Building2 size={23} /></div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black">{platform.name}</h1>
                <p className="text-sm text-white/70 mt-2 max-w-2xl leading-6">{platform.description}</p>
                {canManageSmartAlerts && (
                  <Button
                    unstyled
                    onClick={() => setTab('alerts')}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white px-4 py-2.5 text-sm font-bold text-primary-800 shadow-sm hover:bg-primary-50"
                  >
                    <BellRing size={16} /> مراجعة التنبيهات الذكية
                    {alertProposals.length > 0 && <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[10px]">{alertProposals.length}</span>}
                  </Button>
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-[120px_1fr] gap-3 min-w-full sm:min-w-[360px] lg:min-w-[390px]">
            <div className="rounded-2xl bg-white/10 border border-white/15 p-4 text-center">
              <div className="text-3xl font-black">{health.score}</div>
              <div className="text-[10px] text-white/70 mt-1">مؤشر الصحة / 100</div>
            </div>
            <div className="rounded-2xl bg-white/10 border border-white/15 p-4">
              <div className="text-xs text-white/60">مدير المنصة</div>
              <div className="font-bold mt-1">{data.manager?.fullName || 'غير معيّن'}</div>
              <div className="text-[10px] text-white/60 mt-1">{data.manager?.lastLoginAt ? `آخر دخول ${dateLabel(data.manager.lastLoginAt)}` : data.manager ? 'لم يسجل الدخول' : 'تحتاج المنصة إلى تعيين مسؤول'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-4 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {tabs.map(item => (
            <Button unstyled key={item.key} onClick={() => setTab(item.key)} className={`rounded-xl px-3 py-2.5 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap ${tab === item.key ? 'bg-primary-600 text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}>
              <item.icon size={14} /> {item.label}
            </Button>
          ))}
        </div>
        <div className="flex items-end gap-2">
          <label className="space-y-1"><span className="text-[10px] text-neutral-500">السنة</span><Input type="number" value={year} onChange={event => setYear(Number(event.target.value))} className="w-24" /></label>
          <label className="space-y-1"><span className="text-[10px] text-neutral-500">الشهر</span><NativeSelect value={month} onChange={event => setMonth(Number(event.target.value))} wrapperClassName="w-32">{MONTHS.map((label, index) => <option key={label} value={index + 1}>{label}</option>)}</NativeSelect></label>
          <Button unstyled onClick={load} disabled={loading} className="btn-ghost h-10 px-3 flex items-center gap-1.5"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> تحديث</Button>
        </div>
      </div>

      {health.alerts.length > 0 && (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {health.alerts.map(alert => (
            <Button unstyled key={alert.code} onClick={() => setTab(alert.target === 'manager' ? 'manager' : alert.target === 'members' ? 'members' : alert.target === 'activities' ? 'activities' : alert.target === 'reports' ? 'reports' : 'governance')} className={`text-right rounded-2xl border p-4 ${alert.severity === 'danger' ? 'border-red-200 bg-red-50' : alert.severity === 'warning' ? 'border-amber-200 bg-amber-50' : 'border-blue-200 bg-blue-50'}`}>
              <div className="flex items-start gap-2"><AlertTriangle size={16} className={alert.severity === 'danger' ? 'text-red-600' : alert.severity === 'warning' ? 'text-amber-600' : 'text-blue-600'} /><div><div className="text-sm font-bold text-neutral-900">{alert.title}</div><div className="text-xs text-neutral-600 mt-1 leading-5">{alert.detail}</div></div></div>
            </Button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        {kpiCards.map(item => (
          <div key={item.label} className="rounded-2xl border border-neutral-200 bg-white p-3">
            <item.icon size={16} className="text-primary-600 mb-2" />
            <div className="text-lg font-black text-neutral-900">{typeof item.value === 'number' ? item.value.toLocaleString('ar-SA') : item.value}</div>
            <div className="text-xs font-semibold text-neutral-700">{item.label}</div>
            <div className="text-[10px] text-neutral-400 mt-1">{item.hint}</div>
          </div>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid lg:grid-cols-3 gap-5">
          <section className="lg:col-span-2 rounded-2xl border border-neutral-200 bg-white p-5">
            <h2 className="font-bold text-neutral-900 flex items-center gap-2"><BarChart3 size={17} className="text-primary-600" /> قراءة الفترة</h2>
            <div className="grid sm:grid-cols-2 gap-4 mt-5">
              {[['نشاط الأعضاء', kpis.activeRate, `${kpis.activeMembers} من ${kpis.members}`], ['اعتماد الأنشطة', kpis.approvalRate, `${kpis.approvedActivities} من ${kpis.activities}`]].map(([label, value, hint]) => (
                <div key={String(label)} className="rounded-xl bg-neutral-50 p-4">
                  <div className="flex justify-between text-xs mb-2"><span className="font-semibold">{label}</span><span>{value}%</span></div>
                  <div className="h-2 rounded-full bg-neutral-200 overflow-hidden"><div className="h-full bg-primary-600 rounded-full" style={{ width: `${Math.min(100, Number(value))}%` }} /></div>
                  <div className="text-[10px] text-neutral-400 mt-2">{hint}</div>
                </div>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 gap-3 mt-4">
              <div className="rounded-xl border p-4 flex items-center justify-between"><div><div className="text-xs text-neutral-500">اتجاه النقاط</div><div className="font-bold mt-1">{kpis.points.toLocaleString('ar-SA')} نقطة</div></div><Trend value={kpis.pointsTrend} /></div>
              <div className="rounded-xl border p-4 flex items-center justify-between"><div><div className="text-xs text-neutral-500">اتجاه الأنشطة</div><div className="font-bold mt-1">{kpis.approvedActivities} نشاطًا معتمدًا</div></div><Trend value={kpis.activitiesTrend} /></div>
            </div>
          </section>
          <section className="rounded-2xl border border-neutral-200 bg-white p-5">
            <h2 className="font-bold text-neutral-900 flex items-center gap-2"><Target size={17} className="text-primary-600" /> المؤشرات المستهدفة</h2>
            <div className="space-y-3 mt-4">
              {data.indicators.length ? data.indicators.slice(0, 6).map(indicator => {
                const progress = indicator.target ? Math.min(100, Math.round(indicator.value / indicator.target * 100)) : 0
                return <div key={indicator.id} className="rounded-xl bg-neutral-50 p-3"><div className="flex justify-between gap-2 text-xs"><span className="font-semibold">{indicator.indicatorName}</span><span>{indicator.value}{indicator.unit || ''}{indicator.target ? ` / ${indicator.target}` : ''}</span></div>{indicator.target && <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden mt-2"><div className="h-full bg-teal-600" style={{ width: `${progress}%` }} /></div>}</div>
              }) : <p className="text-sm text-neutral-400 text-center py-8">لم تُحدد مؤشرات مستهدفة بعد</p>}
            </div>
          </section>
          <section className="lg:col-span-3 rounded-2xl border border-neutral-200 bg-white p-5">
            <div className="flex items-center justify-between gap-3"><h2 className="font-bold text-neutral-900">أفضل أعضاء الفترة</h2><Button unstyled onClick={() => setTab('members')} className="text-xs text-primary-700">عرض جميع الأعضاء</Button></div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
              {data.members.top.slice(0, 5).map((member, index) => <div key={member.id} className="rounded-xl border p-3"><div className="text-[10px] text-neutral-400">#{index + 1}</div><div className="font-bold text-sm mt-1">{member.name}</div><div className="text-xs text-primary-700 mt-2">{member.points} نقطة · {member.activities} نشاط</div></div>)}
            </div>
          </section>
        </div>
      )}

      {tab === 'manager' && (
        <div className="grid lg:grid-cols-3 gap-5">
          <section className="rounded-2xl border border-neutral-200 bg-white p-5">
            <h2 className="font-bold text-neutral-900 flex items-center gap-2"><UserCheck size={17} className="text-primary-600" /> المدير الحالي</h2>
            {data.manager ? <div className="mt-5"><div className="w-14 h-14 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center"><UserCheck size={24} /></div><div className="text-lg font-bold mt-4">{data.manager.fullName}</div><a href={`mailto:${data.manager.email}`} className="text-sm text-primary-700 mt-1 inline-flex items-center gap-1"><Mail size={13} /> {data.manager.email}</a><div className="text-xs text-neutral-500 mt-4">آخر دخول: {data.manager.lastLoginAt ? dateLabel(data.manager.lastLoginAt) : 'لم يسجل الدخول'}</div></div> : <div className="py-10 text-center"><AlertTriangle className="mx-auto text-red-400" /><p className="font-bold mt-3">لا يوجد مدير معيّن</p></div>}
            <Link href={`/${locale}/admin/users?platformId=${platform.id}`} className="btn-primary btn-sm no-underline flex justify-center mt-5">{data.manager ? 'تغيير بيانات المدير' : 'تعيين مدير المنصة'}</Link>
          </section>
          <section className="lg:col-span-2 rounded-2xl border border-neutral-200 bg-white p-5">
            <h2 className="font-bold text-neutral-900 flex items-center gap-2"><History size={17} className="text-primary-600" /> سجل التعيينات</h2>
            <div className="space-y-3 mt-4">
              {data.managerHistory.length ? data.managerHistory.map(item => <div key={item.id} className="rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"><div><div className="font-bold text-sm">{item.adminUser.fullName}</div><div className="text-xs text-neutral-500 mt-1">{item.assignmentRole === 'PRIMARY' ? 'مدير أساسي' : 'نائب المدير'} · عيّنه {item.assignedBy || 'النظام'}</div></div><div className="text-xs text-neutral-500">{dateLabel(item.startedAt)} — {item.endedAt ? dateLabel(item.endedAt) : 'حتى الآن'}</div></div>) : <p className="text-sm text-neutral-400 text-center py-10">لا يوجد سجل تعيينات</p>}
            </div>
          </section>
        </div>
      )}

      {tab === 'members' && (
        <section className="rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4"><div><h2 className="font-bold text-neutral-900">أعضاء المنصة</h2><p className="text-xs text-neutral-500 mt-1">{data.members.inactive.length} عضوًا دون نشاط في الفترة</p></div><Input value={memberSearch} onChange={event => setMemberSearch(event.target.value)} placeholder="بحث بالاسم أو الرمز أو البريد" className="sm:max-w-xs" /></div>
          <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead className="text-right">العضو</TableHead><TableHead className="text-right">الصفة</TableHead><TableHead className="text-center">الأنشطة</TableHead><TableHead className="text-center">النقاط</TableHead><TableHead className="text-center">الحالة</TableHead><TableHead /></TableRow></TableHeader><TableBody>{filteredMembers.map(member => <TableRow key={member.id}><TableCell><div className="font-bold text-sm">{member.name}</div><div className="text-[10px] text-neutral-400">{member.code} · {member.email || 'دون بريد'}</div></TableCell><TableCell>{member.networkRole || '—'}</TableCell><TableCell className="text-center">{member.activities}</TableCell><TableCell className="text-center font-bold">{member.points}</TableCell><TableCell className="text-center">{member.isActiveInPeriod ? <span className="text-green-700 text-xs">نشط</span> : <span className="text-amber-700 text-xs">يحتاج متابعة</span>}</TableCell><TableCell><Link href={`/${locale}/admin/impact?tab=card&memberId=${member.id}`} className="text-xs text-primary-700">البطاقة</Link></TableCell></TableRow>)}</TableBody></Table></div>
        </section>
      )}

      {tab === 'activities' && (
        <section className="rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="flex items-center justify-between gap-3 mb-4"><div><h2 className="font-bold text-neutral-900">أنشطة الفترة</h2><p className="text-xs text-neutral-500 mt-1">{kpis.stalePending} متأخر أكثر من 7 أيام</p></div><Link href={`/${locale}/admin/impact?tab=activities&platformId=${platform.id}`} className="btn-primary btn-sm no-underline">فتح سجل الأنشطة</Link></div>
          <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead className="text-right">العضو</TableHead><TableHead className="text-right">النشاط</TableHead><TableHead className="text-right">التاريخ</TableHead><TableHead className="text-center">النقاط</TableHead><TableHead className="text-center">الحالة</TableHead></TableRow></TableHeader><TableBody>{data.activities.recent.map(activity => <TableRow key={activity.id}><TableCell><div className="font-semibold">{activity.memberName}</div><div className="text-[10px] text-neutral-400">{activity.memberCode}</div></TableCell><TableCell>{activity.actionName}</TableCell><TableCell>{dateLabel(activity.date)}</TableCell><TableCell className="text-center font-bold">{activity.points}</TableCell><TableCell className="text-center"><StatusBadge status={activity.status} /></TableCell></TableRow>)}</TableBody></Table></div>
        </section>
      )}

      {tab === 'programs' && (
        <div className="grid lg:grid-cols-2 gap-5">
          <section className="rounded-2xl border border-neutral-200 bg-white p-5"><h2 className="font-bold flex items-center gap-2"><BookOpen size={17} className="text-primary-600" /> البرامج</h2><div className="space-y-3 mt-4">{data.programs.map(program => <div key={program.id} className="rounded-xl border p-4"><div className="flex justify-between gap-3"><div className="font-bold">{program.name}</div><StatusBadge status={program.isActive ? 'APPROVED' : 'DRAFT'} /></div><div className="text-xs text-neutral-500 mt-2">{program._count.activities} نشاط · {program._count.enrollments} تسجيل · {program._count.submittedReports} تقرير</div></div>)}</div></section>
          <section className="rounded-2xl border border-neutral-200 bg-white p-5"><h2 className="font-bold flex items-center gap-2"><FolderKanban size={17} className="text-primary-600" /> المشاريع</h2><div className="space-y-3 mt-4">{data.projects.length ? data.projects.map(project => <div key={project.id} className="rounded-xl border p-4 flex items-center justify-between gap-3"><div><div className="font-bold">{project.title}</div><div className="text-xs text-neutral-500 mt-1">{dateLabel(project.startDate)} — {dateLabel(project.endDate)}</div></div><StatusBadge status={project.status} /></div>) : <p className="text-sm text-neutral-400 text-center py-10">لا توجد مشاريع مرتبطة</p>}</div></section>
          <Link href={`/${locale}/admin/platforms/${platform.slug}`} className="lg:col-span-2 btn-ghost no-underline text-center">فتح صفحة إدارة محتوى المنصة</Link>
        </div>
      )}

      {tab === 'reports' && (
        <div className="grid lg:grid-cols-2 gap-5">
          <section className="rounded-2xl border border-neutral-200 bg-white p-5"><div className="flex justify-between gap-3"><h2 className="font-bold flex items-center gap-2"><FileText size={17} className="text-primary-600" /> التقارير</h2><Link href={`/${locale}/admin/platforms-overview?year=${year}&month=${month}`} className="text-xs text-primary-700">إنشاء تقرير أداء المنصة</Link></div><div className="space-y-3 mt-4">{data.reports.map(report => <div key={report.id} className="rounded-xl border p-4 flex items-center justify-between gap-3"><div><div className="font-bold text-sm">{report.template.title}</div><div className="text-xs text-neutral-500 mt-1">{report.submittedBy || 'لم يحدد الرافع'} · {dateLabel(report.submittedAt || report.createdAt)}</div></div><StatusBadge status={report.status} /></div>)}</div></section>
          <section className="rounded-2xl border border-neutral-200 bg-white p-5"><h2 className="font-bold flex items-center gap-2"><FolderKanban size={17} className="text-primary-600" /> الوثائق</h2><div className="space-y-3 mt-4">{data.documents.length ? data.documents.map(document => <div key={document.id} className="rounded-xl border p-4 flex items-center justify-between gap-3"><div><div className="font-bold text-sm">{document.title}</div><div className="text-xs text-neutral-500 mt-1">{document.type} · {dateLabel(document.createdAt)}</div></div><StatusBadge status={document.status} /></div>) : <p className="text-sm text-neutral-400 text-center py-10">لا توجد وثائق</p>}</div></section>
        </div>
      )}

      {tab === 'governance' && (
        <div className="grid lg:grid-cols-2 gap-5">
          <section className="rounded-2xl border border-neutral-200 bg-white p-5"><h2 className="font-bold flex items-center gap-2"><ShieldCheck size={17} className="text-primary-600" /> التقييمات</h2><div className="space-y-3 mt-4">{data.evaluations.map(evaluation => <div key={evaluation.id} className="rounded-xl border p-4"><div className="flex justify-between gap-3"><div className="font-bold text-sm">{evaluation.title}</div><StatusBadge status={evaluation.status} /></div><div className="text-xs text-neutral-500 mt-2">{evaluation.score === null ? 'دون درجة' : `${Math.round(evaluation.score / evaluation.maxScore * 100)}%`} · {dateLabel(evaluation.evaluatedAt)}</div>{evaluation.recommendations && <p className="text-xs text-neutral-600 leading-5 mt-2">{evaluation.recommendations}</p>}</div>)}</div></section>
          <section className="rounded-2xl border border-neutral-200 bg-white p-5"><h2 className="font-bold flex items-center gap-2"><ClipboardCheck size={17} className="text-primary-600" /> المهام المفتوحة</h2><div className="space-y-3 mt-4">{data.tasks.length ? data.tasks.map(task => <div key={task.id} className="rounded-xl border p-4 flex items-center justify-between gap-3"><div><div className="font-bold text-sm">{task.title}</div><div className="text-xs text-neutral-500 mt-1">{task.assignee || 'غير مسند'} · الاستحقاق {dateLabel(task.dueDate)}</div></div><StatusBadge status={task.status} /></div>) : <p className="text-sm text-neutral-400 text-center py-10">لا توجد مهام مفتوحة</p>}</div></section>
        </div>
      )}

      {tab === 'alerts' && canManageSmartAlerts && (
        <section className="rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="flex items-center gap-2 font-bold text-neutral-900"><Sparkles size={18} className="text-primary-600" /> مساعد تنبيهات الأداء</h2>
              <p className="mt-1 max-w-2xl text-xs leading-5 text-neutral-500">يحدد النظام المستلمين من بيانات الأداء، ثم يحسّن الذكاء الاصطناعي صياغة الرسالة فقط. راجع الرسائل وحدد ما تريد إرساله.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button unstyled onClick={analyzeAlerts} disabled={analyzingAlerts} className="btn-ghost inline-flex items-center gap-2">
                <Sparkles size={15} className={analyzingAlerts ? 'animate-pulse' : ''} /> {analyzingAlerts ? 'جارٍ التحليل...' : 'تحليل واقتراح'}
              </Button>
              <Button unstyled onClick={sendAlerts} disabled={sendingAlerts || !selectedAlertIds.size} className="btn-primary inline-flex items-center gap-2">
                <Send size={15} /> {sendingAlerts ? 'جارٍ الإرسال...' : `إرسال المحدد (${selectedAlertIds.size})`}
              </Button>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs leading-5 text-blue-800">
            لا يصدر الذكاء الاصطناعي عقوبات أو تقييمات نهائية، ولا يرسل رسالة مكررة للمستلم نفسه خلال 7 أيام لنفس السبب والفترة.
          </div>

          <div className="mt-5 space-y-3">
            {alertProposals.length ? alertProposals.map(proposal => {
              const selected = selectedAlertIds.has(proposal.id)
              const tone = proposal.severity === 'CRITICAL' ? 'border-red-200 bg-red-50/60' : proposal.severity === 'WARNING' ? 'border-amber-200 bg-amber-50/60' : proposal.severity === 'SUCCESS' ? 'border-emerald-200 bg-emerald-50/60' : 'border-blue-200 bg-blue-50/60'
              return (
                <label key={proposal.id} className={`block cursor-pointer rounded-xl border p-4 ${tone}`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={event => setSelectedAlertIds(current => {
                        const next = new Set(current)
                        if (event.target.checked) next.add(proposal.id)
                        else next.delete(proposal.id)
                        return next
                      })}
                      className="mt-1 size-4 accent-primary-600"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="font-bold text-neutral-900">{proposal.title}</div>
                        <span className="rounded-full bg-white/80 px-2 py-1 text-[10px] font-semibold text-neutral-600">
                          {proposal.recipientType === 'MEMBER' ? 'عضو' : proposal.recipientType === 'PLATFORM_MANAGER' ? 'مدير منصة' : 'الإدارة'}: {proposal.recipientName}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-neutral-700">{proposal.body}</p>
                      <p className="mt-2 text-[10px] text-neutral-500">الدليل: {proposal.evidence}</p>
                    </div>
                  </div>
                </label>
              )
            }) : (
              <div className="py-14 text-center text-sm text-neutral-400">
                اضغط «تحليل واقتراح» لإنشاء رسائل قابلة للمراجعة قبل الإرسال.
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
