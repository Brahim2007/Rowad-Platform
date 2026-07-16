'use client'

import { Button } from '@/components/ui/button'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowRight, Download, FileText, Loader2, Printer, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { ReportDocument, reportFileName, type ReportDocumentData } from '@/components/admin/ReportDocument'
import { exportElementToPdf, printElement } from '@/lib/report-export'

export default function AdminReportDetailsPage() {
  const params = useParams<{ id: string }>()
  const reportRef = useRef<HTMLDivElement>(null)
  const [report, setReport] = useState<ReportDocumentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  const fetchReport = useCallback(async () => {
    if (!params.id) return
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/reports/submitted/${params.id}`)
      const result = await response.json()
      if (result.success) {
        setReport(result.data)
      } else {
        toast.error(result.message || 'تعذر تحميل التقرير')
      }
    } catch {
      toast.error('تعذر تحميل التقرير')
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const handlePrint = () => {
    if (!reportRef.current || !report) return
    printElement(reportRef.current, report.template?.title || 'تقرير')
  }

  const handleExportPdf = async () => {
    if (!reportRef.current || !report) return
    setExporting(true)
    try {
      await exportElementToPdf(reportRef.current, reportFileName(report))
      toast.success('تم تجهيز ملف PDF')
    } catch {
      toast.error('تعذر تصدير PDF، يمكن استخدام زر الطباعة كبديل')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <Loader2 className="w-9 h-9 animate-spin mx-auto text-primary-600" />
          <p className="mt-3 text-sm text-neutral-400">جاري تحميل التقرير...</p>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
        <div className="card text-center py-12">
          <FileText size={40} className="mx-auto text-neutral-300 mb-3" />
          <h1 className="text-lg font-bold text-neutral-900 mb-2">التقرير غير متاح</h1>
          <p className="text-sm text-neutral-500 mb-4">لم يتم العثور على التقرير أو لا توجد صلاحية لعرضه.</p>
          <Link href="/ar/admin/reports" className="btn-primary btn-sm no-underline inline-flex">
            العودة للتقارير
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 border-b border-neutral-200 pb-5" data-print-hidden>
        <div>
          <Link href="/ar/admin/reports" className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-primary-700 no-underline mb-3">
            <ArrowRight size={16} />
            العودة إلى التقارير
          </Link>
          <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900 flex items-center gap-3">
            <FileText className="text-primary-600" size={28} />
            {report.template?.title || 'تقرير'}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button unstyled onClick={fetchReport} className="btn-ghost btn-sm flex items-center gap-1.5">
            <RefreshCw size={15} />
            تحديث
          </Button>
          <Button unstyled onClick={handlePrint} className="btn-ghost btn-sm flex items-center gap-1.5">
            <Printer size={15} />
            طباعة
          </Button>
          <Button unstyled onClick={handleExportPdf} disabled={exporting} className="btn-primary btn-sm flex items-center gap-1.5">
            {exporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
            PDF
          </Button>
        </div>
      </div>

      <div className="bg-neutral-100 rounded-2xl p-3 sm:p-5 overflow-x-auto">
        <div ref={reportRef} className="mx-auto w-full max-w-[210mm] shadow-sm">
          <ReportDocument report={report} />
        </div>
      </div>
    </div>
  )
}
