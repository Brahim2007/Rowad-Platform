import { CheckCircle, Clock, FileText, XCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { sanitizeRichHtml } from '@/lib/sanitize-html'

export interface ReportDocumentTemplate {
  title: string
  description?: string | null
  category?: string | null
  sections?: string | null
}

export interface ReportDocumentData {
  id: string
  data: string
  status: string
  submittedBy: string | null
  reviewedBy: string | null
  reviewNotes: string | null
  submittedAt: string | null
  reviewedAt?: string | null
  createdAt: string
  template?: ReportDocumentTemplate | null
  platform?: { id?: string; name: string } | null
  program?: { id?: string; name: string } | null
  project?: { id?: string; title: string } | null
}

interface TemplateSection {
  title?: string
  label?: string
  key?: string
  name?: string
  type?: string
}

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: typeof FileText }> = {
  DRAFT: { label: 'مسودة', className: 'text-neutral-600 bg-neutral-100', icon: FileText },
  SUBMITTED: { label: 'مرفوع', className: 'text-info-700 bg-info-50', icon: Clock },
  REVIEWED: { label: 'مراجع', className: 'text-warning-700 bg-warning-50', icon: Clock },
  APPROVED: { label: 'معتمد', className: 'text-success-700 bg-success-50', icon: CheckCircle },
  REJECTED: { label: 'مرفوض', className: 'text-error-700 bg-error-50', icon: XCircle },
}

const CATEGORY_LABELS: Record<string, string> = {
  PERFORMANCE: 'أداء',
  IMPACT: 'أثر',
  FINANCIAL: 'مالي',
  PROGRESS: 'تقدم',
  EVALUATION: 'تقييم',
  OTHER: 'أخرى',
}

function parseJson(value?: string | null) {
  if (!value) return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function formatDate(value?: string | null) {
  if (!value) return 'غير محدد'
  return new Date(value).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function targetLabel(report: ReportDocumentData) {
  if (report.platform?.name) return `منصة: ${report.platform.name}`
  if (report.program?.name) return `برنامج: ${report.program.name}`
  if (report.project?.title) return `مشروع: ${report.project.title}`
  return 'عام'
}

function valueIsEmpty(value: unknown) {
  return value === null || value === undefined || value === ''
}

/** Detect if a string contains HTML tags */
function isHtmlString(value: string): boolean {
  if (value.length < 3) return false
  return /<[a-z][\s\S]*>/i.test(value)
}

function renderValue(value: unknown): ReactNode {
  if (valueIsEmpty(value)) return <span className="text-neutral-400">لا توجد بيانات</span>

  // Render HTML content safely
  if (typeof value === 'string' && isHtmlString(value)) {
    return (
      <div
        className="report-html-content text-neutral-700"
        dir="rtl"
        dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(value) }}
      />
    )
  }

  if (Array.isArray(value)) {
    return (
      <ul className="report-list space-y-1.5">
        {value.map((item, index) => (
          <li key={index}>{typeof item === 'object' ? renderValue(item) : String(item)}</li>
        ))}
      </ul>
    )
  }

  if (typeof value === 'object') {
    return (
      <div className="report-nested space-y-2">
        {Object.entries(value as Record<string, unknown>).map(([key, item]) => (
          <div key={key} className="report-nested-row">
            <span className="report-nested-key">{key}</span>
            <span className="report-nested-value">{renderValue(item)}</span>
          </div>
        ))}
      </div>
    )
  }

  const str = String(value)
  if (isHtmlString(str)) {
    return (
      <div
        className="report-html-content text-neutral-700"
        dir="rtl"
        dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(str) }}
      />
    )
  }

  return <span className="whitespace-pre-wrap">{str}</span>
}

