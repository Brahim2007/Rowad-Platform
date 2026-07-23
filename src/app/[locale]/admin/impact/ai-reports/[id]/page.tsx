'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Activity, Archive, ArrowRight, CheckCircle2, Copy, Download, ExternalLink, FileText, Link2, Loader2, MessageCircle, Printer, RefreshCw, Sparkles, Users } from 'lucide-react'
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
    return <div className="py-20 text-center"><Loader2 className="w-9 h-9 animate-spin mx-auto text-primary-600" /><p className="mt-3 text-sm text-neutral-500">جاري تحميل التقرير الذكي...</p></div>
  }

  if (!data) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center">
        <div className="card py-14">
          <FileText size={42} className="mx-auto text-neutral-300 mb-3" />
          <h1 className="font-bold text-xl mb-2">التقرير غير متاح</h1>
          <p className="text-sm text-neutral-500 mb-5">لم يتم العثور على التقرير أو لا تملك صلاحية عرضه.</p>
          <Link href={`/${params.locale || 'ar'}/admin/impact?tab=reports`} className="btn-primary btn-sm no-underline inline-flex">العودة إلى التقارير</Link>
        </div>
      </div>
    )
  }

  const filename = safeFileName(data.report.title)
  const participationRate = data.metrics.memberCount ? Math.round((data.metrics.activeMembers / data.metrics.memberCount) * 100) : 0
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <div data-testid="report-toolbar" className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 mb-5" data-print-hidden>
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-1 xl:pb-0">
          <span className="text-[11px] font-semibold text-neutral-400 px-2 whitespace-nowrap">انتقال سريع:</span>
          {[
            ['report-summary', 'الملخص'],
            ['report-performance', 'الأداء'],
            ['report-recommendations', 'التوصيات'],
            ['report-categories', 'المحاور'],
            ['report-platforms', 'المنصات'],
          ].map(([id, label]) => (
            <Button unstyled key={id} onClick={() => scrollToSection(id)} className="rounded-lg px-2.5 py-1.5 text-xs text-neutral-600 hover:bg-primary-50 hover:text-primary-700 whitespace-nowrap">{label}</Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button unstyled onClick={copyExecutiveSummary} className="btn-ghost btn-sm flex items-center gap-1.5"><Copy size={14} /> نسخ الملخص</Button>
          <Button unstyled onClick={copyLink} className="btn-ghost btn-sm flex items-center gap-1.5"><Link2 size={14} /> نسخ الرابط</Button>
          <Button unstyled onClick={shareWhatsApp} className="btn-ghost btn-sm flex items-center gap-1.5 text-emerald-700"><MessageCircle size={15} /> واتساب</Button>
          <Link href={publicReportPath} target="_blank" className="btn-ghost btn-sm flex items-center gap-1.5 no-underline"><ExternalLink size={15} /> العرض العام</Link>
          <Button unstyled onClick={loadReport} className="btn-ghost btn-sm flex items-center gap-1.5"><RefreshCw size={15} /> تحديث</Button>
          <Button unstyled onClick={() => reportRef.current && printElement(reportRef.current, data.report.title)} className="btn-ghost btn-sm flex items-center gap-1.5"><Printer size={15} /> طباعة</Button>
          <Button unstyled onClick={handleWord} disabled={!!exporting} className="btn-ghost btn-sm flex items-center gap-1.5">
            {exporting === 'word' ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />} Word
          </Button>
          <Button unstyled onClick={handlePdf} disabled={!!exporting} className="btn-primary btn-sm flex items-center gap-1.5">
            {exporting === 'pdf' ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} PDF
          </Button>
        </div>
      </div>

      <div className="rounded-3xl overflow-hidden border border-primary-200 bg-gradient-to-l from-primary-900 via-primary-700 to-indigo-700 p-5 md:p-7 shadow-sm text-white mb-5" data-print-hidden>
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Link href={`/${params.locale || 'ar'}/admin/impact?tab=reports`} className="inline-flex items-center gap-1.5 text-xs text-white/75 hover:text-white no-underline"><ArrowRight size={14} /> إعداد التقارير</Link>
              <span className="text-white/30">/</span>
              <Link href={`/${params.locale || 'ar'}/admin/impact/ai-reports`} className="inline-flex items-center gap-1.5 text-xs text-white/75 hover:text-white no-underline"><Archive size={14} /> الأرشيف</Link>
              <span className="rounded-full bg-emerald-400/20 border border-emerald-300/30 text-emerald-50 px-2.5 py-1 text-[11px] font-semibold inline-flex items-center gap-1"><CheckCircle2 size={12} /> محفوظ في الأرشيف</span>
            </div>
            <h1 className="text-xl lg:text-3xl font-black flex items-start gap-3 text-balance"><span className="w-11 h-11 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0"><Sparkles size={20} /></span>{data.report.title}</h1>
            <p className="text-sm text-white/70 mt-3 md:me-[56px] leading-6">وثيقة تنفيذية مستقلة بُنيت من بيانات الفترة، ومهيأة للطباعة والتصدير والمشاركة العامة عبر رابط لا يتطلب تسجيل الدخول.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 min-w-full sm:min-w-[360px] lg:min-w-[390px] lg:max-w-[420px]">
            {[
              { icon: Activity, label: 'الأنشطة', value: data.metrics.totalActivities },
              { icon: Users, label: 'المشاركة', value: `${participationRate}%` },
              { icon: CheckCircle2, label: 'الاعتماد', value: `${data.metrics.approvalRate}%` },
            ].map(item => (
              <div key={item.label} className="rounded-xl bg-white/10 border border-white/15 p-3 text-center">
                <item.icon size={15} className="mx-auto text-white/70 mb-1" />
                <div className="font-black text-lg">{typeof item.value === 'number' ? item.value.toLocaleString('ar-SA') : item.value}</div>
                <div className="text-[10px] text-white/60">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-neutral-200/70 rounded-3xl p-3 sm:p-6 lg:p-8 overflow-x-auto border border-neutral-200">
        <div ref={reportRef} className="mx-auto w-full max-w-[210mm] shadow-sm" data-filename={filename}>
          <SmartImpactReportDocument report={data.report} metrics={data.metrics} generatedAt={data.generatedAt} />
        </div>
      </div>
    </div>
  )
}
