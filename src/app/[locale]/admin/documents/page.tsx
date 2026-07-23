'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { NativeSelect } from '@/components/ui/native-select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

/**
 * الأرشيف والوثائق — Document Archive
 * تبويبات: كل الوثائق | رفع وثيقة | سجل التعديلات
 */

import { useEffect, useState, useCallback, type FormEvent } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import {
  FileText, Upload, Search, Archive, Download, Trash2, Pencil,
  History, Building2, WalletCards, Gavel, BookOpen, FolderOpen,
} from 'lucide-react'

// ═══════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════

interface DocumentItem {
  id: string; title: string; type: string; typeLabel: string
  description: string | null; content: string | null; tags: string[]; source: string
  periodYear: number | null; periodMonth: number | null
  fileUrl: string | null; fileType: string | null; fileSize: number | null
  platformId: string | null; platformName: string | null; uploadedBy: string | null
  uploadedAt: string
  lastEditedBy: string | null; lastEditedAt: string | null
  status: string; versionsCount: number
}

interface PlatformOption {
  id: string
  name: string
}

interface VersionItem {
  id: string; version: number; fileUrl: string
  editedBy: string | null; editedAt: string
  changeNote: string | null
}

const DOC_TYPES: Record<string, string> = {
  REPORT: 'تقرير', BUDGET: 'ميزانية', MEETING_MINUTES: 'محضر اجتماع',
  FINANCIAL_STATEMENT: 'بيان مالي', DECISION: 'قرار', POLICY: 'سياسة أو لائحة',
  CONTRACT: 'عقد أو اتفاقية', WORK_PLAN: 'خطة عمل', RESEARCH: 'بحث أو دراسة',
  MANUAL: 'دليل', TOOLKIT: 'حقيبة أدوات', LESSON_LEARNED: 'درس مستفاد',
  BEST_PRACTICE: 'ممارسة مثلى', PRESENTATION: 'عرض تقديمي',
  CORRESPONDENCE: 'مراسلة رسمية', MEDIA: 'مادة مرئية أو مسموعة',
  ANNOUNCEMENT: 'إعلان', NEWSLETTER: 'نشرة', OTHER: 'أخرى',
}

const MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']

function formatSize(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ar', { year: 'numeric', month: 'short', day: 'numeric' })
}

