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
  History
} from 'lucide-react'

// ═══════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════

interface DocumentItem {
  id: string; title: string; type: string; typeLabel: string
  description: string | null; tags: string[]
  periodYear: number | null; periodMonth: number | null
  fileUrl: string; fileType: string | null; fileSize: number | null
  platformName: string | null; uploadedBy: string | null
  uploadedAt: string
  lastEditedBy: string | null; lastEditedAt: string | null
  status: string; versionsCount: number
}

interface VersionItem {
  id: string; version: number; fileUrl: string
  editedBy: string | null; editedAt: string
  changeNote: string | null
}

const DOC_TYPES: Record<string, string> = {
  REPORT: 'تقرير', BUDGET: 'ميزانية', MEETING_MINUTES: 'محضر اجتماع',
  WORK_PLAN: 'خطة عمل', ANNOUNCEMENT: 'إعلان', NEWSLETTER: 'نشرة', OTHER: 'أخرى',
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

  // Filters
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [yearFilter, setYearFilter] = useState('')

  // Upload/Edit
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<DocumentItem | null>(null)
  const [form, setForm] = useState({ title: '', type: 'OTHER', description: '', tags: '', fileUrl: '', periodYear: '', periodMonth: '' })
  const [submitting, setSubmitting] = useState(false)

  // Versions
  const [versions, setVersions] = useState<VersionItem[]>([])
  const [showVersions, setShowVersions] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null)

  const switchTab = (t: string) => router.push(`/ar/admin/documents${t === 'all' ? '' : `?tab=${t}`}`, { scroll: false })

  const fetchDocs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (typeFilter) params.set('type', typeFilter)
      if (yearFilter) params.set('year', yearFilter)
      params.set('limit', '200')

      const res = await fetch(`/api/admin/documents?${params}`)
      if (res.ok) {
        const json = await res.json()
        if (json.success) { setDocs(json.data); setTotal(json.total) }
      }
    } catch { /* fallback */ }
    finally { setLoading(false) }
  }, [search, typeFilter, yearFilter])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  const openCreate = () => {
    setEditing(null)
    setForm({ title: '', type: 'OTHER', description: '', tags: '', fileUrl: '', periodYear: '', periodMonth: '' })
    setShowModal(true)
  }

  const openEdit = (doc: DocumentItem) => {
    setEditing(doc)
    setForm({
      title: doc.title, type: doc.type, description: doc.description || '',
      tags: doc.tags.join(', '), fileUrl: doc.fileUrl,
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

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
          <Archive size={22} className="text-primary-600" /> الأرشيف والوثائق
        </h1>
        <div className="flex items-center gap-3">
          <Button unstyled onClick={() => switchTab('all')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === 'all' ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-600'}`}>
            كل الوثائق
          </Button>
          <Button unstyled onClick={() => switchTab('history')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === 'history' ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-600'}`}>
            سجل التعديلات
          </Button>
          <Button unstyled onClick={openCreate} className="btn-primary btn-sm flex items-center gap-1.5">
            <Upload size={14} /> رفع وثيقة
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative max-w-[240px]">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <Input placeholder="بحث في العنوان والوصف" value={search} onChange={e => setSearch(e.target.value)} className="input-field pr-9" />
          </div>
          <NativeSelect value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="input-field max-w-[150px]">
            <option value="">كل الأنواع</option>
            {Object.entries(DOC_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </NativeSelect>
          <NativeSelect value={yearFilter} onChange={e => setYearFilter(e.target.value)} className="input-field max-w-[120px]">
            <option value="">كل السنوات</option>
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </NativeSelect>
          <Button unstyled onClick={fetchDocs} className="btn-ghost btn-sm">تطبيق</Button>
          <span className="text-xs text-neutral-400 ml-auto">{total} وثيقة</span>
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
                  <TableHead className="text-right p-3 text-neutral-500">الرافع</TableHead>
                  <TableHead className="text-right p-3 text-neutral-500">تاريخ الرفع</TableHead>
                  <TableHead className="text-right p-3 text-neutral-500">آخر تعديل</TableHead>
                  <TableHead className="text-right p-3 text-neutral-500">الحجم</TableHead>
                  <TableHead className="text-center p-3 text-neutral-500">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docs.map(doc => (
                  <TableRow key={doc.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <TableCell className="p-3 font-semibold max-w-[200px] truncate">{doc.title}</TableCell>
                    <TableCell className="p-3"><span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600">{doc.typeLabel}</span></TableCell>
                    <TableCell className="p-3 text-xs">{doc.platformName || '—'}</TableCell>
                    <TableCell className="p-3 text-xs">{doc.uploadedBy || '—'}</TableCell>
                    <TableCell className="p-3 text-xs">{formatDate(doc.uploadedAt)}</TableCell>
                    <TableCell className="p-3 text-xs">{doc.lastEditedBy ? `${doc.lastEditedBy} · ${formatDate(doc.lastEditedAt)}` : '—'}</TableCell>
                    <TableCell className="p-3 text-xs font-mono">{formatSize(doc.fileSize)}</TableCell>
                    <TableCell className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 text-neutral-400 hover:text-primary-600" title="تحميل"><Download size={14} /></a>
                        <Button unstyled onClick={() => loadVersions(doc)} className="p-1.5 text-neutral-400 hover:text-primary-600" title="سجل التعديلات"><History size={14} /></Button>
                        <Button unstyled onClick={() => openEdit(doc)} className="p-1.5 text-neutral-400 hover:text-primary-600" title="تعديل"><Pencil size={14} /></Button>
                        {!isManager && <Button unstyled onClick={() => handleArchive(doc.id)} className="p-1.5 text-neutral-400 hover:text-red-600" title="أرشفة"><Trash2 size={14} /></Button>}
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

      {/* Upload / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-bold text-neutral-900">{editing ? 'تعديل وثيقة' : 'رفع وثيقة جديدة'}</h2>
              <Button unstyled onClick={() => setShowModal(false)} className="p-1.5 text-neutral-400 hover:text-neutral-600"><span className="text-xl">✕</span></Button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">العنوان *</label>
                <Input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input-field" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">النوع</label>
                  <NativeSelect value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="input-field">
                    {Object.entries(DOC_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </NativeSelect>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">الوسوم</label>
                  <Input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} className="input-field" placeholder="مفصولة بفواصل" />
                </div>
              </div>
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
                <label className="block text-sm font-semibold text-neutral-700 mb-1">رابط الملف *</label>
                <Input required value={form.fileUrl} onChange={e => setForm({ ...form, fileUrl: e.target.value })} className="input-field" placeholder="https://..." dir="ltr" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">وصف</label>
                <Textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input-field" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button unstyled type="button" onClick={() => setShowModal(false)} className="btn-ghost btn-sm">إلغاء</Button>
                <Button unstyled type="submit" disabled={submitting} className="btn-primary btn-sm">{submitting ? 'جاري...' : (editing ? 'تحديث' : 'رفع')}</Button>
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
