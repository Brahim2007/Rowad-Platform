'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { NativeSelect } from '@/components/ui/native-select'
import Link from 'next/link'

import { useCallback, useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import {
  Activity, Award, BarChart3, CheckCircle, Clock, Database,
  Pencil, Percent, Plus, Target, Trash2, TrendingUp, X,
  Building2, ExternalLink, Users, AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'

interface Indicator {
  id: string
  indicatorKey: string
  indicatorName: string
  value: number
  target: number | null
  unit: string | null
  period: string
  recordedAt: string
  platformId?: string
  programId?: string
  platform?: { name: string; slug: string }
  program?: { name: string; slug: string }
}

interface Snapshot {
  id: string
  title: string
  period: string
  periodStart: string
  periodEnd: string
  summary: string | null
  generatedBy: string | null
  createdAt: string
}

interface PlatformOption {
  id: string
  name: string
  programs?: ProgramOption[]
}

interface ProgramOption {
  id: string
  name: string
  platformId?: string
}

interface PlatformPerformance {
  platformId: string
  platformName: string
  platformSlug: string
  memberCount: number
  activeRate: number
  pendingCount: number
  points: number
  pointsTrend: number
  healthScore: number
  healthStatus: 'HEALTHY' | 'WATCH' | 'CRITICAL'
  managedBy: string | null
  evaluation: { score: number | null; count: number }
}

interface LiveOverview {
  platforms: PlatformPerformance[]
  totals: {
    platforms: number
    totalMembers: number
    totalPending: number
    totalPoints: number
    mostAtRisk: number
    withoutManager: number
  }
}

const PERIOD_LABELS: Record<string, string> = {
  daily: 'يومي',
  weekly: 'أسبوعي',
  monthly: 'شهري',
  quarterly: 'ربعي',
  yearly: 'سنوي',
}

const INDICATOR_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  active_beneficiaries: { label: 'أعضاء نشطون', color: 'bg-primary-100 text-primary-600', icon: Activity },
  volunteer_hours: { label: 'ساعات تطوع', color: 'bg-secondary-100 text-secondary-600', icon: Clock },
  volunteer_hours_monthly: { label: 'ساعات تطوع شهرية', color: 'bg-secondary-100 text-secondary-700', icon: Clock },
  activity_level: { label: 'مستوى النشاط', color: 'bg-success-50 text-success-600', icon: TrendingUp },
  completion_rate: { label: 'معدل الإنجاز', color: 'bg-info-50 text-info-600', icon: CheckCircle },
  satisfaction_score: { label: 'معدل الرضا', color: 'bg-secondary-100 text-secondary-600', icon: Award },
  beneficiary_retention: { label: 'الاحتفاظ بالأعضاء', color: 'bg-primary-100 text-primary-700', icon: Target },
  engagement_rate: { label: 'معدل المشاركة', color: 'bg-success-50 text-success-700', icon: Activity },
  programs_completed: { label: 'برامج مكتملة', color: 'bg-info-50 text-info-700', icon: Award },
  avg_score: { label: 'متوسط التقييم', color: 'bg-primary-100 text-primary-700', icon: Award },
}

const emptyIndicator = {
  type: 'platform',
  targetId: '',
  indicatorKey: 'active_beneficiaries',
  indicatorName: 'أعضاء نشطون',
  value: '0',
  target: '',
  unit: '',
  period: 'monthly',
  recordedAt: new Date().toISOString().slice(0, 10),
}

const emptySnapshot = {
  title: '',
  period: 'monthly',
  periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
  periodEnd: new Date().toISOString().slice(0, 10),
  summary: '',
  generatedBy: 'الإدارة',
}

function Badge({ children, className }: { children: ReactNode; className: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {children}
    </span>
  )
}

function progressPct(value: number, target: number | null) {
  if (!target || target === 0) return 100
  return Math.min(Math.round((value / target) * 100), 100)
}

function periodLabel(value: string) {
  return PERIOD_LABELS[value] || value
}

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString('ar')
}

