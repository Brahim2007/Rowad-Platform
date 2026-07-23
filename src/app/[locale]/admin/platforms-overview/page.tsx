'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  AlertTriangle, ArrowLeft, BarChart3, Blocks, CheckCircle, Clock, Gauge,
  Eye, Loader2, Search, Sparkles, Star, UserCheck, Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'

const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']

interface PlatformRow {
  platformId: string
  platformName: string
  platformSlug: string
  color: string | null
  memberCount: number
  activeMembers: number
  activeRate: number
  pendingCount: number
  stalePending: number
  totalApproved: number
  thisMonthApproved: number
  trend: number
  points: number
  pointsTrend: number
  healthScore: number
  healthStatus: 'HEALTHY' | 'WATCH' | 'CRITICAL'
  managedBy: string | null
  managedByEmail: string | null
  managerLastLoginAt: string | null
  managerStartedAt: string | null
  reports: { total: number; approved: number; pending: number }
  evaluation: { score: number | null; count: number }
  content: { programs: number; projects: number; documents: number }
  smartReport: {
    isDue: boolean
    current: { id: string; generatedAt: string } | null
    latest: { id: string; year: number; month: number | null; generatedAt: string } | null
  }
}

interface OverviewData {
  platforms: PlatformRow[]
  totals: {
    platforms: number; totalMembers: number; totalPending: number; totalApproved: number
    totalPoints: number; mostActive: string; mostAtRisk: number; withoutManager: number
    dueSmartReports: number; unassignedMembers: number; unscopedLogs: number
  }
  period: { year: number; month: number; previousYear: number; previousMonth: number }
}

