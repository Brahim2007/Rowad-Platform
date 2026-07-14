'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import Link from 'next/link'
import {
  Bold, CheckCircle, ClipboardList, Clock, Code, Download, ExternalLink, Eye, FileCheck,
  FileSpreadsheet, FileText, Heading, Image, List, ListOrdered, Loader2, Pencil, Plus, Printer, Search,
  Table, Trash2, Type, X, XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { ReportDocument, reportFileName, type ReportDocumentData } from '@/components/admin/ReportDocument'
import { exportElementToPdf, printElement } from '@/lib/report-export'
import { sanitizeRichHtml } from '@/lib/sanitize-html'

const HTML_TOOLBAR_ITEMS = [
  { label: 'عنوان', icon: Heading, snippet: '<h2>نص العنوان</h2>\n<p>نص الفقرة...</p>' },
  { label: 'عريض', icon: Bold, snippet: '<strong>نص عريض</strong>' },
  { label: 'فقرة', icon: Type, snippet: '<p>نص الفقرة هنا...</p>' },
  { label: 'قائمة', icon: List, snippet: '<ul>\n  <li>عنصر 1</li>\n  <li>عنصر 2</li>\n  <li>عنصر 3</li>\n</ul>' },
  { label: 'مرقمة', icon: ListOrdered, snippet: '<ol>\n  <li>العنصر الأول</li>\n  <li>العنصر الثاني</li>\n</ol>' },
  { label: 'جدول', icon: Table, snippet: '<table>\n  <thead>\n    <tr><th>العمود 1</th><th>العمود 2</th></tr>\n  </thead>\n  <tbody>\n    <tr><td>بيان 1</td><td>بيان 2</td></tr>\n  </tbody>\n</table>' },
  { label: 'صورة', icon: Image, snippet: '<img src="https://example.com/image.jpg" alt="وصف الصورة" style="max-width:100%;border-radius:8px;" />' },
  { label: 'اقتباس', icon: Code, snippet: '<blockquote>نص الاقتباس هنا</blockquote>' },
]

interface Template {
  id: string
  title: string
  slug: string
  description: string | null
  category: string
  sections: string
  icon: string | null
  isActive: boolean
  createdAt: string
}

interface Report {
  id: string
  templateId: string
  template?: { title: string; description?: string | null; category?: string | null; sections?: string | null }
  data: string
  status: string
  submittedBy: string | null
  reviewedBy: string | null
  reviewNotes: string | null
  submittedAt: string | null
  reviewedAt?: string | null
  createdAt: string
  platform?: { id?: string; name: string } | null
  program?: { id?: string; name: string } | null
  project?: { id?: string; title: string } | null
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

interface ProjectOption {
  id: string
  title: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  DRAFT: { label: 'مسودة', color: 'bg-neutral-100 text-neutral-500', icon: FileText },
  SUBMITTED: { label: 'مرفوع', color: 'bg-info-50 text-info-600', icon: Clock },
  REVIEWED: { label: 'مراجع', color: 'bg-warning-50 text-warning-600', icon: Eye },
  APPROVED: { label: 'معتمد', color: 'bg-success-50 text-success-600', icon: CheckCircle },
  REJECTED: { label: 'مرفوض', color: 'bg-error-50 text-error-600', icon: XCircle },
}

const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  PERFORMANCE: { label: 'أداء', color: 'bg-primary-100 text-primary-700' },
  IMPACT: { label: 'أثر', color: 'bg-secondary-100 text-secondary-700' },
  FINANCIAL: { label: 'مالي', color: 'bg-success-50 text-success-700' },
  PROGRESS: { label: 'تقدم', color: 'bg-info-50 text-info-700' },
  EVALUATION: { label: 'تقييم', color: 'bg-purple-100 text-purple-700' },
  OTHER: { label: 'أخرى', color: 'bg-neutral-100 text-neutral-600' },
}

const emptyTemplate = {
  title: '',
  slug: '',
  description: '',
  category: 'PERFORMANCE',
  icon: '',
  sections: '[{"title":"ملخص تنفيذي","type":"textarea","required":true}]',
  isActive: true,
}

const emptyReport = {
  templateId: '',
  data: '{\n  "ملخص تنفيذي": "",\n  "الإنجازات": "",\n  "التحديات": "",\n  "التوصيات": ""\n}',
  status: 'DRAFT',
  submittedBy: '',
  reviewedBy: '',
  reviewNotes: '',
  targetType: '',
  targetId: '',
}

function Badge({ children, className }: { children: ReactNode; className: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {children}
    </span>
  )
}

function safeParseJson(value: string) {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function dateLabel(value?: string | null) {
  return value ? new Date(value).toLocaleDateString('ar') : 'غير محدد'
}

export default function AdminReportsPage() {
  const previewRef = useRef<HTMLDivElement>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [platforms, setPlatforms] = useState<PlatformOption[]>([])
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<string | null>(null)
  const [previewReport, setPreviewReport] = useState<Report | null>(null)
  const [activeTab, setActiveTab] = useState<'templates' | 'reports'>('templates')
  const [reportSearch, setReportSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [templateForm, setTemplateForm] = useState(emptyTemplate)

  const [showReportModal, setShowReportModal] = useState(false)
  const [editingReport, setEditingReport] = useState<Report | null>(null)
  const [reportForm, setReportForm] = useState(emptyReport)
  const [submitting, setSubmitting] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [htmlContent, setHtmlContent] = useState('')
  const [htmlPreviewMode, setHtmlPreviewMode] = useState(false)

  const programs = useMemo(
    () => platforms.flatMap(platform => (platform.programs || []).map(program => ({ ...program, platformId: platform.id }))),
    [platforms]
  )

  const visibleReports = useMemo(() => {
    const query = reportSearch.trim().toLowerCase()
    return reports.filter(report => {
      if (statusFilter && report.status !== statusFilter) return false
      if (!query) return true
      const searchable = [
        report.template?.title,
        report.submittedBy,
        report.reviewedBy,
        report.platform?.name,
        report.program?.name,
        report.project?.title,
        report.data,
      ].filter(Boolean).join(' ').toLowerCase()
      return searchable.includes(query)
    })
  }, [reportSearch, reports, statusFilter])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [tRes, rRes, pRes, prRes] = await Promise.all([
        fetch('/api/admin/reports/templates').then(r => r.json()),
        fetch('/api/admin/reports/submitted').then(r => r.json()),
        fetch('/api/admin/platforms').then(r => r.json()),
        fetch('/api/admin/projects?limit=100').then(r => r.json()),
      ])
      if (tRes.success) setTemplates(tRes.data || [])
      if (rRes.success) setReports(rRes.data || [])
      if (pRes.success) setPlatforms(pRes.data?.platforms || [])
      if (prRes.success) setProjects(prRes.data?.projects || [])
    } catch {
      toast.error('فشل تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const openCreateTemplate = () => {
    setEditingTemplate(null)
    setTemplateForm(emptyTemplate)
    setShowTemplateModal(true)
  }

  const openEditTemplate = (template: Template) => {
    setEditingTemplate(template)
    setTemplateForm({
      title: template.title,
      slug: template.slug,
      description: template.description || '',
      category: template.category,
      icon: template.icon || '',
      sections: template.sections || '[]',
      isActive: template.isActive,
    })
    setShowTemplateModal(true)
  }

  const openCreateReport = () => {
    setEditingReport(null)
    setReportForm({ ...emptyReport, templateId: templates[0]?.id || '' })
    setHtmlContent('')
    setHtmlPreviewMode(false)
    setShowReportModal(true)
  }

  const openEditReport = (report: Report) => {
    const parsedData = safeParseJson(report.data) || {}
    setEditingReport(report)
    setReportForm({
      ...emptyReport,
      templateId: report.templateId,
      data: report.data || '{}',
      status: report.status,
      submittedBy: report.submittedBy || '',
      reviewedBy: report.reviewedBy || '',
      reviewNotes: report.reviewNotes || '',
      targetType: report.platform ? 'platform' : report.program ? 'program' : report.project ? 'project' : '',
      targetId: report.platform?.id || report.program?.id || report.project?.id || '',
    })
    setHtmlContent(parsedData.htmlContent || parsedData['محتوى HTML'] || '')
    setHtmlPreviewMode(false)
    setShowReportModal(true)
  }

  const handleTemplateSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!safeParseJson(templateForm.sections)) {
      toast.error('الأقسام يجب أن تكون JSON صحيحاً')
      return
    }

    setSubmitting(true)
    try {
      const method = editingTemplate ? 'PUT' : 'POST'
      const body = editingTemplate ? { id: editingTemplate.id, ...templateForm } : templateForm
      const res = await fetch('/api/admin/reports/templates', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(editingTemplate ? 'تم تحديث القالب' : 'تم إنشاء القالب')
        setShowTemplateModal(false)
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

  const handleReportSubmit = async (event: FormEvent) => {
    event.preventDefault()

    // Build final data: merge JSON data fields with HTML content
    let baseData: Record<string, unknown> = {}
    if (reportForm.data && reportForm.data !== '{}') {
      const parsed = safeParseJson(reportForm.data)
      if (parsed && typeof parsed === 'object') baseData = parsed as Record<string, unknown>
    }
    if (htmlContent.trim()) {
      baseData.htmlContent = htmlContent.trim()
    }
    const mergedData = JSON.stringify(baseData)

    setSubmitting(true)
    try {
      const target = {
        platformId: reportForm.targetType === 'platform' ? reportForm.targetId : '',
        programId: reportForm.targetType === 'program' ? reportForm.targetId : '',
        projectId: reportForm.targetType === 'project' ? reportForm.targetId : '',
      }
      const method = editingReport ? 'PUT' : 'POST'
      const body = editingReport
        ? { id: editingReport.id, ...reportForm, data: mergedData, ...target }
        : { ...reportForm, data: mergedData, ...target }
      const res = await fetch('/api/admin/reports/submitted', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(editingReport ? 'تم تحديث التقرير' : 'تم إنشاء التقرير')
        setShowReportModal(false)
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

  const updateReportStatus = async (report: Report, status: string) => {
    try {
      const res = await fetch('/api/admin/reports/submitted', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: report.id,
          status,
          reviewedBy: 'الإدارة',
          reviewNotes: status === 'APPROVED' ? 'تم اعتماد التقرير' : status === 'REJECTED' ? 'تم رفض التقرير' : report.reviewNotes,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('تم تحديث حالة التقرير')
        await fetchData()
      } else {
        toast.error(data.message || 'فشل التحديث')
      }
    } catch {
      toast.error('فشل التحديث')
    }
  }

  const deleteTemplate = async (id: string) => {
    if (!confirm('هل تريد حذف هذا القالب؟')) return
    try {
      const res = await fetch(`/api/admin/reports/templates?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('تم حذف القالب')
        await fetchData()
      } else {
        toast.error(data.message || 'تعذر حذف القالب')
      }
    } catch {
      toast.error('فشل الحذف')
    }
  }

  const deleteReport = async (id: string) => {
    if (!confirm('هل تريد حذف هذا التقرير؟')) return
    try {
      const res = await fetch(`/api/admin/reports/submitted?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('تم حذف التقرير')
        await fetchData()
      } else {
        toast.error(data.message || 'تعذر حذف التقرير')
      }
    } catch {
      toast.error('فشل الحذف')
    }
  }

  const handlePreviewPrint = () => {
    if (!previewRef.current || !previewReport) return
    printElement(previewRef.current, previewReport.template?.title || 'تقرير')
  }

  const handlePreviewPdf = async () => {
    if (!previewRef.current || !previewReport) return
    setExportingPdf(true)
    try {
      await exportElementToPdf(previewRef.current, reportFileName(previewReport as ReportDocumentData))
      toast.success('تم تجهيز ملف PDF')
    } catch {
      toast.error('تعذر تصدير PDF، يمكن استخدام الطباعة كبديل')
    } finally {
      setExportingPdf(false)
    }
  }

  const filteredCount = reports.filter(report => report.status === 'SUBMITTED' || report.status === 'REVIEWED').length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
          <p className="mt-3 text-sm text-neutral-400">جاري تحميل التقارير...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-6 gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900 mb-2 flex items-center gap-3">
            <ClipboardList className="text-primary-600" size={28} />
            التقارير ودعم القرار
          </h1>
          <p className="text-neutral-500 max-w-2xl text-sm">
            قوالب مرنة لجمع البيانات، تقارير مرفوعة، ومراجعة واعتماد لدعم اتخاذ القرار.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={openCreateTemplate} className="btn-ghost btn-sm flex items-center gap-1.5">
            <Plus size={15} />
            قالب
          </button>
          <button onClick={openCreateReport} className="btn-primary btn-sm flex items-center gap-1.5" disabled={templates.length === 0}>
            <Plus size={15} />
            تقرير
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'قوالب التقارير', value: templates.length, icon: ClipboardList, color: 'bg-primary-100 text-primary-600' },
          { label: 'تقارير مرفوعة', value: reports.length, icon: FileText, color: 'bg-info-50 text-info-500' },
          { label: 'معتمدة', value: reports.filter(r => r.status === 'APPROVED').length, icon: CheckCircle, color: 'bg-success-50 text-success-500' },
          { label: 'قيد المراجعة', value: filteredCount, icon: Clock, color: 'bg-warning-50 text-warning-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card flex items-center gap-3 p-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}><Icon size={18} /></div>
            <div><div className="text-lg font-bold text-neutral-900">{value}</div><div className="text-xs text-neutral-500">{label}</div></div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 mb-6 bg-neutral-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'templates' ? 'bg-white text-primary-700 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <ClipboardList size={16} className="inline ml-1.5" />
          قوالب التقارير
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'reports' ? 'bg-white text-primary-700 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <FileCheck size={16} className="inline ml-1.5" />
          التقارير المرفوعة
        </button>
      </div>

      {activeTab === 'templates' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-neutral-500">{templates.length} قالب</p>
          </div>
          {templates.length === 0 ? (
            <div className="card text-center py-12 text-neutral-400">
              <ClipboardList size={36} className="mx-auto mb-3 text-neutral-300" />
              <p>لا توجد قوالب تقارير</p>
              <button onClick={openCreateTemplate} className="btn-primary btn-sm mt-4">إضافة قالب</button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map(template => {
                const catConfig = CATEGORY_CONFIG[template.category] || CATEGORY_CONFIG.OTHER
                return (
                  <div key={template.id} className="card group">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${catConfig.color}`}>
                        <FileSpreadsheet size={20} />
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEditTemplate(template)} className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg" title="تعديل">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => deleteTemplate(template.id)} className="p-1.5 text-neutral-400 hover:text-error-600 hover:bg-error-50 rounded-lg" title="حذف">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <h3 className="font-semibold text-neutral-900 text-sm mb-1">{template.title}</h3>
                    <p className="text-[10px] text-neutral-400 font-mono mb-2">{template.slug}</p>
                    {template.description && <p className="text-xs text-neutral-500 line-clamp-2 mb-3">{template.description}</p>}
                    <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                      <Badge className={catConfig.color}>{catConfig.label}</Badge>
                      <Badge className={template.isActive ? 'bg-success-50 text-success-600' : 'bg-neutral-100 text-neutral-400'}>
                        {template.isActive ? 'نشط' : 'غير نشط'}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'reports' && (
        <div>
          <div className="card mb-4">
            <div className="grid md:grid-cols-[1fr_180px_auto] gap-3 items-center">
              <div className="relative">
                <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  value={reportSearch}
                  onChange={event => setReportSearch(event.target.value)}
                  className="input-field pr-9 h-10 text-sm"
                  placeholder="بحث في عنوان التقرير، الجهة، رافع التقرير أو المحتوى..."
                />
              </div>
              <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} className="input-field h-10 text-sm">
                <option value="">كل الحالات</option>
                {Object.entries(STATUS_CONFIG).map(([key, value]) => (
                  <option key={key} value={key}>{value.label}</option>
                ))}
              </select>
              <button
                onClick={() => { setReportSearch(''); setStatusFilter('') }}
                className="btn-ghost btn-sm h-10"
              >
                مسح
              </button>
            </div>
          </div>

          <p className="text-sm text-neutral-500 mb-4">
            عرض {visibleReports.length} من {reports.length} تقرير
          </p>
          {reports.length === 0 ? (
            <div className="card text-center py-12 text-neutral-400">
              <FileText size={36} className="mx-auto mb-3 text-neutral-300" />
              <p>لا توجد تقارير مرفوعة</p>
              <button onClick={openCreateReport} disabled={templates.length === 0} className="btn-primary btn-sm mt-4">إضافة تقرير</button>
            </div>
          ) : visibleReports.length === 0 ? (
            <div className="card text-center py-12 text-neutral-400">
              <Search size={36} className="mx-auto mb-3 text-neutral-300" />
              <p>لا توجد تقارير مطابقة للبحث الحالي</p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleReports.map(report => {
                const statusConfig = STATUS_CONFIG[report.status] || STATUS_CONFIG.DRAFT
                const StatusIcon = statusConfig.icon
                const isExpanded = selectedReport === report.id
                const parsedData = safeParseJson(report.data) || {}

                return (
                  <div
                    key={report.id}
                    className={`card cursor-pointer transition-all ${
                      isExpanded ? 'ring-1 ring-primary-200 shadow-md' : 'hover:shadow-sm'
                    }`}
                    onClick={() => setSelectedReport(isExpanded ? null : report.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-semibold text-neutral-900 text-sm">
                            {report.template?.title || 'تقرير'}
                          </h3>
                          {(report.platform || report.program || report.project) && (
                            <span className="text-[10px] text-neutral-400">
                              ({report.platform?.name || report.program?.name || report.project?.title || ''})
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-[10px] text-neutral-400 mt-1">
                          {report.submittedBy && <span>بواسطة: {report.submittedBy}</span>}
                          <span>الرفع: {dateLabel(report.submittedAt)}</span>
                          <span>الإنشاء: {dateLabel(report.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1" onClick={event => event.stopPropagation()}>
                        <Badge className={statusConfig.color}>
                          <StatusIcon size={10} />
                          {statusConfig.label}
                        </Badge>
                        <button onClick={() => setPreviewReport(report)} className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg" title="معاينة التقرير">
                          <Eye size={14} />
                        </button>
                        <Link href={`/ar/admin/reports/${report.id}`} className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg no-underline" title="فتح التقرير">
                          <ExternalLink size={14} />
                        </Link>
                        <button onClick={() => openEditReport(report)} className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg" title="تعديل">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => deleteReport(report.id)} className="p-1.5 text-neutral-400 hover:text-error-600 hover:bg-error-50 rounded-lg" title="حذف">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-neutral-200">
                        {Object.keys(parsedData).length > 0 && (
                          <div className="grid sm:grid-cols-2 gap-3 text-sm mb-4">
                            {Object.entries(parsedData).map(([key, value]) => (
                              <div key={key} className="rounded-xl bg-neutral-50 border border-neutral-100 p-3">
                                <div className="text-[10px] text-neutral-400 mb-1">{key}</div>
                                <div className="text-xs font-medium text-neutral-900 whitespace-pre-wrap">{String(value)}</div>
                              </div>
                            ))}
                          </div>
                        )}
                        {report.reviewNotes && (
                          <div className="p-3 bg-warning-50 rounded-xl text-xs text-neutral-700 mb-3">
                            <span className="font-semibold">ملاحظات المراجعة:</span> {report.reviewNotes}
                          </div>
                        )}
                        <div className="flex flex-wrap items-center justify-between gap-2" onClick={event => event.stopPropagation()}>
                          <div className="text-[10px] text-neutral-400">
                            {report.reviewedBy && <span>راجع: {report.reviewedBy}</span>}
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => setPreviewReport(report)} className="btn-ghost btn-xs flex items-center gap-1">
                              <Eye size={13} />
                              عرض
                            </button>
                            <Link href={`/ar/admin/reports/${report.id}`} className="btn-ghost btn-xs no-underline flex items-center gap-1">
                              <ExternalLink size={13} />
                              فتح
                            </Link>
                            <button onClick={() => updateReportStatus(report, 'REVIEWED')} className="btn-ghost btn-xs">مراجعة</button>
                            <button onClick={() => updateReportStatus(report, 'APPROVED')} className="btn-primary btn-xs">اعتماد</button>
                            <button onClick={() => updateReportStatus(report, 'REJECTED')} className="btn-ghost btn-xs text-error-600">رفض</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {previewReport && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 md:p-5">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[92vh] overflow-hidden flex flex-col">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 border-b border-neutral-200">
              <div>
                <h2 className="text-lg font-bold text-neutral-900">{previewReport.template?.title || 'تقرير'}</h2>
                <p className="text-xs text-neutral-400 mt-1">معاينة التقرير قبل الطباعة أو التصدير</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={handlePreviewPrint} className="btn-ghost btn-sm flex items-center gap-1.5">
                  <Printer size={15} />
                  طباعة
                </button>
                <button onClick={handlePreviewPdf} disabled={exportingPdf} className="btn-primary btn-sm flex items-center gap-1.5">
                  {exportingPdf ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                  PDF
                </button>
                <Link href={`/ar/admin/reports/${previewReport.id}`} className="btn-ghost btn-sm no-underline flex items-center gap-1.5">
                  <ExternalLink size={15} />
                  فتح
                </Link>
                <button onClick={() => setPreviewReport(null)} className="btn-ghost btn-sm flex items-center gap-1.5">
                  <X size={15} />
                  إغلاق
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-neutral-100 p-3 md:p-5">
              <div ref={previewRef} className="mx-auto w-full max-w-[210mm] shadow-sm">
                <ReportDocument report={previewReport} />
              </div>
            </div>
          </div>
        </div>
      )}

      {showTemplateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-neutral-200">
              <h2 className="text-lg font-bold text-neutral-900">{editingTemplate ? 'تعديل قالب' : 'قالب جديد'}</h2>
              <button onClick={() => setShowTemplateModal(false)} className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleTemplateSubmit} className="p-5 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">العنوان</label>
                  <input required value={templateForm.title} onChange={e => setTemplateForm({ ...templateForm, title: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">الرابط</label>
                  <input required dir="ltr" value={templateForm.slug} onChange={e => setTemplateForm({ ...templateForm, slug: e.target.value })} className="input-field" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">الفئة</label>
                  <select value={templateForm.category} onChange={e => setTemplateForm({ ...templateForm, category: e.target.value })} className="input-field">
                    {Object.entries(CATEGORY_CONFIG).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">الأيقونة</label>
                  <input value={templateForm.icon} onChange={e => setTemplateForm({ ...templateForm, icon: e.target.value })} className="input-field" placeholder="اختياري" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">الوصف</label>
                <textarea rows={2} value={templateForm.description} onChange={e => setTemplateForm({ ...templateForm, description: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">أقسام القالب (JSON)</label>
                <textarea rows={5} dir="ltr" value={templateForm.sections} onChange={e => setTemplateForm({ ...templateForm, sections: e.target.value })} className="input-field font-mono text-xs" />
              </div>
              <label className="inline-flex items-center gap-2 text-sm text-neutral-700">
                <input type="checkbox" checked={templateForm.isActive} onChange={e => setTemplateForm({ ...templateForm, isActive: e.target.checked })} />
                قالب نشط
              </label>
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
                <button type="button" onClick={() => setShowTemplateModal(false)} className="btn-ghost btn-sm">إلغاء</button>
                <button type="submit" disabled={submitting} className="btn-primary btn-sm">{submitting ? 'جاري الحفظ...' : 'حفظ'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-neutral-200">
              <h2 className="text-lg font-bold text-neutral-900">{editingReport ? 'تعديل تقرير' : 'تقرير جديد'}</h2>
              <button onClick={() => setShowReportModal(false)} className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleReportSubmit} className="p-5 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">القالب</label>
                  <select required value={reportForm.templateId} onChange={e => setReportForm({ ...reportForm, templateId: e.target.value })} className="input-field">
                    <option value="">اختر القالب...</option>
                    {templates.filter(template => template.isActive || template.id === reportForm.templateId).map(template => (
                      <option key={template.id} value={template.id}>{template.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">الحالة</label>
                  <select value={reportForm.status} onChange={e => setReportForm({ ...reportForm, status: e.target.value })} className="input-field">
                    {Object.entries(STATUS_CONFIG).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">الجهة المرتبطة</label>
                  <select value={reportForm.targetType} onChange={e => setReportForm({ ...reportForm, targetType: e.target.value, targetId: '' })} className="input-field">
                    <option value="">عام</option>
                    <option value="platform">منصة</option>
                    <option value="program">برنامج</option>
                    <option value="project">مشروع</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">العنصر</label>
                  <select value={reportForm.targetId} onChange={e => setReportForm({ ...reportForm, targetId: e.target.value })} className="input-field" disabled={!reportForm.targetType}>
                    <option value="">اختر...</option>
                    {reportForm.targetType === 'platform' && platforms.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                    {reportForm.targetType === 'program' && programs.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                    {reportForm.targetType === 'project' && projects.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">رافع التقرير</label>
                  <input value={reportForm.submittedBy} onChange={e => setReportForm({ ...reportForm, submittedBy: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">المراجع</label>
                  <input value={reportForm.reviewedBy} onChange={e => setReportForm({ ...reportForm, reviewedBy: e.target.value })} className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">بيانات التقرير (JSON)</label>
                <textarea rows={5} dir="ltr" value={reportForm.data} onChange={e => setReportForm({ ...reportForm, data: e.target.value })} className="input-field font-mono text-xs" />
              </div>

              {/* HTML Content Editor */}
              <div className="border-t border-neutral-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-semibold text-neutral-700">محتوى HTML (تنسيق غني)</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setHtmlPreviewMode(!htmlPreviewMode)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        htmlPreviewMode
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      {htmlPreviewMode ? 'تعديل' : 'معاينة'}
                    </button>
                  </div>
                </div>

                {!htmlPreviewMode ? (
                  <>
                    {/* Toolbar */}
                    <div className="flex flex-wrap gap-1 mb-2 p-1.5 bg-neutral-50 rounded-lg border border-neutral-200">
                      {HTML_TOOLBAR_ITEMS.map(item => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => setHtmlContent(prev => prev + '\n' + item.snippet + '\n')}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-neutral-600 hover:bg-white hover:text-primary-700 hover:shadow-sm transition-all border border-transparent hover:border-neutral-200"
                          title={item.label}
                        >
                          <item.icon size={14} />
                          {item.label}
                        </button>
                      ))}
                    </div>
                    <textarea
                      rows={8}
                      dir="ltr"
                      value={htmlContent}
                      onChange={e => setHtmlContent(e.target.value)}
                      className="input-field font-mono text-xs leading-relaxed"
                      placeholder="<h2>عنوان القسم</h2>
<p>محتوى النص هنا...</p>

<table>
  <thead>
    <tr><th>العمود 1</th><th>العمود 2</th></tr>
  </thead>
  <tbody>
    <tr><td>بيان</td><td>بيان</td></tr>
  </tbody>
</table>"
                    />
                  </>
                ) : (
                  <div
                    className="report-html-content border border-neutral-200 rounded-xl bg-white p-4 min-h-[160px] text-sm leading-7"
                    dir="rtl"
                  >
                    {htmlContent.trim() ? (
                      <div dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(htmlContent) }} />
                    ) : (
                      <p className="text-neutral-400">لا يوجد محتوى HTML للإضافة</p>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">ملاحظات المراجعة</label>
                <textarea rows={2} value={reportForm.reviewNotes} onChange={e => setReportForm({ ...reportForm, reviewNotes: e.target.value })} className="input-field" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
                <button type="button" onClick={() => setShowReportModal(false)} className="btn-ghost btn-sm">إلغاء</button>
                <button type="submit" disabled={submitting} className="btn-primary btn-sm">{submitting ? 'جاري الحفظ...' : 'حفظ'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