export default function AdminAnalyticsPage() {
  const [platformIndicators, setPlatformIndicators] = useState<Indicator[]>([])
  const [programIndicators, setProgramIndicators] = useState<Indicator[]>([])
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [platforms, setPlatforms] = useState<PlatformOption[]>([])
  const [liveOverview, setLiveOverview] = useState<LiveOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [showIndicatorModal, setShowIndicatorModal] = useState(false)
  const [editingIndicator, setEditingIndicator] = useState<Indicator | null>(null)
  const [indicatorForm, setIndicatorForm] = useState(emptyIndicator)
  const [showSnapshotModal, setShowSnapshotModal] = useState(false)
  const [snapshotForm, setSnapshotForm] = useState(emptySnapshot)
  const [submitting, setSubmitting] = useState(false)

  const programs = platforms.flatMap(platform => (platform.programs || []).map(program => ({ ...program, platformId: platform.id })))

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [piRes, prgiRes, snapRes, platformsRes, overviewRes] = await Promise.all([
        fetch('/api/admin/analytics/indicators?type=platform').then(r => r.json()),
        fetch('/api/admin/analytics/indicators?type=program').then(r => r.json()),
        fetch('/api/admin/analytics/snapshots').then(r => r.json()),
        fetch('/api/admin/platforms').then(r => r.json()),
        fetch('/api/admin/platforms-overview').then(r => r.json()),
      ])
      if (piRes.success) setPlatformIndicators(piRes.data || [])
      if (prgiRes.success) setProgramIndicators(prgiRes.data || [])
      if (snapRes.success) setSnapshots(snapRes.data || [])
      if (platformsRes.success) setPlatforms(platformsRes.data?.platforms || [])
      if (overviewRes.success) setLiveOverview(overviewRes.data)
    } catch {
      toast.error('فشل تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const openCreateIndicator = (type: 'platform' | 'program') => {
    setEditingIndicator(null)
    setIndicatorForm({
      ...emptyIndicator,
      type,
      targetId: type === 'platform' ? platforms[0]?.id || '' : programs[0]?.id || '',
    })
    setShowIndicatorModal(true)
  }

  const openEditIndicator = (indicator: Indicator, type: 'platform' | 'program') => {
    setEditingIndicator(indicator)
    setIndicatorForm({
      type,
      targetId: type === 'platform' ? indicator.platformId || '' : indicator.programId || '',
      indicatorKey: indicator.indicatorKey,
      indicatorName: indicator.indicatorName,
      value: String(indicator.value),
      target: indicator.target === null ? '' : String(indicator.target),
      unit: indicator.unit || '',
      period: indicator.period,
      recordedAt: new Date(indicator.recordedAt).toISOString().slice(0, 10),
    })
    setShowIndicatorModal(true)
  }

  const handleIndicatorSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      const type = indicatorForm.type as 'platform' | 'program'
      const body = {
        id: editingIndicator?.id,
        type,
        platformId: type === 'platform' ? indicatorForm.targetId : undefined,
        programId: type === 'program' ? indicatorForm.targetId : undefined,
        indicatorKey: indicatorForm.indicatorKey,
        indicatorName: indicatorForm.indicatorName,
        value: Number(indicatorForm.value || 0),
        target: indicatorForm.target,
        unit: indicatorForm.unit,
        period: indicatorForm.period,
        recordedAt: indicatorForm.recordedAt,
      }
      const res = await fetch('/api/admin/analytics/indicators', {
        method: editingIndicator ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(editingIndicator ? 'تم تحديث المؤشر' : 'تم إنشاء المؤشر')
        setShowIndicatorModal(false)
        await fetchData()
      } else {
        toast.error(data.message || 'فشل الحفظ')
      }
    } catch {
      toast.error('فشل الحفظ')
    } finally {
      setSubmitting(false)
    }
  }

  const deleteIndicator = async (indicator: Indicator, type: 'platform' | 'program') => {
    if (!confirm('هل تريد حذف هذا المؤشر؟')) return
    try {
      const res = await fetch(`/api/admin/analytics/indicators?id=${indicator.id}&type=${type}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('تم حذف المؤشر')
        await fetchData()
      } else {
        toast.error(data.message || 'فشل الحذف')
      }
    } catch {
      toast.error('فشل الحذف')
    }
  }

  const handleSnapshotSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/analytics/snapshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snapshotForm),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('تم إنشاء اللقطة التحليلية')
        setShowSnapshotModal(false)
        setSnapshotForm(emptySnapshot)
        await fetchData()
      } else {
        toast.error(data.message || 'فشل الحفظ')
      }
    } catch {
      toast.error('فشل الحفظ')
    } finally {
      setSubmitting(false)
    }
  }

  const deleteSnapshot = async (id: string) => {
    if (!confirm('هل تريد حذف هذه اللقطة؟')) return
    try {
      const res = await fetch(`/api/admin/analytics/snapshots?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('تم حذف اللقطة')
        await fetchData()
      } else {
        toast.error(data.message || 'فشل الحذف')
      }
    } catch {
      toast.error('فشل الحذف')
    }
  }

  const totalPlatformIndicators = platformIndicators.length
  const totalProgramIndicators = programIndicators.length
  const totalSnapshots = snapshots.length
  const metTargetCount = platformIndicators.filter(indicator => indicator.target && indicator.value >= indicator.target).length
  const rankedPlatforms = [...(liveOverview?.platforms || [])].sort((a, b) => b.healthScore - a.healthScore)

  const renderIndicatorCard = (indicator: Indicator, type: 'platform' | 'program') => {
    const pct = progressPct(indicator.value, indicator.target)
    const barColor = pct >= 100 ? 'bg-success-500' : pct >= 70 ? 'bg-primary-500' : pct >= 40 ? 'bg-warning-500' : 'bg-error-400'
    const config = INDICATOR_CONFIG[indicator.indicatorKey]
    const Icon = config?.icon || Activity

    return (
      <div key={`${type}-${indicator.id}`} className="card group">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${config?.color || 'bg-neutral-100 text-neutral-500'}`}>
              <Icon size={16} />
            </div>
            <div>
              <div className="text-sm font-medium text-neutral-900">{indicator.indicatorName}</div>
              <div className="text-[10px] text-neutral-400">{indicator.platform?.name || indicator.program?.name || 'عام'}</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Badge className="bg-neutral-100 text-neutral-500">{periodLabel(indicator.period)}</Badge>
            <Button unstyled onClick={() => openEditIndicator(indicator, type)} className="p-1 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg" title="تعديل">
              <Pencil size={13} />
            </Button>
            <Button unstyled onClick={() => deleteIndicator(indicator, type)} className="p-1 text-neutral-400 hover:text-error-600 hover:bg-error-50 rounded-lg" title="حذف">
              <Trash2 size={13} />
            </Button>
          </div>
        </div>

        <div className="text-2xl font-bold text-neutral-900 mb-1">
          {indicator.value}{indicator.unit && <span className="text-sm font-normal text-neutral-400 mr-1">{indicator.unit}</span>}
        </div>
        <div className="text-[10px] text-neutral-400 mb-2">آخر تسجيل: {dateLabel(indicator.recordedAt)}</div>

        {indicator.target && (
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-neutral-500">
              <span>الهدف: {indicator.target}{indicator.unit || ''}</span>
              <span>{pct}%</span>
            </div>
            <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
          <p className="mt-3 text-sm text-neutral-400">جاري تحميل التحليلات...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
      <section className="mb-5 overflow-hidden rounded-3xl bg-gradient-to-l from-primary-800 to-primary-600 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold">
              <TrendingUp size={15} /> التحليلات والمؤشرات
            </div>
            <h1 className="text-2xl font-black md:text-3xl">مركز التحليلات القيادية</h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-primary-50">
            قراءة موحدة لصحة كل منصة ونشاط أعضائها والتراكمات والتقييمات، مع مؤشرات مستهدفة ولقطات دورية.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button unstyled onClick={() => openCreateIndicator('platform')} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-white/10 px-4 text-sm font-bold text-white hover:bg-white/20">
              <Plus size={15} /> مؤشر منصة
            </Button>
            <Button unstyled onClick={() => openCreateIndicator('program')} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-white/10 px-4 text-sm font-bold text-white hover:bg-white/20">
              <Plus size={15} /> مؤشر برنامج
            </Button>
            <Button unstyled onClick={() => setShowSnapshotModal(true)} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-white px-4 text-sm font-black text-primary-800 shadow-sm">
              <Database size={15} /> لقطة تحليلية
            </Button>
          </div>
        </div>
      </section>

      {liveOverview && (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6 lg:grid-cols-4">
            {[
              { label: 'منصات تحت المتابعة', value: liveOverview.totals.platforms, icon: Building2, color: 'bg-primary-100 text-primary-700' },
              { label: 'إجمالي الأعضاء', value: liveOverview.totals.totalMembers, icon: Users, color: 'bg-info-50 text-info-700' },
              { label: 'سجلات تنتظر المراجعة', value: liveOverview.totals.totalPending, icon: Clock, color: 'bg-warning-50 text-warning-700' },
              { label: 'منصات حرجة', value: liveOverview.totals.mostAtRisk, icon: AlertTriangle, color: 'bg-error-50 text-error-700' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="card flex items-center gap-3 p-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}><Icon size={19} /></div>
                <div><div className="text-xl font-black text-neutral-900">{value}</div><div className="text-xs text-neutral-500">{label}</div></div>
              </div>
            ))}
          </div>

          <section className="card mb-8 overflow-hidden p-0">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 p-5">
              <div>
                <h2 className="font-bold text-neutral-900">ترتيب صحة المنصات</h2>
                <p className="mt-1 text-xs text-neutral-500">بيانات حية تجمع الإدارة والنشاط والتراكم والتقييم، وليست إدخالات يدوية.</p>
              </div>
              <Link href="/ar/admin/platforms-overview" className="btn-ghost btn-xs inline-flex items-center gap-1">
                مركز متابعة المنصات <ExternalLink size={13} />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-neutral-50 text-xs text-neutral-500">
                  <tr>
                    <th className="p-3 text-start">المنصة / المدير</th>
                    <th className="p-3 text-start">الصحة</th>
                    <th className="p-3 text-start">الأعضاء النشطون</th>
                    <th className="p-3 text-start">نقاط الفترة</th>
                    <th className="p-3 text-start">قيد المراجعة</th>
                    <th className="p-3 text-start">التقييم</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {rankedPlatforms.map(platform => (
                    <tr key={platform.platformId} className="hover:bg-neutral-50/70">
                      <td className="p-3"><div className="font-bold text-neutral-900">{platform.platformName}</div><div className="text-[11px] text-neutral-400">{platform.managedBy || 'لم يعيّن مدير'}</div></td>
                      <td className="p-3"><Badge className={platform.healthStatus === 'HEALTHY' ? 'bg-success-50 text-success-700' : platform.healthStatus === 'WATCH' ? 'bg-warning-50 text-warning-700' : 'bg-error-50 text-error-700'}>{platform.healthScore}%</Badge></td>
                      <td className="p-3 font-semibold">{platform.activeRate}% <span className="font-normal text-neutral-400">من {platform.memberCount}</span></td>
                      <td className="p-3 font-semibold">{platform.points.toLocaleString('ar')} <span className={platform.pointsTrend >= 0 ? 'text-success-600' : 'text-error-600'}>{platform.pointsTrend >= 0 ? '+' : ''}{platform.pointsTrend}%</span></td>
                      <td className="p-3">{platform.pendingCount}</td>
                      <td className="p-3">{platform.evaluation.score === null ? '—' : `${platform.evaluation.score}%`}</td>
                      <td className="p-3"><Link href={`/ar/admin/platforms-overview/${platform.platformSlug}`} className="text-primary-700 hover:underline">التفاصيل</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'مؤشرات المنصات', value: totalPlatformIndicators, icon: BarChart3, color: 'bg-primary-100 text-primary-600' },
          { label: 'مؤشرات البرامج', value: totalProgramIndicators, icon: Target, color: 'bg-secondary-100 text-secondary-600' },
          { label: 'لقطات تحليلية', value: totalSnapshots, icon: Database, color: 'bg-info-50 text-info-500' },
          { label: 'مؤشرات محققة', value: totalPlatformIndicators > 0 ? `${metTargetCount}/${totalPlatformIndicators}` : 0, icon: Percent, color: 'bg-success-50 text-success-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card flex items-center gap-3 p-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}><Icon size={18} /></div>
            <div><div className="text-lg font-bold text-neutral-900">{value}</div><div className="text-xs text-neutral-500">{label}</div></div>
          </div>
        ))}
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
          <BarChart3 className="text-primary-600" size={20} />
          مؤشرات المنصات
          <span className="text-xs font-normal text-neutral-400">({totalPlatformIndicators} مؤشر)</span>
        </h2>
        {totalPlatformIndicators === 0 ? (
          <div className="card text-center py-10 text-neutral-400">
            <BarChart3 size={32} className="mx-auto mb-2 text-neutral-300" />
            <p className="text-sm">لا توجد مؤشرات منصات</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {platformIndicators.map(indicator => renderIndicatorCard(indicator, 'platform'))}
          </div>
        )}
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
          <Award className="text-secondary-600" size={20} />
          مؤشرات البرامج
          <span className="text-xs font-normal text-neutral-400">({totalProgramIndicators} مؤشر)</span>
        </h2>
        {totalProgramIndicators === 0 ? (
          <div className="card text-center py-10 text-neutral-400">
            <Award size={32} className="mx-auto mb-2 text-neutral-300" />
            <p className="text-sm">لا توجد مؤشرات برامج</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {programIndicators.map(indicator => renderIndicatorCard(indicator, 'program'))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
          <Database className="text-info-500" size={20} />
          لقطات تحليلية دورية
          <span className="text-xs font-normal text-neutral-400">({totalSnapshots} لقطة)</span>
        </h2>
        <div className="card overflow-hidden p-0">
          {totalSnapshots === 0 ? (
            <div className="py-10 text-center text-neutral-400">
              <Database size={32} className="mx-auto mb-2 text-neutral-300" />
              <p className="text-sm">لا توجد لقطات تحليلية</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {snapshots.map(snapshot => (
                <div key={snapshot.id} className="p-5 hover:bg-neutral-50 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="font-semibold text-neutral-900 text-sm">{snapshot.title}</h3>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {dateLabel(snapshot.periodStart)} - {dateLabel(snapshot.periodEnd)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-primary-50 text-primary-600">{periodLabel(snapshot.period)}</Badge>
                      <Button unstyled onClick={() => deleteSnapshot(snapshot.id)} className="p-1.5 text-neutral-400 hover:text-error-600 hover:bg-error-50 rounded-lg" title="حذف">
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                  {snapshot.summary && <p className="text-xs text-neutral-600 mt-2 leading-relaxed">{snapshot.summary}</p>}
                  {snapshot.generatedBy && <p className="text-[10px] text-neutral-400 mt-2">أنشئت بواسطة: {snapshot.generatedBy}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showIndicatorModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
            <div className="flex items-center justify-between p-5 border-b border-neutral-200">
              <h2 className="text-lg font-bold text-neutral-900">{editingIndicator ? 'تعديل مؤشر' : 'مؤشر جديد'}</h2>
              <Button unstyled onClick={() => setShowIndicatorModal(false)} className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100">
                <X size={18} />
              </Button>
            </div>
            <form onSubmit={handleIndicatorSubmit} className="p-5 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">نوع المؤشر</label>
                  <NativeSelect value={indicatorForm.type} onChange={e => setIndicatorForm({ ...indicatorForm, type: e.target.value, targetId: '' })} className="input-field" disabled={!!editingIndicator}>
                    <option value="platform">منصة</option>
                    <option value="program">برنامج</option>
                  </NativeSelect>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">العنصر</label>
                  <NativeSelect required value={indicatorForm.targetId} onChange={e => setIndicatorForm({ ...indicatorForm, targetId: e.target.value })} className="input-field" disabled={!!editingIndicator}>
                    <option value="">اختر...</option>
                    {indicatorForm.type === 'platform' && platforms.map(platform => <option key={platform.id} value={platform.id}>{platform.name}</option>)}
                    {indicatorForm.type === 'program' && programs.map(program => <option key={program.id} value={program.id}>{program.name}</option>)}
                  </NativeSelect>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">مفتاح المؤشر</label>
                  <Input required dir="ltr" value={indicatorForm.indicatorKey} onChange={e => setIndicatorForm({ ...indicatorForm, indicatorKey: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">اسم المؤشر</label>
                  <Input required value={indicatorForm.indicatorName} onChange={e => setIndicatorForm({ ...indicatorForm, indicatorName: e.target.value })} className="input-field" />
                </div>
              </div>
              <div className="grid sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">القيمة</label>
                  <Input required type="number" step="0.01" value={indicatorForm.value} onChange={e => setIndicatorForm({ ...indicatorForm, value: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">الهدف</label>
                  <Input type="number" step="0.01" value={indicatorForm.target} onChange={e => setIndicatorForm({ ...indicatorForm, target: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">الوحدة</label>
                  <Input value={indicatorForm.unit} onChange={e => setIndicatorForm({ ...indicatorForm, unit: e.target.value })} className="input-field" placeholder="ساعة، %، /5" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">الفترة</label>
                  <NativeSelect value={indicatorForm.period} onChange={e => setIndicatorForm({ ...indicatorForm, period: e.target.value })} className="input-field">
                    {Object.entries(PERIOD_LABELS).map(([key, value]) => <option key={key} value={key}>{value}</option>)}
                  </NativeSelect>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">تاريخ التسجيل</label>
                <Input type="date" value={indicatorForm.recordedAt} onChange={e => setIndicatorForm({ ...indicatorForm, recordedAt: e.target.value })} className="input-field" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
                <Button unstyled type="button" onClick={() => setShowIndicatorModal(false)} className="btn-ghost btn-sm">إلغاء</Button>
                <Button unstyled type="submit" disabled={submitting} className="btn-primary btn-sm">{submitting ? 'جاري الحفظ...' : 'حفظ'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSnapshotModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl">
            <div className="flex items-center justify-between p-5 border-b border-neutral-200">
              <h2 className="text-lg font-bold text-neutral-900">لقطة تحليلية جديدة</h2>
              <Button unstyled onClick={() => setShowSnapshotModal(false)} className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100">
                <X size={18} />
              </Button>
            </div>
            <form onSubmit={handleSnapshotSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">العنوان</label>
                <Input required value={snapshotForm.title} onChange={e => setSnapshotForm({ ...snapshotForm, title: e.target.value })} className="input-field" />
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">الفترة</label>
                  <NativeSelect value={snapshotForm.period} onChange={e => setSnapshotForm({ ...snapshotForm, period: e.target.value })} className="input-field">
                    {Object.entries(PERIOD_LABELS).map(([key, value]) => <option key={key} value={key}>{value}</option>)}
                  </NativeSelect>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">البداية</label>
                  <Input type="date" value={snapshotForm.periodStart} onChange={e => setSnapshotForm({ ...snapshotForm, periodStart: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">النهاية</label>
                  <Input type="date" value={snapshotForm.periodEnd} onChange={e => setSnapshotForm({ ...snapshotForm, periodEnd: e.target.value })} className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">الملخص</label>
                <Textarea rows={3} value={snapshotForm.summary} onChange={e => setSnapshotForm({ ...snapshotForm, summary: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">أنشئت بواسطة</label>
                <Input value={snapshotForm.generatedBy} onChange={e => setSnapshotForm({ ...snapshotForm, generatedBy: e.target.value })} className="input-field" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
                <Button unstyled type="button" onClick={() => setShowSnapshotModal(false)} className="btn-ghost btn-sm">إلغاء</Button>
                <Button unstyled type="submit" disabled={submitting} className="btn-primary btn-sm">{submitting ? 'جاري الحفظ...' : 'إنشاء'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
