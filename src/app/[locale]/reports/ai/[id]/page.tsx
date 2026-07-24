'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle2, Copy, Download, FileText, Loader2, MessageCircle, Printer, Share2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { SmartImpactReportDocument } from '@/components/admin/SmartImpactReportDocument'
import { exportElementToPdf, printElement } from '@/lib/report-export'
import type { ImpactReportMetrics, SmartImpactReport } from '@/lib/ai/impact-report'

interface PublicSmartReport {
  id: string
  report: SmartImpactReport
  metrics: ImpactReportMetrics
  generatedAt: string
  reportScope: 'NETWORK' | 'PLATFORM'
}

function safeFileName(title: string) {
  return title.replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, '-').slice(0, 100) || 'تقرير-أثر-ذكي'
}

export default function PublicSmartImpactReportPage() {
  const params = useParams<{ locale: string; id: string }>()
  const reportRef = useRef<HTMLDivElement>(null)
  const [data, setData] = useState<PublicSmartReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  const loadReport = useCallback(async () => {
    if (!params.id) return
    setLoading(true)
    try {
      const response = await fetch(`/api/public/ai-reports/${params.id}`, { cache: 'no-store' })
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

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href)
    toast.success('تم نسخ رابط التقرير العام')
  }

  const shareWhatsApp = () => {
    if (!data) return
    const message = `${data.report.title}\n\nيمكنك عرض التقرير عبر الرابط:\n${window.location.href}`
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
  }

  const exportPdf = async () => {
    if (!data || !reportRef.current) return
    setExporting(true)
    try {
      await exportElementToPdf(reportRef.current, `${safeFileName(data.report.title)}.pdf`)
      toast.success('تم تصدير التقرير بصيغة PDF')
    } catch {
      toast.error('تعذر تصدير PDF؛ استخدم الطباعة كبديل')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-neutral-100"><div className="text-center"><Loader2 className="mx-auto size-9 animate-spin text-primary-700" /><p className="mt-3 text-sm text-neutral-500">جاري تحميل التقرير...</p></div></div>
  }

  if (!data) {
    return <div className="flex min-h-screen items-center justify-center bg-neutral-100 p-5"><div className="w-full max-w-lg rounded-3xl border bg-white p-10 text-center shadow-sm"><FileText size={42} className="mx-auto mb-3 text-neutral-300" /><h1 className="text-xl font-bold">التقرير غير متاح</h1><p className="mt-2 text-sm text-neutral-500">الرابط غير صحيح أو لم يعد التقرير موجودًا.</p></div></div>
  }

  return (
    <div className="min-h-screen bg-neutral-100" dir="rtl">
      <header className="bg-gradient-to-l from-primary-950 via-primary-800 to-teal-700 px-4 py-8 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/85">
            <CheckCircle2 size={14} />
            تقرير عام قابل للمشاركة
          </div>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-4xl">
              <h1 className="flex items-start gap-3 text-2xl font-black leading-relaxed lg:text-4xl">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/10"><Sparkles size={23} /></span>
                {data.report.title}
              </h1>
              <p className="mt-3 text-sm leading-7 text-white/70">
                {data.reportScope === 'PLATFORM' ? 'تقرير أداء خاص بمنصة ضمن شبكة رواد' : 'تقرير أداء شبكة رواد الكلي'}، متاح للعرض عبر الرابط دون تسجيل دخول.
              </p>
            </div>
            <div className="flex flex-wrap gap-2" data-print-hidden>
              <Button unstyled onClick={copyLink} className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/20"><Copy size={16} /> نسخ الرابط</Button>
              <Button unstyled onClick={shareWhatsApp} className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-600"><MessageCircle size={17} /> واتساب</Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4 md:p-7">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm" data-print-hidden>
          <div className="flex items-center gap-2 text-sm text-neutral-500"><Share2 size={16} className="text-primary-700" /> يمكنك مشاركة هذه الصفحة مباشرة مع أي شخص.</div>
          <div className="flex flex-wrap gap-2">
            <Button unstyled onClick={() => reportRef.current && printElement(reportRef.current, data.report.title)} className="btn-ghost btn-sm flex items-center gap-1.5"><Printer size={15} /> طباعة</Button>
            <Button unstyled onClick={exportPdf} disabled={exporting} className="btn-primary btn-sm flex items-center gap-1.5">{exporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} PDF</Button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-neutral-200 bg-neutral-200/70 p-3 sm:p-6 lg:p-8">
          <div ref={reportRef} className="mx-auto w-full max-w-[210mm] shadow-sm">
            <SmartImpactReportDocument report={data.report} metrics={data.metrics} generatedAt={data.generatedAt} reportScope={data.reportScope} />
          </div>
        </div>
      </main>
    </div>
  )
}