function reportEntries(report: ReportDocumentData) {
  const data = parseJson(report.data)
  const sections = parseJson(report.template?.sections) as TemplateSection[] | null

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return [{ label: 'محتوى التقرير', value: data || report.data }]
  }

  const dataRecord = data as Record<string, unknown>
  const usedKeys = new Set<string>()
  const ordered: { label: string; value: unknown }[] = []

  if (Array.isArray(sections)) {
    sections.forEach(section => {
      const candidates = [section.key, section.name, section.title, section.label].filter(Boolean) as string[]
      const matchedKey = candidates.find(key => Object.prototype.hasOwnProperty.call(dataRecord, key))
      const label = section.title || section.label || section.name || section.key
      if (matchedKey && label) {
        usedKeys.add(matchedKey)
        ordered.push({ label, value: dataRecord[matchedKey] })
      }
    })
  }

  Object.entries(dataRecord).forEach(([key, value]) => {
    if (!usedKeys.has(key)) ordered.push({ label: key, value })
  })

  return ordered
}

export function reportFileName(report: ReportDocumentData) {
  const title = report.template?.title || 'report'
  const safeTitle = title.replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '-')
  return `${safeTitle}-${report.id.slice(0, 8)}.pdf`
}

export function ReportDocument({ report }: { report: ReportDocumentData }) {
  const status = STATUS_CONFIG[report.status] || STATUS_CONFIG.DRAFT
  const StatusIcon = status.icon
  const category = report.template?.category ? CATEGORY_LABELS[report.template.category] || report.template.category : 'غير مصنف'
  const entries = reportEntries(report)

  return (
    <article className="report-paper bg-white text-neutral-900" dir="rtl" data-report-document>
      <header className="report-header border-b border-neutral-200 pb-6 mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="report-brand text-sm font-semibold text-primary-700 mb-2">شبكة الرواد</p>
            <h1 className="report-title text-2xl font-bold text-neutral-950 leading-tight">
              {report.template?.title || 'تقرير'}
            </h1>
            {report.template?.description && (
              <p className="report-description text-sm text-neutral-500 mt-2 max-w-2xl">
                {report.template.description}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={`report-status inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${status.className}`}>
              <StatusIcon size={13} />
              {status.label}
            </span>
            <span className="report-category inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-700">
              {category}
            </span>
          </div>
        </div>
      </header>

      <section className="report-meta grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {[
          ['النطاق', targetLabel(report)],
          ['رافع التقرير', report.submittedBy || 'غير محدد'],
          ['تاريخ الرفع', formatDate(report.submittedAt)],
          ['تاريخ الإنشاء', formatDate(report.createdAt)],
          ['المراجع', report.reviewedBy || 'غير محدد'],
          ['تاريخ المراجعة', formatDate(report.reviewedAt)],
        ].map(([label, value]) => (
          <div key={label} className="report-meta-item rounded-xl border border-neutral-200 bg-neutral-50 p-3">
            <div className="report-meta-label text-[11px] font-semibold text-neutral-400 mb-1">{label}</div>
            <div className="report-meta-value text-sm font-semibold text-neutral-900">{value}</div>
          </div>
        ))}
      </section>

      <section className="report-sections space-y-4">
        {entries.map(({ label, value }, index) => (
          <section key={`${label}-${index}`} className="report-section rounded-xl border border-neutral-200 p-4 break-inside-avoid">
            <h2 className="report-section-title text-sm font-bold text-neutral-950 mb-3">{label}</h2>
            <div className="report-section-body text-sm leading-7 text-neutral-700">
              {renderValue(value)}
            </div>
          </section>
        ))}
      </section>

      {report.reviewNotes && (
        <section className="report-review rounded-xl border border-warning-200 bg-warning-50 p-4 mt-6 break-inside-avoid">
          <h2 className="text-sm font-bold text-neutral-950 mb-2">ملاحظات المراجعة</h2>
          <p className="text-sm leading-7 text-neutral-700 whitespace-pre-wrap">{report.reviewNotes}</p>
        </section>
      )}

      <footer className="report-footer mt-8 pt-4 border-t border-neutral-200 text-[11px] text-neutral-400 flex flex-wrap justify-between gap-2">
        <span>معرف التقرير: {report.id}</span>
        <span>تم توليد العرض من نظام شبكة الرواد</span>
      </footer>
    </article>
  )
}