// ═══════════════════════════════════════════════
export default function DocumentsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') || 'all'

  const userRole = (session?.user as { role?: string } | undefined)?.role || 'EDITOR'
  const isManager = userRole === 'PLATFORM_MANAGER'

  const [docs, setDocs] = useState<DocumentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [platforms, setPlatforms] = useState<PlatformOption[]>([])

  // Filters
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  const [platformFilter, setPlatformFilter] = useState('')

  // Upload/Edit
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<DocumentItem | null>(null)
  const [form, setForm] = useState({ title: '', type: 'REPORT', description: '', content: '', tags: '', fileUrl: '', platformId: '', periodYear: '', periodMonth: '' })
  const [submitting, setSubmitting] = useState(false)

  // Versions
  const [versions, setVersions] = useState<VersionItem[]>([])
  const [showVersions, setShowVersions] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null)

  const switchTab = (t: string) => {
    setPage(1)
    router.push(`/ar/admin/documents${t === 'all' ? '' : `?tab=${t}`}`, { scroll: false })
  }

  const fetchDocs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (typeFilter) params.set('type', typeFilter)
      if (yearFilter) params.set('year', yearFilter)
      if (platformFilter) params.set('platformId', platformFilter)
      if (tab === 'knowledge') params.set('group', 'knowledge')
      if (tab === 'archived') params.set('status', 'ARCHIVED')
      params.set('limit', '25')
      params.set('page', String(page))

      const res = await fetch(`/api/admin/documents?${params}`)
      if (res.ok) {
        const json = await res.json()
        if (json.success) {
          setDocs(json.data)
          setTotal(json.total)
          setTotalPages(json.pagination?.totalPages || 1)
        }
      }
    } catch { /* fallback */ }
    finally { setLoading(false) }
  }, [page, platformFilter, search, tab, typeFilter, yearFilter])

  useEffect(() => { fetchDocs() }, [fetchDocs])
  useEffect(() => {
    fetch('/api/admin/platforms?compact=1')
      .then(response => response.json())
      .then(result => {
        if (result.success) setPlatforms(result.data?.platforms || [])
      })
      .catch(() => {})
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ title: '', type: 'REPORT', description: '', content: '', tags: '', fileUrl: '', platformId: '', periodYear: '', periodMonth: '' })
    setShowModal(true)
  }

  const openEdit = (doc: DocumentItem) => {
    setEditing(doc)
    setForm({
      title: doc.title, type: doc.type, description: doc.description || '', content: doc.content || '',
      tags: doc.tags.join(', '), fileUrl: doc.fileUrl || '',
      platformId: doc.platformId || '',
      periodYear: doc.periodYear ? String(doc.periodYear) : '',
      periodMonth: doc.periodMonth ? String(doc.periodMonth) : '',
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const body = {
        ...form,
        id: editing?.id,
        periodYear: form.periodYear ? Number(form.periodYear) : null,
        periodMonth: form.periodMonth ? Number(form.periodMonth) : null,
      }
      const res = await fetch('/api/admin/documents', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.success) { toast.success(editing ? 'تم التحديث' : 'تمت إضافة الوثيقة'); setShowModal(false); fetchDocs() }
      else toast.error(data.message || 'فشل')
    } catch { toast.error('فشل') }
    finally { setSubmitting(false) }
  }

  const handleArchive = async (id: string) => {
    if (!confirm('أرشفة هذه الوثيقة؟ (لن تُحذف نهائياً)')) return
    try {
      const res = await fetch(`/api/admin/documents?id=${id}`, { method: 'DELETE' })
      if ((await res.json()).success) { toast.success('تمت الأرشفة'); fetchDocs() }
    } catch { toast.error('فشل') }
  }

  const loadVersions = async (doc: DocumentItem) => {
    setSelectedDoc(doc)
    try {
      const res = await fetch(`/api/admin/documents/${doc.id}/versions`)
      if (res.ok) {
        const json = await res.json()
        if (json.success) setVersions(json.data)
      }
    } catch { /* fallback */ }
    setShowVersions(true)
  }

  const financialCount = docs.filter(doc => ['BUDGET', 'FINANCIAL_STATEMENT'].includes(doc.type)).length
  const governanceCount = docs.filter(doc => ['DECISION', 'MEETING_MINUTES', 'POLICY', 'CONTRACT'].includes(doc.type)).length
  const knowledgeCount = docs.filter(doc => doc.source === 'KNOWLEDGE_LIBRARY' || ['RESEARCH', 'MANUAL', 'TOOLKIT', 'LESSON_LEARNED', 'BEST_PRACTICE'].includes(doc.type)).length
  const coveredPlatforms = new Set(docs.map(doc => doc.platformId).filter(Boolean)).size

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <section className="relative mb-5 overflow-hidden rounded-3xl bg-gradient-to-l from-neutral-950 via-primary-900 to-primary-700 p-6 text-white shadow-lg md:p-8">
        <div className="absolute -start-20 -top-24 size-56 rounded-full bg-white/10" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold">
              <Archive size={15} /> المستودع الرسمي للشبكة
            </div>
            <h1 className="text-2xl font-black md:text-3xl">الأرشيف المؤسسي ومركز المعرفة</h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-primary-50">
              المرجع المركزي لكل ما يصدر عن المنصات: التقارير، الميزانيات، القرارات، محاضر الاجتماعات، الخطط، المراسلات، الأدلة والدروس المستفادة.
            </p>
          </div>
          <Button unstyled onClick={openCreate} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-primary-800 shadow-sm transition hover:bg-primary-50">
            <Upload size={17} /> إضافة سجل للأرشيف
          </Button>
        </div>
      </section>

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          { label: 'إجمالي السجلات', value: total, icon: FolderOpen, color: 'bg-primary-100 text-primary-700' },
          { label: 'مالية في الصفحة', value: financialCount, icon: WalletCards, color: 'bg-emerald-100 text-emerald-700' },
          { label: 'قرارات في الصفحة', value: governanceCount, icon: Gavel, color: 'bg-amber-100 text-amber-700' },
          { label: 'معرفة في الصفحة', value: knowledgeCount, icon: BookOpen, color: 'bg-violet-100 text-violet-700' },
          { label: 'منصات في الصفحة', value: coveredPlatforms, icon: Building2, color: 'bg-cyan-100 text-cyan-700' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-4">
            <div className={`mb-3 flex size-9 items-center justify-center rounded-xl ${color}`}><Icon size={17} /></div>
            <div className="text-xl font-black text-neutral-900">{value}</div>
            <div className="mt-1 text-xs text-neutral-500">{label}</div>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {[
          { id: 'all', label: 'كل السجلات' },
          { id: 'knowledge', label: 'المعرفة والأدلة' },
          { id: 'archived', label: 'المؤرشف' },
          { id: 'history', label: 'سجل النسخ' },
        ].map(item => (
          <Button unstyled key={item.id} onClick={() => switchTab(item.id)} className={`rounded-xl px-4 py-2 text-sm font-bold transition ${tab === item.id ? 'bg-primary-600 text-white shadow-sm' : 'bg-white text-neutral-600 hover:bg-neutral-100'}`}>
            {item.label}
          </Button>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <Input aria-label="بحث في الأرشيف" placeholder="بحث في العنوان أو الوصف أو الوسوم..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} className="input-field pr-9" />
          </div>
          <NativeSelect aria-label="نوع السجل" value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1) }} className="input-field max-w-[190px]">
            <option value="">كل الأنواع</option>
            {Object.entries(DOC_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </NativeSelect>
          {!isManager && (
            <NativeSelect aria-label="منصة السجل" value={platformFilter} onChange={e => { setPlatformFilter(e.target.value); setPage(1) }} className="input-field max-w-[220px]">
              <option value="">كل المنصات</option>
              {platforms.map(platform => <option key={platform.id} value={platform.id}>{platform.name}</option>)}
            </NativeSelect>
          )}
          <NativeSelect aria-label="سنة السجل" value={yearFilter} onChange={e => { setYearFilter(e.target.value); setPage(1) }} className="input-field max-w-[130px]">
            <option value="">كل السنوات</option>
            {Array.from({ length: 8 }, (_, index) => new Date().getFullYear() + 1 - index).map(y => <option key={y} value={y}>{y}</option>)}
          </NativeSelect>
          <Button unstyled onClick={() => { setSearch(''); setTypeFilter(''); setYearFilter(''); setPlatformFilter(''); setPage(1) }} className="btn-ghost btn-sm">مسح الفلاتر</Button>
          <span className="text-xs text-neutral-400">{total} سجل</span>
        </div>
      </div>

      {/* Documents Table */}
      <div className="card">
        {loading ? (
          <div className="text-center py-12"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" /></div>
        ) : docs.length > 0 ? (
          <div className="overflow-x-auto">
            <Table className="w-full text-sm">
              <TableHeader>
                <TableRow className="border-b border-neutral-200">
                  <TableHead className="text-right p-3 text-neutral-500">العنوان</TableHead>
                  <TableHead className="text-right p-3 text-neutral-500">النوع</TableHead>
                  <TableHead className="text-right p-3 text-neutral-500">المنصة</TableHead>
                  <TableHead className="text-right p-3 text-neutral-500">الفترة</TableHead>
                  <TableHead className="text-right p-3 text-neutral-500">المصدر</TableHead>
                  <TableHead className="text-right p-3 text-neutral-500">تاريخ الحفظ</TableHead>
                  <TableHead className="text-right p-3 text-neutral-500">الحالة</TableHead>
                  <TableHead className="text-center p-3 text-neutral-500">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docs.map(doc => (
                  <TableRow key={doc.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <TableCell className="p-3 max-w-[260px]">
                      <div className="truncate font-semibold text-neutral-900">{doc.title}</div>
                      <div className="mt-1 truncate text-[11px] text-neutral-400">{doc.description || doc.content || doc.tags.join(' · ') || 'دون وصف'}</div>
                    </TableCell>
                    <TableCell className="p-3"><span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600">{doc.typeLabel}</span></TableCell>
                    <TableCell className="p-3 text-xs">{doc.platformName || '—'}</TableCell>
                    <TableCell className="p-3 text-xs">{doc.periodYear ? `${doc.periodMonth ? `${MONTHS[doc.periodMonth - 1]} ` : ''}${doc.periodYear}` : '—'}</TableCell>
                    <TableCell className="p-3 text-xs">
                      <span className={`rounded-full px-2 py-1 ${doc.source === 'KNOWLEDGE_LIBRARY' ? 'bg-violet-50 text-violet-700' : doc.source === 'AI_GENERATED_REPORT' ? 'bg-cyan-50 text-cyan-700' : 'bg-primary-50 text-primary-700'}`}>
                        {doc.source === 'KNOWLEDGE_LIBRARY' ? 'المكتبة السابقة' : doc.source === 'AI_GENERATED_REPORT' ? 'تقرير ذكي' : doc.source === 'SUBMITTED_REPORT' ? 'نظام التقارير' : 'مخرج منصة'}
                      </span>
                    </TableCell>
                    <TableCell className="p-3 text-xs">{formatDate(doc.uploadedAt)}</TableCell>
                    <TableCell className="p-3 text-xs">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${doc.status === 'ARCHIVED' ? 'bg-neutral-100 text-neutral-600' : doc.status === 'DRAFT' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                        {doc.status === 'ARCHIVED' ? 'مؤرشف' : doc.status === 'DRAFT' ? 'مسودة' : 'معتمد'}
                      </span>
                    </TableCell>
                    <TableCell className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {doc.fileUrl && <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 text-neutral-400 hover:text-primary-600" title={`فتح الملف · ${formatSize(doc.fileSize)}`}><Download size={14} /></a>}
                        {doc.versionsCount > 0 && <Button unstyled onClick={() => loadVersions(doc)} className="p-1.5 text-neutral-400 hover:text-primary-600" title="سجل النسخ"><History size={14} /></Button>}
                        <Button unstyled onClick={() => openEdit(doc)} className="p-1.5 text-neutral-400 hover:text-primary-600" title="تعديل"><Pencil size={14} /></Button>
                        {!isManager && doc.status !== 'ARCHIVED' && <Button unstyled onClick={() => handleArchive(doc.id)} className="p-1.5 text-neutral-400 hover:text-red-600" title="أرشفة"><Trash2 size={14} /></Button>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-center py-12 text-neutral-400"><FileText size={36} className="mx-auto mb-3 text-neutral-300" />لا توجد وثائق</p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white p-3">
          <span className="text-xs text-neutral-500">صفحة {page} من {totalPages} · {total} سجل</span>
          <div className="flex items-center gap-2">
            <Button unstyled type="button" disabled={page <= 1 || loading} onClick={() => setPage(current => Math.max(current - 1, 1))} className="btn-ghost btn-sm disabled:opacity-40">السابق</Button>
            <Button unstyled type="button" disabled={page >= totalPages || loading} onClick={() => setPage(current => Math.min(current + 1, totalPages))} className="btn-ghost btn-sm disabled:opacity-40">التالي</Button>
          </div>
        </div>
      )}

      {/* Upload / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-bold text-neutral-900">{editing ? 'تعديل سجل الأرشيف' : 'إضافة سجل للأرشيف المؤسسي'}</h2>
              <Button unstyled onClick={() => setShowModal(false)} className="p-1.5 text-neutral-400 hover:text-neutral-600"><span className="text-xl">✕</span></Button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">العنوان *</label>
                <Input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input-field" />
              </div>
              <div className="rounded-xl border border-primary-100 bg-primary-50 p-3 text-xs leading-6 text-primary-800">
                اختر نوع المخرج والمنصة والفترة بدقة حتى تتمكن الإدارة من الرجوع إليه وإعداد تقارير اكتمال الأرشفة لكل منصة.
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">نوع المخرج *</label>
                  <NativeSelect value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="input-field">
                    {Object.entries(DOC_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </NativeSelect>
                </div>
                {!isManager ? (
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1">المنصة التابعة *</label>
                    <NativeSelect required value={form.platformId} onChange={e => setForm({ ...form, platformId: e.target.value })} className="input-field">
                      <option value="">اختر المنصة</option>
                      {platforms.map(platform => <option key={platform.id} value={platform.id}>{platform.name}</option>)}
                    </NativeSelect>
                  </div>
                ) : (
                  <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">الوسوم</label>
                  <Input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} className="input-field" placeholder="مفصولة بفواصل" />
                  </div>
                )}
              </div>
              {!isManager && (
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">الوسوم</label>
                  <Input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} className="input-field" placeholder="مثال: الربع الثاني، مجلس الإدارة، اعتماد" />
                </div>
              )}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">السنة</label>
                  <Input type="number" value={form.periodYear} onChange={e => setForm({ ...form, periodYear: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">الشهر</label>
                  <NativeSelect value={form.periodMonth} onChange={e => setForm({ ...form, periodMonth: e.target.value })} className="input-field">
                    <option value="">—</option>
                    {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                  </NativeSelect>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">رابط الملف</label>
                <Input value={form.fileUrl} onChange={e => setForm({ ...form, fileUrl: e.target.value })} className="input-field" placeholder="https://... (PDF أو Word أو Excel أو رابط تخزين)" dir="ltr" />
                <p className="mt-1 text-[11px] text-neutral-400">يمكن حفظ قرار أو محضر نصي دون ملف بإدخال النص أدناه.</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">وصف مختصر</label>
                <Textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">نص السجل أو الملخص</label>
                <Textarea rows={5} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} className="input-field" placeholder="نص القرار، خلاصة محضر الاجتماع، ملخص التقرير، أو وصف المادة المعرفية..." />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button unstyled type="button" onClick={() => setShowModal(false)} className="btn-ghost btn-sm">إلغاء</Button>
                <Button unstyled type="submit" disabled={submitting} className="btn-primary btn-sm">{submitting ? 'جاري...' : (editing ? 'تحديث السجل' : 'حفظ في الأرشيف')}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Versions Modal */}
      {showVersions && selectedDoc && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-bold text-neutral-900">سجل التعديلات — {selectedDoc.title}</h2>
              <Button unstyled onClick={() => setShowVersions(false)} className="p-1.5 text-neutral-400 hover:text-neutral-600"><span className="text-xl">✕</span></Button>
            </div>
            <div className="p-5">
              {versions.length > 0 ? (
                <div className="space-y-3">
                  {versions.map((v, i) => (
                    <div key={v.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm">v{v.version} {i === versions.length - 1 && <span className="text-xs text-green-600">(حالي)</span>}</span>
                        <span className="text-xs text-neutral-400">{formatDate(v.editedAt)}</span>
                      </div>
                      <p className="text-xs text-neutral-500">بواسطة: {v.editedBy || '—'}</p>
                      {v.changeNote && <p className="text-xs text-neutral-500 mt-1">📝 {v.changeNote}</p>}
                      <a href={v.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 hover:underline mt-1 inline-block">تحميل هذه النسخة</a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-6 text-neutral-400">لا توجد نسخ سابقة</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