function HealthBadge({ status, score }: { status: PlatformRow['healthStatus']; score: number }) {
  const style = status === 'HEALTHY'
    ? 'bg-green-50 text-green-700 border-green-200'
    : status === 'WATCH'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-red-50 text-red-700 border-red-200'
  const label = status === 'HEALTHY' ? 'مستقرة' : status === 'WATCH' ? 'تحت المتابعة' : 'حرجة'
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold ${style}`}>{label} · {score}</span>
}

export default function PlatformsOverviewPage() {
  const params = useParams<{ locale: string }>()
  const now = new Date()
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [search, setSearch] = useState('')
  const [healthFilter, setHealthFilter] = useState('')
  const [reportPlatform, setReportPlatform] = useState<PlatformRow | null>(null)
  const [generatingReport, setGeneratingReport] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/platforms-overview?year=${year}&month=${month}`, { cache: 'no-store' })
      const result = await response.json()
      if (result.success) setData(result.data)
    } finally {
      setLoading(false)
    }
  }, [year, month])

  useEffect(() => { load() }, [load])

  const generateMonthlyReport = async () => {
    if (!reportPlatform) return
    setGeneratingReport(true)
    try {
      const response = await fetch('/api/admin/ai/impact-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodType: 'monthly',
          year,
          month,
          platformId: reportPlatform.platformId,
          networkRole: '',
        }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) {
        if (result.existingReportId) {
          window.open(`/${params.locale || 'ar'}/admin/impact/ai-reports/${result.existingReportId}`, '_blank', 'noopener,noreferrer')
        }
        throw new Error(result.message || 'تعذر إنشاء التقرير الذكي')
      }

      toast.success(`تم إنشاء تقرير ${reportPlatform.platformName} وحفظه`)
      setReportPlatform(null)
      await load()
      window.open(`/${params.locale || 'ar'}/admin/impact/ai-reports/${result.data.id}`, '_blank', 'noopener,noreferrer')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'تعذر إنشاء التقرير الذكي')
    } finally {
      setGeneratingReport(false)
    }
  }

  const visiblePlatforms = useMemo(() => {
    if (!data) return []
    const query = search.trim().toLocaleLowerCase('ar')
    return data.platforms.filter(platform => {
      const matchesSearch = !query || [platform.platformName, platform.managedBy, platform.managedByEmail].some(value => String(value || '').toLocaleLowerCase('ar').includes(query))
      const matchesHealth = !healthFilter || platform.healthStatus === healthFilter || (healthFilter === 'NO_MANAGER' && !platform.managedBy)
      return matchesSearch && matchesHealth
    })
  }, [data, healthFilter, search])

  if (loading && !data) return <div className="flex items-center justify-center py-24"><div className="w-9 h-9 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin" /></div>
  if (!data) return <div className="p-8 text-center text-neutral-400">لا توجد بيانات</div>

  const { totals } = data
  const locale = params.locale || 'ar'
  const summaryCards: Array<{ icon: LucideIcon; label: string; value: number; color: string }> = [
    { icon: Blocks, label: 'المنصات', value: totals.platforms, color: 'bg-primary-50 text-primary-700' },
    { icon: Users, label: 'الأعضاء', value: totals.totalMembers, color: 'bg-teal-50 text-teal-700' },
    { icon: Star, label: 'نقاط الفترة', value: totals.totalPoints, color: 'bg-amber-50 text-amber-700' },
    { icon: Clock, label: 'بانتظار الاعتماد', value: totals.totalPending, color: 'bg-orange-50 text-orange-700' },
    { icon: CheckCircle, label: 'إجمالي المعتمدة', value: totals.totalApproved, color: 'bg-green-50 text-green-700' },
    { icon: AlertTriangle, label: 'منصات حرجة', value: totals.mostAtRisk, color: 'bg-red-50 text-red-700' },
    { icon: UserCheck, label: 'دون مدير', value: totals.withoutManager, color: 'bg-purple-50 text-purple-700' },
    { icon: Sparkles, label: 'تقارير مستحقة', value: totals.dueSmartReports, color: 'bg-violet-50 text-violet-700' },
  ]

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <section className="rounded-3xl bg-gradient-to-l from-primary-900 via-primary-700 to-indigo-700 text-white p-5 md:p-7">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs mb-3"><BarChart3 size={14} /> مركز الرقابة والتشغيل</div>
            <h1 className="text-2xl md:text-3xl font-black">متابعة المنصات</h1>
            <p className="text-sm text-white/70 mt-2 max-w-2xl">قارن صحة المنصات، أداء مدرائها، نشاط أعضائها، التزام التقارير وجودة التنفيذ من نقطة واحدة.</p>
          </div>
          <div className="rounded-2xl bg-white/10 border border-white/15 px-5 py-4 min-w-[230px]">
            <div className="text-xs text-white/60">المنصة الأعلى أثرًا</div>
            <div className="font-bold mt-1">{totals.mostActive}</div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        {summaryCards.map(item => (
          <div key={item.label} className="rounded-2xl border border-neutral-200 bg-white p-4">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.color}`}><item.icon size={17} /></div>
            <div className="text-xl font-black text-neutral-900 mt-3">{item.value.toLocaleString('ar-SA')}</div>
            <div className="text-xs text-neutral-500">{item.label}</div>
          </div>
        ))}
      </div>

      {(totals.unassignedMembers > 0 || totals.unscopedLogs > 0) && (
        <div className="flex flex-col gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0" />
            <div>
              <p className="font-bold">توجد بيانات تحتاج إلى ربط بمنصة</p>
              <p className="mt-1 text-xs text-amber-700">
                أعضاء نشطون دون منصة: {totals.unassignedMembers} — سجلات أثر دون منصة: {totals.unscopedLogs}.
                لا تُنسب هذه البيانات تلقائيًا حتى لا تختلط نتائج المنصات.
              </p>
            </div>
          </div>
          <Link href={`/${locale}/admin/members`} className="shrink-0 font-bold text-amber-900 underline underline-offset-4">
            مراجعة الأعضاء
          </Link>
        </div>
      )}

      <section className="rounded-2xl border border-neutral-200 bg-white p-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-[minmax(260px,1fr)_150px_100px_140px_auto] gap-3 items-end">
          <label className="space-y-1.5"><span className="text-xs font-semibold text-neutral-600">البحث</span><div className="relative"><Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" /><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="اسم المنصة أو المدير" className="pe-9" /></div></label>
          <label className="space-y-1.5"><span className="text-xs font-semibold text-neutral-600">الحالة</span><NativeSelect value={healthFilter} onChange={event => setHealthFilter(event.target.value)} wrapperClassName="w-full"><option value="">كل الحالات</option><option value="HEALTHY">مستقرة</option><option value="WATCH">تحت المتابعة</option><option value="CRITICAL">حرجة</option><option value="NO_MANAGER">دون مدير</option></NativeSelect></label>
          <label className="space-y-1.5"><span className="text-xs font-semibold text-neutral-600">السنة</span><Input type="number" value={year} onChange={event => setYear(Number(event.target.value))} /></label>
          <label className="space-y-1.5"><span className="text-xs font-semibold text-neutral-600">الشهر</span><NativeSelect value={month} onChange={event => setMonth(Number(event.target.value))} wrapperClassName="w-full">{MONTHS.map((label, index) => <option key={label} value={index + 1}>{label}</option>)}</NativeSelect></label>
          <Button unstyled onClick={load} className="btn-primary h-10 px-4">تحديث</Button>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between gap-3">
          <div><h2 className="font-bold text-neutral-900 flex items-center gap-2"><Gauge size={17} className="text-primary-600" /> أداء المنصات</h2><p className="text-xs text-neutral-500 mt-1">{visiblePlatforms.length} منصات ضمن المرشحات</p></div>
          {loading && <div className="w-5 h-5 border-2 border-primary-100 border-t-primary-600 rounded-full animate-spin" />}
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead className="text-right">المنصة</TableHead><TableHead className="text-right">المدير</TableHead><TableHead className="text-center">الصحة</TableHead><TableHead className="text-center">الأعضاء</TableHead><TableHead className="text-center">المشاركة</TableHead><TableHead className="text-center">النقاط</TableHead><TableHead className="text-center">الأنشطة</TableHead><TableHead className="text-center">المعلق</TableHead><TableHead className="text-center">التقرير الذكي</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>
              {visiblePlatforms.map(platform => (
                <TableRow key={platform.platformId} className={platform.healthStatus === 'CRITICAL' ? 'bg-red-50/30' : ''}>
                  <TableCell><div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: platform.color || '#527F47' }} /><div><div className="font-bold">{platform.platformName}</div><div className="text-[10px] text-neutral-400">{platform.content.programs} برامج · {platform.content.documents} وثائق</div></div></div></TableCell>
                  <TableCell>{platform.managedBy ? <div><div className="text-sm font-semibold">{platform.managedBy}</div><div className="text-[10px] text-neutral-400">{platform.managerLastLoginAt ? `آخر دخول ${new Date(platform.managerLastLoginAt).toLocaleDateString('ar-SA')}` : 'لم يسجل الدخول'}</div></div> : <span className="text-xs text-red-600 font-semibold">غير معيّن</span>}</TableCell>
                  <TableCell className="text-center"><HealthBadge status={platform.healthStatus} score={platform.healthScore} /></TableCell>
                  <TableCell className="text-center">{platform.memberCount}</TableCell>
                  <TableCell className="text-center"><div className="font-bold">{platform.activeRate}%</div><div className="text-[10px] text-neutral-400">{platform.activeMembers} نشط</div></TableCell>
                  <TableCell className="text-center"><div className="font-bold text-primary-700">{platform.points.toLocaleString('ar-SA')}</div><div className={`text-[10px] ${platform.pointsTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>{platform.pointsTrend > 0 ? '+' : ''}{platform.pointsTrend}%</div></TableCell>
                  <TableCell className="text-center"><div className="font-bold">{platform.thisMonthApproved}</div><div className={`text-[10px] ${platform.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>{platform.trend > 0 ? '+' : ''}{platform.trend}%</div></TableCell>
                  <TableCell className="text-center"><div className={platform.pendingCount ? 'text-amber-700 font-bold' : 'text-neutral-400'}>{platform.pendingCount}</div>{platform.stalePending > 0 && <div className="text-[10px] text-red-600">{platform.stalePending} متأخر</div>}</TableCell>
                  <TableCell className="text-center">
                    {platform.smartReport.current ? (
                      <Link href={`/${locale}/admin/impact/ai-reports/${platform.smartReport.current.id}`} className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[11px] font-bold text-emerald-700 no-underline">
                        <Eye size={13} /> عرض التقرير
                      </Link>
                    ) : (
                      <Button unstyled onClick={() => setReportPlatform(platform)} className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-violet-700">
                        <Sparkles size={13} /> توليد التقرير
                      </Button>
                    )}
                    <div className="mt-1 text-[9px] text-neutral-400">
                      {platform.smartReport.current
                        ? new Date(platform.smartReport.current.generatedAt).toLocaleDateString('ar-SA')
                        : platform.smartReport.latest
                          ? `آخر تقرير ${MONTHS[(platform.smartReport.latest.month || 1) - 1]}`
                          : 'لم يُنشأ سابقًا'}
                    </div>
                  </TableCell>
                  <TableCell><Link href={`/${locale}/admin/platforms-overview/${platform.platformSlug}`} className="inline-flex items-center gap-1 text-xs font-bold text-primary-700 no-underline">غرفة المتابعة <ArrowLeft size={12} /></Link></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <Dialog open={Boolean(reportPlatform)} onOpenChange={open => !open && !generatingReport && setReportPlatform(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="text-violet-600" size={20} />
              إنشاء التقرير الذكي الشهري
            </DialogTitle>
            <DialogDescription>
              سيتم تحليل بيانات منصة {reportPlatform?.platformName} عن شهر {MONTHS[month - 1]} {year}.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            <div className="mb-2 flex items-center gap-2 font-bold"><AlertTriangle size={17} /> سياسة تقارير المنصات</div>
            <ul className="list-disc space-y-2 pe-5 text-xs leading-6 text-amber-800">
              <li>يُسمح بتقرير ذكي واحد فقط لكل منصة خلال كل شهر تقويمي.</li>
              <li>بعد الإنشاء لا يمكن توليد تقرير بديل للشهر نفسه، ويمكن فتح التقرير المحفوظ في أي وقت.</li>
              <li>سيتم إشعار مدير المنصة تلقائيًا ليطّلع على التقرير من لوحة منصته.</li>
              <li>يستهلك الإنشاء من الميزانية الشهرية للذكاء الاصطناعي.</li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={generatingReport} onClick={() => setReportPlatform(null)}>إلغاء</Button>
            <Button disabled={generatingReport} onClick={generateMonthlyReport} className="gap-2 bg-violet-600 hover:bg-violet-700">
              {generatingReport ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {generatingReport ? 'جاري إنشاء التقرير...' : 'أوافق، أنشئ التقرير'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
