'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Activity, Archive, ArrowRight, CheckCircle2, Copy, Download, ExternalLink, FileText, Link2, Loader2, MessageCircle, Printer, RefreshCw, Sparkles, Users, ChevronDown, Info } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { SmartImpactReportDocument } from '@/components/admin/SmartImpactReportDocument'
import { exportElementToPdf, exportElementToWord, printElement } from '@/lib/report-export'
import type { ImpactReportMetrics, SmartImpactReport } from '@/lib/ai/impact-report'

interface SavedSmartReport {
  id: string
  report: SmartImpactReport
  metrics: ImpactReportMetrics
  generatedAt: string
  reportScope: 'NETWORK' | 'PLATFORM'
}

function safeFileName(title: string) {
  return title.replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, '-').slice(0, 100) || 'تقرير-أثر-ذكي'
}

export default function SmartImpactReportPage() {
  const params = useParams<{ locale: string; id: string }>()
  const reportRef = useRef<HTMLDivElement>(null)
  const [data, setData] = useState<SavedSmartReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState<'pdf' | 'word' | null>(null)
  const [toolbarOpen, setToolbarOpen] = useState(false)

  const loadReport = useCallback(async () => {
    if (!params.id) return
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/ai/impact-report/${params.id}`, { cache: 'no-store' })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.message || 'تعذر تحميل التقرير')
      setData(result.data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'تعذر تحميل التقرير')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => { loadReport() }, [loadReport])

  const handlePdf = async () => {
    if (!data || !reportRef.current) return
    setExporting('pdf')
    try {
      await exportElementToPdf(reportRef.current, `${safeFileName(data.report.title)}.pdf`)
      toast.success('تم تصدير التقرير بصيغة PDF')
    } catch {
      toast.error('تعذر تصدير PDF؛ استخدم الطباعة كبديل')
    } finally {
      setExporting(null)
    }
  }

  const handleWord = () => {
    if (!data || !reportRef.current) return
    setExporting('word')
    try {
      exportElementToWord(reportRef.current, safeFileName(data.report.title))
      toast.success('تم تصدير التقرير بصيغة Word')
    } catch {
      toast.error('تعذر تصدير Word')
    } finally {
      setExporting(null)
    }
  }

  const publicReportPath = `/${params.locale || 'ar'}/reports/ai/${params.id}`

  const copyLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}${publicReportPath}`)
    toast.success('تم نسخ رابط التقرير العام')
  }

  const shareWhatsApp = () => {
    if (!data) return
    const publicUrl = `${window.location.origin}${publicReportPath}`
    const message = `${data.report.title}\n\nيمكنك عرض التقرير عبر الرابط:\n${publicUrl}`
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
  }

  const copyExecutiveSummary = async () => {
    if (!data) return
    await navigator.clipboard.writeText(`${data.report.title}\n\n${data.report.executiveSummary}`)
    toast.success('تم نسخ الملخص التنفيذي')
  }

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 shadow-sm">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
          <p className="text-sm font-semibold text-neutral-600">جاري تحميل التقرير الذكي...</p>
          <p className="mt-1 text-xs text-neutral-400">يتم جلب بيانات التقرير من الخادم</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <div className="rounded-3xl border border-neutral-200 bg-white py-16 px-6 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400">
            <FileText size={32} />
          </div>
          <h1 className="text-xl font-bold text-neutral-900 mb-2">التقرير غير متاح</h1>
          <p className="text-sm text-neutral-500 mb-6 max-w-md mx-auto leading-6">لم يتم العثور على التقرير أو لا تملك صلاحية عرضه. قد يكون قد حُذف أو أن رابط التقرير غير صحيح.</p>
          <Link href={`/${params.locale || 'ar'}/admin/impact?tab=reports`} className="inline-flex items-center gap-2 rounded-2xl bg-primary-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary-600/20 transition-all hover:bg-primary-700 hover:shadow-xl no-underline">
            <ArrowRight size={16} />
            العودة إلى التقارير
          </Link>
        </div>
      </div>
    )
  }

  const filename = safeFileName(data.report.title)
  const participationRate = data.metrics.memberCount ? Math.round((data.metrics.activeMembers / data.metrics.memberCount) * 100) : 0

  const navLinks = [
    { id: 'report-summary', label: 'الملخص' },
    { id: 'report-performance', label: 'الأداء' },
    ...(data.reportScope === 'PLATFORM' ? [
      { id: 'platform-evaluation', label: 'التقويم' },
      { id: 'critical-issues', label: 'المشكلات الحرجة' },
      { id: 'rapid-action', label: 'التحرك السريع' },
    ] : []),
    { id: 'report-recommendations', label: 'التوصيات' },
    { id: 'report-categories', label: 'المحاور' },
    { id: 'report-platforms', label: 'المنصات' },
  ]

  return (
    <div className="p-3 md:p-5 lg:p-6 max-w-7xl mx-auto">
      {/* شريط التنقل والتحكم — متجاوب */}
      <div className="mb-4 rounded-2xl border border-neutral-200 bg-white shadow-sm" data-print-hidden>
        {/* مسار التنقل (Breadcrumb) */}
        <div className="flex flex-wrap items-center gap-2 px-4 pt-3 pb-2 text-xs text-neutral-500 border-b border-neutral-100">
          <Link href={`/${params.locale || 'ar'}/admin/impact`} className="hover:text-primary-600 transition-colors no-underline">لوحة الأثر</Link>
          <ChevronDown size={10} className="rotate-90 text-neutral-300" />
          <Link href={`/${params.locale || 'ar'}/admin/impact?tab=reports`} className="hover:text-primary-600 transition-colors no-underline">التقارير</Link>
          <ChevronDown size={10} className="rotate-90 text-neutral-300" />
          <Link href={`/${params.locale || 'ar'}/admin/impact/ai-reports`} className="hover:text-primary-600 transition-colors no-underline">التقارير الذكية</Link>
          <ChevronDown size={10} className="rotate-90 text-neutral-300" />
          <span className="text-neutral-400 truncate max-w-[120px] md:max-w-[200px]">{data.report.title}</span>
        </div>

        {/* شريط الأدوات — mobile折叠 */}
        <div className="lg:hidden">
          <button
            onClick={() => setToolbarOpen(!toolbarOpen)}
            className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            <span>أدوات التقرير</span>
            <ChevronDown size={16} className={`transition-transform ${toolbarOpen ? 'rotate-180' : ''}`} />
          </button>
          {toolbarOpen && (
            <div className="border-t border-neutral-100 px-4 py-3 space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {navLinks.map(({ id, label }) => (
                  <Button unstyled key={id} onClick={() => scrollToSection(id)} className="rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-primary-50 hover:text-primary-700 transition-colors">{label}</Button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button unstyled onClick={copyExecutiveSummary} className="btn-ghost btn-sm"><Copy size={14} /> نسخ الملخص</Button>
                <Button unstyled onClick={copyLink} className="btn-ghost btn-sm"><Link2 size={14} /> نسخ الرابط</Button>
                <Button unstyled onClick={shareWhatsApp} className="btn-ghost btn-sm text-emerald-700"><MessageCircle size={15} /> واتساب</Button>
                <Link href={publicReportPath} target="_blank" className="btn-ghost btn-sm no-underline inline-flex items-center justify-center gap-1.5"><ExternalLink size={15} /> العرض العام</Link>
                <Button unstyled onClick={() => reportRef.current && printElement(reportRef.current, data.report.title)} className="btn-ghost btn-sm"><Printer size={15} /> طباعة</Button>
                <div className="grid grid-cols-2 gap-2 col-span-2">
                  <Button unstyled onClick={handleWord} disabled={!!exporting} className="btn-ghost btn-sm">{exporting === 'word' ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />} Word</Button>
                  <Button unstyled onClick={handlePdf} disabled={!!exporting} className="btn-primary btn-sm">{exporting === 'pdf' ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} PDF</Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* شريط الأدوات — desktop */}
        <div className="hidden lg:flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-neutral-400 ml-1.5">انتقال سريع:</span>
            {navLinks.map(({ id, label }) => (
              <Button unstyled key={id} onClick={() => scrollToSection(id)} className="rounded-lg px-2.5 py-1.5 text-xs text-neutral-600 hover:bg-primary-50 hover:text-primary-700 whitespace-nowrap transition-colors">{label}</Button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <Button unstyled onClick={loadReport} className="btn-ghost btn-sm"><RefreshCw size={14} /> تحديث</Button>
            <Button unstyled onClick={copyExecutiveSummary} className="btn-ghost btn-sm"><Copy size={14} /> نسخ الملخص</Button>
            <Button unstyled onClick={copyLink} className="btn-ghost btn-sm"><Link2 size={14} /> نسخ الرابط</Button>
            <Button unstyled onClick={shareWhatsApp} className="btn-ghost btn-sm text-emerald-700"><MessageCircle size={15} /> واتساب</Button>
            <Link href={publicReportPath} target="_blank" className="btn-ghost btn-sm no-underline inline-flex items-center gap-1.5"><ExternalLink size={15} /> العام</Link>
            <Button unstyled onClick={() => reportRef.current && printElement(reportRef.current, data.report.title)} className="btn-ghost btn-sm"><Printer size={15} /> طباعة</Button>
            <Button unstyled onClick={handleWord} disabled={!!exporting} className="btn-ghost btn-sm">{exporting === 'word' ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />} Word</Button>
            <Button unstyled onClick={handlePdf} disabled={!!exporting} className="btn-primary btn-sm">{exporting === 'pdf' ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} PDF</Button>
          </div>
        </div>
      </div>

      {/* رأس التقرير — متجاوب مع تحسينات بصرية */}
      <div className="relative overflow-hidden rounded-3xl border border-primary-200/60 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 p-5 md:p-7 shadow-lg text-white mb-5" data-print-hidden>
        {/* عناصر زخرفية */}
        <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-8 right-1/4 h-32 w-32 rounded-full bg-secondary-500/10 blur-2xl" />
        <div className="absolute inset-0 opacity-[0.03]">
          <svg viewBox="0 0 400 200" className="h-full w-full" preserveAspectRatio="none">
            <defs><pattern id="ai-report-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" /></pattern></defs>
            <rect width="100%" height="100%" fill="url(#ai-report-grid)" />
          </svg>
        </div>

        <div className="relative flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
          <div className="min-w-0 flex-1">
            {/* مسار ومعلومات */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Link href={`/${params.locale || 'ar'}/admin/impact?tab=reports`} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80 hover:bg-white/20 hover:text-white transition-colors no-underline backdrop-blur-sm">
                <ArrowRight size={12} /> إعداد التقارير
              </Link>
              <span className="text-white/20">/</span>
              <Link href={`/${params.locale || 'ar'}/admin/impact/ai-reports`} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80 hover:bg-white/20 hover:text-white transition-colors no-underline backdrop-blur-sm">
                <Archive size={12} /> الأرشيف
              </Link>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 border border-emerald-300/20 px-2.5 py-1 text-[10px] font-bold text-emerald-200 backdrop-blur-sm">
                <CheckCircle2 size={11} /> محفوظ
              </span>
            </div>

            {/* العنوان */}
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black leading-tight text-balance flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 border border-white/15 backdrop-blur-sm">
                <Sparkles size={18} />
              </span>
              {data.report.title}
            </h1>
            <p className="text-sm text-white/65 mt-3 leading-6 max-w-2xl">وثيقة تنفيذية مستقلة بُنيت من بيانات الفترة، ومهيأة للطباعة والتصدير والمشاركة العامة عبر رابط لا يتطلب تسجيل الدخول.</p>

            {/* علامات إضافية */}
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/50">
              <span className="rounded-lg bg-white/8 px-2.5 py-1">تاريخ الإنشاء: {new Date(data.generatedAt).toLocaleString('ar-SA')}</span>
              <span className="rounded-lg bg-white/8 px-2.5 py-1">{data.metrics.dataQuality.recordsAnalyzed.toLocaleString('ar-SA')} سجلًا</span>
            </div>
          </div>

          {/* مؤشرات سريعة */}
          <div className="grid grid-cols-3 gap-2 min-w-0 sm:min-w-[340px] lg:min-w-[380px] lg:max-w-[400px]">
            {[
              { icon: Activity, label: 'إجمالي الأنشطة', value: data.metrics.totalActivities, gradient: 'from-primary-400 to-primary-600' },
              { icon: Users, label: 'نسبة المشاركة', value: `${participationRate}%`, gradient: 'from-secondary-400 to-secondary-600' },
              { icon: CheckCircle2, label: 'نسبة الاعتماد', value: `${data.metrics.approvalRate}%`, gradient: 'from-emerald-400 to-emerald-600' },
            ].map(({ icon: Icon, label, value, gradient }) => (
              <div key={label} className="group relative overflow-hidden rounded-xl border border-white/12 bg-white/8 p-3 text-center backdrop-blur-sm transition-all hover:bg-white/14 hover:-translate-y-0.5">
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-[0.06]`} />
                <div className="relative">
                  <Icon size={16} className="mx-auto text-white/60 mb-1.5" />
                  <div className="font-black text-lg">{typeof value === 'number' ? value.toLocaleString('ar-SA') : value}</div>
                  <div className="text-[10px] text-white/50 leading-tight">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* التقرير الفعلي — محسن للعرض والطباعة */}
      <div className="rounded-3xl bg-neutral-100/80 p-2 sm:p-4 lg:p-6 border border-neutral-200/80 shadow-inner">
        <div className="mx-auto w-full max-w-[210mm] rounded-2xl bg-white shadow-lg ring-1 ring-neutral-200/50 overflow-hidden transition-all">
          <div ref={reportRef} data-filename={filename}>
            <SmartImpactReportDocument report={data.report} metrics={data.metrics} generatedAt={data.generatedAt} reportScope={data.reportScope} />
          </div>
        </div>
      </div>

      {/* تذييل الصفحة */}
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-400" data-print-hidden>
        <div className="flex items-center gap-2">
          <Info size={13} />
          <span>هذا التقرير قابل للمراجعة ولا ينفذ قرارات اعتماد تلقائية.</span>
        </div>
        <span className="text-[10px] font-mono">v2.0 • AI-Powered Impact Report</span>
      </div>
    </div>
  )
}
