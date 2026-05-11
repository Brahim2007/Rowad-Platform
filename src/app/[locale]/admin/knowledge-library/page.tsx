'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Plus, Pencil, Trash2, X, Search, BookOpen, FileText, Video,
  FileSpreadsheet, Download, Eye, Globe, Tag, User, Hash,
  Image as ImageIcon, AudioLines, Link as LinkIcon, Presentation,
  CheckCircle, XCircle, Layers, BarChart3,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ───

interface KnowledgeItem {
  id: string
  title: string
  slug: string
  description: string | null
  content: string | null
  category: string
  type: string
  fileUrl: string | null
  thumbnailUrl: string | null
  tags: string | null
  author: string | null
  language: string
  viewCount: number
  downloadCount: number
  isPublished: boolean
  publishedAt: string | null
  createdAt: string
}

// ─── Constants ───

const CATEGORIES_CONFIG: Record<string, { label: string; color: string; barColor: string }> = {
  REPORT: { label: 'تقرير', color: 'bg-blue-100 text-blue-700', barColor: 'bg-blue-500' },
  RESEARCH: { label: 'بحث', color: 'bg-purple-100 text-purple-700', barColor: 'bg-purple-500' },
  MANUAL: { label: 'دليل', color: 'bg-green-100 text-green-700', barColor: 'bg-green-500' },
  TOOLKIT: { label: 'حقيبة أدوات', color: 'bg-orange-100 text-orange-700', barColor: 'bg-orange-500' },
  LESSON: { label: 'درس مستفاد', color: 'bg-amber-100 text-amber-700', barColor: 'bg-amber-500' },
  BEST_PRACTICE: { label: 'ممارسة مثلى', color: 'bg-teal-100 text-teal-700', barColor: 'bg-teal-500' },
  OTHER: { label: 'أخرى', color: 'bg-neutral-100 text-neutral-600', barColor: 'bg-neutral-400' },
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  DOCUMENT: FileText, VIDEO: Video, AUDIO: AudioLines,
  IMAGE: ImageIcon, PRESENTATION: Presentation,
  SPREADSHEET: FileSpreadsheet, LINK: LinkIcon, OTHER: FileText,
}

const TYPE_LABELS: Record<string, string> = {
  DOCUMENT: 'مستند', VIDEO: 'فيديو', AUDIO: 'صوتي', IMAGE: 'صورة',
  PRESENTATION: 'عرض تقديمي', SPREADSHEET: 'جدول بيانات', LINK: 'رابط', OTHER: 'أخرى',
}

const CATEGORY_LIST = ['REPORT', 'RESEARCH', 'MANUAL', 'TOOLKIT', 'LESSON', 'BEST_PRACTICE', 'OTHER']
const TYPE_LIST = ['DOCUMENT', 'VIDEO', 'AUDIO', 'IMAGE', 'PRESENTATION', 'SPREADSHEET', 'LINK', 'OTHER']

const emptyForm = {
  title: '', slug: '', description: '', category: '', type: '',
  author: '', language: 'ar', tags: '', fileUrl: '', content: '',
}

// ─── Badge Component ───

const Badge = ({ children, variant = 'primary', className = '' }: { children: React.ReactNode; variant?: string; className?: string }) => {
  const variants: Record<string, string> = {
    primary: 'bg-primary-100 text-primary-700',
    success: 'bg-success-50 text-success-700',
    warning: 'bg-warning-50 text-warning-700',
    neutral: 'bg-neutral-100 text-neutral-600',
    info: 'bg-info-50 text-info-700',
    error: 'bg-error-50 text-error-700',
    secondary: 'bg-secondary-100 text-secondary-700',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant] || variants.primary} ${className}`}>
      {children}
    </span>
  )
}

// ─── Main Page ───

export default function AdminKnowledgeLibraryPage() {
  const [items, setItems] = useState<KnowledgeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<KnowledgeItem | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')

  const fetchItems = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (filterCat) params.set('category', filterCat)
      const res = await fetch(`/api/admin/knowledge?${params}`)
      const data = await res.json()
      if (data.success) setItems(data.data || [])
    } catch { toast.error('فشل تحميل المكتبة') }
    finally { setLoading(false) }
  }, [search, filterCat])

  useEffect(() => { fetchItems() }, [fetchItems])

  // ─── Computed stats ───
  const totalCount = items.length
  const publishedCount = items.filter(i => i.isPublished).length
  const totalViews = items.reduce((s, i) => s + i.viewCount, 0)
  const totalDownloads = items.reduce((s, i) => s + i.downloadCount, 0)

  const categoryDistribution = CATEGORY_LIST.map(cat => ({
    category: cat,
    label: CATEGORIES_CONFIG[cat]?.label || cat,
    count: items.filter(i => i.category === cat).length,
  }))
  const maxCatCount = Math.max(...categoryDistribution.map(c => c.count), 1)

  // ─── Form handlers ───
  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowModal(true) }
  const openEdit = (k: KnowledgeItem) => {
    setEditing(k)
    setForm({
      title: k.title, slug: k.slug, description: k.description || '',
      category: k.category, type: k.type, author: k.author || '',
      language: k.language, tags: k.tags || '', fileUrl: k.fileUrl || '',
      content: k.content || '',
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const method = editing ? 'PUT' : 'POST'
      const body = editing ? { id: editing.id, ...form } : form
      const res = await fetch('/api/admin/knowledge', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (data.success) {
        toast.success(editing ? 'تم التحديث' : 'تمت الإضافة')
        setShowModal(false)
        fetchItems()
      } else toast.error(data.error || 'خطأ')
    } catch { toast.error('فشل الحفظ') }
    finally { setSubmitting(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return
    try {
      const res = await fetch(`/api/admin/knowledge?id=${id}`, { method: 'DELETE' })
      if ((await res.json()).success) { toast.success('تم الحذف'); fetchItems() }
    } catch { toast.error('فشل الحذف') }
  }

  const togglePublish = async (item: KnowledgeItem) => {
    try {
      const res = await fetch('/api/admin/knowledge', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, isPublished: !item.isPublished }),
      })
      if ((await res.json()).success) { toast.success(item.isPublished ? 'تم إلغاء النشر' : 'تم النشر'); fetchItems() }
    } catch { toast.error('فشل التحديث') }
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* ─── Header ─── */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-6 gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900 mb-2 flex items-center gap-3">
            <BookOpen className="text-primary-600" size={28} />
            المكتبة المعرفية
          </h1>
          <p className="text-neutral-500 max-w-2xl text-sm">
            أرشفة البيانات، المستندات، ومخرجات البرامج والمبادرات.
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary btn-sm flex items-center gap-2">
          <Plus size={18} />
          إضافة محتوى
        </button>
      </div>

      {/* ─── Stats Cards ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'إجمالي المحتوى', value: totalCount, icon: BookOpen, color: 'bg-primary-100 text-primary-600' },
          { label: 'منشور', value: publishedCount, icon: CheckCircle, color: 'bg-success-50 text-success-500' },
          { label: 'مشاهدات', value: totalViews, icon: Eye, color: 'bg-info-50 text-info-500' },
          { label: 'تحميلات', value: totalDownloads, icon: Download, color: 'bg-secondary-100 text-secondary-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card flex items-center gap-3 p-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}><Icon size={18} /></div>
            <div><div className="text-lg font-bold text-neutral-900">{value}</div><div className="text-xs text-neutral-500">{label}</div></div>
          </div>
        ))}
      </div>

      {/* ─── Category Distribution ─── */}
      <div className="card mb-6">
        <h3 className="text-sm font-bold text-neutral-900 mb-3 flex items-center gap-1.5">
          <Layers size={16} className="text-primary-600" />
          توزيع الفئات
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {categoryDistribution.map(({ category, label, count }) => {
            const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0
            const config = CATEGORIES_CONFIG[category]
            return (
              <div key={category} className={`p-2.5 rounded-xl border text-center ${config?.color || 'bg-neutral-100 text-neutral-600'} border-transparent`}>
                <div className="text-lg font-bold">{count}</div>
                <div className="text-[10px] font-medium opacity-75">{label}</div>
                <div className="text-[9px] opacity-60">{pct}%</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ─── Filters ─── */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input type="text" placeholder="بحث بالعنوان أو الوصف أو المؤلف..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pr-9 pl-3 py-2 text-sm" />
          </div>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="input-field min-w-[140px] text-sm py-2">
            <option value="">كل الفئات</option>
            {CATEGORY_LIST.map(c => (
              <option key={c} value={c}>{CATEGORIES_CONFIG[c]?.label || c}</option>
            ))}
          </select>
          <button onClick={() => { setSearch(''); setFilterCat('') }} className="btn-ghost btn-sm flex items-center gap-1.5 text-xs">
            <X size={14} />
            مسح
          </button>
        </div>
      </div>

      {/* ─── Content Grid ─── */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
            <p className="mt-3 text-sm text-neutral-400">جاري التحميل...</p>
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="py-12 text-center">
          <BookOpen size={36} className="text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-500 text-sm">المكتبة فارغة</p>
          <button onClick={openCreate} className="btn-primary btn-sm mt-3"><Plus size={16} /> إضافة محتوى</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => {
            const TypeIcon = TYPE_ICONS[item.type] || FileText
            const catConfig = CATEGORIES_CONFIG[item.category]
            const bgColor = catConfig?.color?.split(' ')[0] || 'bg-neutral-100'
            const textColor = catConfig?.color?.split(' ')[1] || 'text-neutral-500'

            return (
              <div key={item.id} className="card group relative overflow-hidden">
                {/* Top bar with icon */}
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bgColor} ${textColor}`}>
                    <TypeIcon size={20} />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => togglePublish(item)} className="p-1.5 text-neutral-400 hover:text-primary-600 rounded-lg hover:bg-primary-50" title={item.isPublished ? 'إلغاء النشر' : 'نشر'}>
                      {item.isPublished ? <XCircle size={14} /> : <CheckCircle size={14} />}
                    </button>
                    <button onClick={() => openEdit(item)} className="p-1.5 text-neutral-400 hover:text-primary-600 rounded-lg hover:bg-primary-50" title="تعديل">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 text-neutral-400 hover:text-error-600 rounded-lg hover:bg-error-50" title="حذف">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Title & Description */}
                <h3 className="font-semibold text-neutral-900 text-sm mb-1 line-clamp-2 leading-snug">{item.title}</h3>
                {item.description && (
                  <p className="text-xs text-neutral-500 line-clamp-2 mb-3 leading-relaxed">{item.description}</p>
                )}

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${catConfig?.color || 'bg-neutral-100 text-neutral-600'}`}>
                    {catConfig?.label || item.category}
                  </span>
                  <span className="text-[10px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <TypeIcon size={10} />
                    {TYPE_LABELS[item.type] || item.type}
                  </span>
                  {!item.isPublished && (
                    <span className="text-[10px] bg-warning-50 text-warning-600 px-2 py-0.5 rounded-full">مسودة</span>
                  )}
                  {item.language !== 'ar' && (
                    <span className="text-[10px] bg-info-50 text-info-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Globe size={10} /> {item.language}
                    </span>
                  )}
                </div>

                {/* Tags */}
                {item.tags && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {item.tags.split(',').slice(0, 3).map((tag, i) => (
                      <span key={i} className="text-[9px] text-neutral-400 bg-neutral-50 px-1.5 py-0.5 rounded">#{tag.trim()}</span>
                    ))}
                    {item.tags.split(',').length > 3 && (
                      <span className="text-[9px] text-neutral-400">+{item.tags.split(',').length - 3}</span>
                    )}
                  </div>
                )}

                {/* Footer stats */}
                <div className="flex items-center justify-between pt-3 border-t border-neutral-100 mt-auto">
                  <div className="flex items-center gap-3 text-[10px] text-neutral-400">
                    <span className="flex items-center gap-1"><Eye size={11} />{item.viewCount}</span>
                    <span className="flex items-center gap-1"><Download size={11} />{item.downloadCount}</span>
                  </div>
                  {item.author && (
                    <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                      <User size={10} /> {item.author.length > 12 ? item.author.slice(0, 12) + '..' : item.author}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ─── Modal ─── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-neutral-200 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                <BookOpen size={20} className="text-primary-600" />
                {editing ? 'تعديل المحتوى' : 'إضافة محتوى'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">العنوان <span className="text-error-500">*</span></label>
                  <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input-field" placeholder="عنوان المحتوى" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">الرابط المختصر <span className="text-error-500">*</span></label>
                  <div className="relative">
                    <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input required dir="ltr" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} className="input-field pl-8" placeholder="content-slug" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">المؤلف</label>
                  <div className="relative">
                    <User size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} className="input-field pr-9" placeholder="اسم المؤلف" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">الفئة <span className="text-error-500">*</span></label>
                  <select required value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input-field">
                    <option value="">اختر الفئة...</option>
                    {CATEGORY_LIST.map(c => <option key={c} value={c}>{CATEGORIES_CONFIG[c]?.label || c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">النوع <span className="text-error-500">*</span></label>
                  <select required value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="input-field">
                    <option value="">اختر النوع...</option>
                    {TYPE_LIST.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">اللغة</label>
                  <select value={form.language} onChange={e => setForm({ ...form, language: e.target.value })} className="input-field">
                    <option value="ar">العربية</option>
                    <option value="en">English</option>
                    <option value="fr">Français</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">الوصف</label>
                <textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input-field" placeholder="وصف مختصر للمحتوى" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">المحتوى الكامل</label>
                <textarea rows={4} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} className="input-field" placeholder="النص الكامل للمحتوى (اختياري)" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">رابط الملف</label>
                  <input dir="ltr" value={form.fileUrl} onChange={e => setForm({ ...form, fileUrl: e.target.value })} className="input-field" placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">الوسوم (مفصولة بفواصل)</label>
                  <div className="relative">
                    <Tag size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} className="input-field pr-9" placeholder="قيادة, تقنية, شباب" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
                <button type="button" onClick={() => setShowModal(false)} className="btn-ghost btn-sm">إلغاء</button>
                <button type="submit" disabled={submitting} className="btn-primary btn-sm">
                  {submitting ? 'جاري الحفظ...' : editing ? 'تحديث' : 'إضافة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
