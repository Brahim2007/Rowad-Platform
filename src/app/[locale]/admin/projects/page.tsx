'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { NativeSelect } from '@/components/ui/native-select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

import { useEffect, useState, useCallback } from 'react'
import {
  Plus, Pencil, Trash2, X, FolderKanban, FolderOpen,
  CheckCircle, Clock, Target, Star, Image as ImageIcon,
  FileText, ExternalLink, Hash,
  BookOpen, BarChart3, Layers,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ───

interface PlatformInfo {
  id: string
  name: string
  slug: string
  color: string | null
}

interface ProgramInfo {
  id: string
  name: string
  slug: string
}

interface Project {
  id: string
  title: string
  slug: string
  description: string
  category: string
  status: string
  isFeatured: boolean
  sortOrder: number
  coverImage: string | null
  platform: PlatformInfo | null
  program: ProgramInfo | null
  _count: {
    knowledgeItems: number
    submittedReports: number
    evaluations: number
  }
}

// ─── Constants ───

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  ACTIVE: { label: 'نشط', color: 'bg-success-50 text-success-700', icon: CheckCircle },
  COMPLETED: { label: 'مكتمل', color: 'bg-primary-100 text-primary-700', icon: CheckCircle },
  ON_HOLD: { label: 'معلق', color: 'bg-warning-50 text-warning-700', icon: Clock },
  PLANNING: { label: 'تخطيط', color: 'bg-info-50 text-info-700', icon: Target },
}

const STATUS_ORDER = ['ACTIVE', 'COMPLETED', 'ON_HOLD', 'PLANNING']

const CATEGORY_LABELS: Record<string, string> = {
  تقنية: 'تقنية', تعليم: 'تعليم', ثقافة: 'ثقافة', فعاليات: 'فعاليات', إعلام: 'إعلام', ريادة: 'ريادة',
}

const CATEGORY_COLORS: Record<string, string> = {
  تقنية: 'bg-blue-100 text-blue-700',
  تعليم: 'bg-green-100 text-green-700',
  ثقافة: 'bg-purple-100 text-purple-700',
  فعاليات: 'bg-orange-100 text-orange-700',
  إعلام: 'bg-rose-100 text-rose-700',
  ريادة: 'bg-amber-100 text-amber-700',
}

const emptyForm = {
  title: '', slug: '', description: '', fullContent: '', category: '',
  status: 'ACTIVE', coverImage: '', startDate: '', endDate: '',
  partnerLogos: '', isFeatured: false, sortOrder: 0,
  platformId: '', programId: '',
}

// ─── Main Page ───

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  // For modal dropdowns
  const [platforms, setPlatforms] = useState<PlatformInfo[]>([])
  const [programs, setPrograms] = useState<ProgramInfo[]>([])

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/projects?limit=50')
      const data = await res.json()
      if (data.success) setProjects(data.data.projects)
    } catch { toast.error('فشل تحميل المشاريع') }
    finally { setLoading(false) }
  }, [])

  const fetchPlatformsAndPrograms = useCallback(async () => {
    try {
      const [plRes, prRes] = await Promise.all([
        fetch('/api/admin/platforms?limit=50'),
        fetch('/api/admin/programs?limit=50'),
      ])
      const plData = await plRes.json()
      const prData = await prRes.json()
      if (plData.success) setPlatforms(plData.data?.platforms || [])
      if (prData.success) setPrograms(prData.data?.programs || [])
    } catch { /* silently fail */ }
  }, [])

  useEffect(() => { fetchProjects(); fetchPlatformsAndPrograms() }, [fetchProjects, fetchPlatformsAndPrograms])

  // ─── Computed stats ───
  const totalCount = projects.length
  const activeCount = projects.filter(p => p.status === 'ACTIVE').length
  const completedCount = projects.filter(p => p.status === 'COMPLETED').length
  const featuredCount = projects.filter(p => p.isFeatured).length

  const categoryDistribution = Object.keys(CATEGORY_LABELS).map(cat => ({
    category: cat,
    count: projects.filter(p => p.category === cat).length,
  }))
  const maxCatCount = Math.max(...categoryDistribution.map(c => c.count), 1)

  const statusDistribution = STATUS_ORDER.map(st => ({
    status: st,
    label: STATUS_CONFIG[st]?.label || st,
    count: projects.filter(p => p.status === st).length,
  }))

  // ─── Form handlers ───
  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (p: Project) => {
    setEditing(p)
    setForm({
      title: p.title,
      slug: p.slug,
      description: p.description,
      fullContent: '',
      category: p.category,
      status: p.status,
      coverImage: p.coverImage || '',
      startDate: '',
      endDate: '',
      partnerLogos: '',
      isFeatured: p.isFeatured,
      sortOrder: p.sortOrder,
      platformId: p.platform?.id || '',
      programId: p.program?.id || '',
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const method = editing ? 'PUT' : 'POST'
      const body = editing ? { id: editing.id, ...form } : form
      const res = await fetch('/api/admin/projects', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(editing ? 'تم تحديث المشروع' : 'تم إضافة المشروع')
        setShowModal(false)
        fetchProjects()
      } else {
        toast.error(data.message || data.errors ? 'تحقق من الحقول' : 'حدث خطأ')
      }
    } catch {
      toast.error('فشل الحفظ')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المشروع؟')) return
    try {
      const res = await fetch(`/api/admin/projects?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('تم حذف المشروع')
        fetchProjects()
      } else {
        toast.error(data.message || 'فشل الحذف')
      }
    } catch {
      toast.error('فشل الاتصال')
    }
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* ─── Header ─── */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-6 gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900 mb-2 flex items-center gap-3">
            <FolderKanban className="text-primary-600" size={28} />
            إدارة المشاريع
          </h1>
          <p className="text-neutral-500 max-w-2xl text-sm">
            إدارة المشاريع، تصنيفها، وربطها بالمنصات والبرامج.
          </p>
        </div>
        <Button unstyled onClick={openCreate} className="btn-primary btn-sm flex items-center gap-2">
          <Plus size={18} />
          مشروع جديد
        </Button>
      </div>

      {/* ─── Stats Cards ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'إجمالي المشاريع', value: totalCount, icon: FolderKanban, color: 'bg-primary-100 text-primary-600' },
          { label: 'نشطة', value: activeCount, icon: CheckCircle, color: 'bg-success-50 text-success-500' },
          { label: 'مكتملة', value: completedCount, icon: CheckCircle, color: 'bg-info-50 text-info-500' },
          { label: 'مميزة', value: featuredCount, icon: Star, color: 'bg-secondary-100 text-secondary-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card flex items-center gap-3 p-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}><Icon size={18} /></div>
            <div><div className="text-lg font-bold text-neutral-900">{value}</div><div className="text-xs text-neutral-500">{label}</div></div>
          </div>
        ))}
      </div>

      {/* ─── Category & Status Distribution ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Category distribution */}
        <div className="card">
          <h3 className="text-sm font-bold text-neutral-900 mb-3 flex items-center gap-1.5">
            <Layers size={16} className="text-primary-600" />
            توزيع التصنيفات
          </h3>
          <div className="space-y-2">
            {categoryDistribution.map(({ category, count }) => (
              <div key={category} className="flex items-center gap-3">
                <span className="text-xs text-neutral-600 w-12 shrink-0">{category}</span>
                <div className="flex-1 h-4 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${CATEGORY_COLORS[category]?.split(' ')[0] || 'bg-primary-400'}`}
                    style={{ width: `${(count / maxCatCount) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-neutral-500 w-6 text-left">{count}</span>
              </div>
            ))}
            {categoryDistribution.every(c => c.count === 0) && (
              <p className="text-xs text-neutral-400 text-center py-4">لا توجد مشاريع مضافة</p>
            )}
          </div>
        </div>

        {/* Status distribution */}
        <div className="card">
          <h3 className="text-sm font-bold text-neutral-900 mb-3 flex items-center gap-1.5">
            <BarChart3 size={16} className="text-primary-600" />
            توزيع الحالات
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {statusDistribution.map(({ status, label, count }) => {
              const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0
              const config = STATUS_CONFIG[status]
              return (
                <div key={status} className={`p-3 rounded-xl border text-center ${config?.color || 'bg-neutral-100 text-neutral-600'} border-transparent`}>
                  <div className="text-lg font-bold">{count}</div>
                  <div className="text-[10px] font-medium opacity-75">{label}</div>
                  <div className="text-[9px] opacity-60">{pct}%</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ─── Table ─── */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
              <p className="mt-3 text-sm text-neutral-400">جاري التحميل...</p>
            </div>
          </div>
        ) : projects.length === 0 ? (
          <div className="py-12 text-center">
            <FolderOpen size={36} className="text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-500 text-sm">لا توجد مشاريع</p>
            <Button unstyled onClick={openCreate} className="btn-primary btn-sm mt-3"><Plus size={16} /> إضافة مشروع</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="w-full text-sm">
              <TableHeader>
                <TableRow className="border-b border-neutral-200 bg-neutral-50">
                  <TableHead className="text-right py-3 px-4 font-bold text-neutral-600 text-xs">المشروع</TableHead>
                  <TableHead className="text-right py-3 px-4 font-bold text-neutral-600 text-xs hidden md:table-cell">المنصة / البرنامج</TableHead>
                  <TableHead className="text-right py-3 px-4 font-bold text-neutral-600 text-xs hidden lg:table-cell">التصنيف</TableHead>
                  <TableHead className="text-right py-3 px-4 font-bold text-neutral-600 text-xs">الحالة</TableHead>
                  <TableHead className="text-right py-3 px-4 font-bold text-neutral-600 text-xs hidden sm:table-cell">المرتبطات</TableHead>
                  <TableHead className="text-right py-3 px-4 font-bold text-neutral-600 text-xs hidden xl:table-cell">مميز</TableHead>
                  <TableHead className="text-center py-3 px-4 font-bold text-neutral-600 text-xs">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map(p => {
                  const statusConfig = STATUS_CONFIG[p.status] || STATUS_CONFIG.ACTIVE
                  const StatusIcon = statusConfig.icon
                  const catColor = CATEGORY_COLORS[p.category] || 'bg-neutral-100 text-neutral-600'
                  return (
                    <TableRow key={p.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                      <TableCell className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="shrink-0 w-8 h-8 rounded-lg bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-500">
                            <FolderKanban size={14} />
                          </div>
                          <div>
                            <div className="font-medium text-neutral-900 text-sm">{p.title}</div>
                            <div className="text-[10px] text-neutral-400 font-mono" dir="ltr">{p.slug}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4 hidden md:table-cell">
                        <div className="space-y-1">
                          {p.platform ? (
                            <div className="flex items-center gap-1">
                              <span
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: p.platform.color || '#527F47' }}
                              />
                              <span className="text-xs text-neutral-600">{p.platform.name}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-neutral-400">—</span>
                          )}
                          {p.program && (
                            <div className="text-[10px] text-neutral-400 pr-2.5">{p.program.name}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4 hidden lg:table-cell">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${catColor}`}>
                          {p.category || '—'}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${statusConfig.color}`}>
                          <StatusIcon size={10} />
                          {statusConfig.label}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 px-4 hidden sm:table-cell">
                        <div className="flex items-center gap-2.5 text-xs text-neutral-500">
                          <span className="flex items-center gap-1" title="مواد معرفية">
                            <BookOpen size={12} className="text-primary-500" /> {p._count.knowledgeItems}
                          </span>
                          <span className="flex items-center gap-1" title="تقارير">
                            <FileText size={12} className="text-secondary-500" /> {p._count.submittedReports}
                          </span>
                          <span className="flex items-center gap-1" title="تقييمات">
                            <BarChart3 size={12} className="text-info-500" /> {p._count.evaluations}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4 hidden xl:table-cell">
                        {p.isFeatured ? (
                          <Star size={14} className="text-secondary-500 fill-secondary-500" />
                        ) : (
                          <span className="text-neutral-300">—</span>
                        )}
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <div className="flex items-center justify-center gap-0.5">
                          <Button unstyled
                            onClick={() => openEdit(p)}
                            className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="تعديل"
                          >
                            <Pencil size={14} />
                          </Button>
                          <Button unstyled
                            onClick={() => handleDelete(p.id)}
                            className="p-1.5 text-neutral-400 hover:text-error-600 hover:bg-error-50 rounded-lg transition-colors"
                            title="حذف"
                          >
                            <Trash2 size={14} />
                          </Button>
                          <a
                            href={`/projects/${p.slug}`}
                            target="_blank"
                            className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors hidden sm:block"
                            title="عرض المشروع"
                          >
                            <ExternalLink size={14} />
                          </a>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* ─── Create/Edit Modal ─── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-neutral-200 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                <FolderKanban size={20} className="text-primary-600" />
                {editing ? 'تعديل المشروع' : 'مشروع جديد'}
              </h2>
              <Button unstyled onClick={() => setShowModal(false)} className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100 transition-colors">
                <X size={20} />
              </Button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Title */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">
                    عنوان المشروع <span className="text-error-500">*</span>
                  </label>
                  <Input
                    required
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    className="input-field"
                    placeholder="أدخل عنوان المشروع"
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">
                    الرابط المختصر <span className="text-error-500">*</span>
                  </label>
                  <div className="relative">
                    <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <Input
                      required
                      dir="ltr"
                      value={form.slug}
                      onChange={e => setForm({ ...form, slug: e.target.value })}
                      className="input-field pl-8"
                      placeholder="my-project-slug"
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">
                    التصنيف <span className="text-error-500">*</span>
                  </label>
                  <NativeSelect
                    required
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className="input-field"
                  >
                    <option value="">اختر التصنيف...</option>
                    {Object.keys(CATEGORY_LABELS).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </NativeSelect>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">
                  الوصف <span className="text-error-500">*</span>
                </label>
                <Textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="input-field"
                  placeholder="وصف مختصر للمشروع"
                />
              </div>

              {/* Platform & Program */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">المنصة</label>
                  <NativeSelect
                    value={form.platformId}
                    onChange={e => setForm({ ...form, platformId: e.target.value })}
                    className="input-field"
                  >
                    <option value="">بدون منصة</option>
                    {platforms.map(pl => (
                      <option key={pl.id} value={pl.id}>{pl.name}</option>
                    ))}
                  </NativeSelect>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">البرنامج</label>
                  <NativeSelect
                    value={form.programId}
                    onChange={e => setForm({ ...form, programId: e.target.value })}
                    className="input-field"
                  >
                    <option value="">بدون برنامج</option>
                    {programs.map(pr => (
                      <option key={pr.id} value={pr.id}>{pr.name}</option>
                    ))}
                  </NativeSelect>
                </div>
              </div>

              {/* Status & Featured & Sort */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">الحالة</label>
                  <NativeSelect
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value })}
                    className="input-field"
                  >
                    <option value="ACTIVE">نشط</option>
                    <option value="COMPLETED">مكتمل</option>
                    <option value="ON_HOLD">معلق</option>
                    <option value="PLANNING">تخطيط</option>
                  </NativeSelect>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">تاريخ البداية</label>
                  <Input
                    type="date"
                    value={form.startDate}
                    onChange={e => setForm({ ...form, startDate: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">تاريخ النهاية</label>
                  <Input
                    type="date"
                    value={form.endDate}
                    onChange={e => setForm({ ...form, endDate: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              {/* Cover Image & Sort Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">صورة الغلاف (رابط)</label>
                  <div className="relative">
                    <ImageIcon size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <Input
                      dir="ltr"
                      value={form.coverImage}
                      onChange={e => setForm({ ...form, coverImage: e.target.value })}
                      className="input-field pr-9"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">ترتيب الفرز</label>
                  <Input
                    type="number"
                    value={form.sortOrder}
                    onChange={e => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                    className="input-field"
                  />
                </div>
              </div>

              {/* Full Content */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">المحتوى الكامل</label>
                <Textarea
                  rows={4}
                  value={form.fullContent}
                  onChange={e => setForm({ ...form, fullContent: e.target.value })}
                  className="input-field"
                  placeholder="المحتوى التفصيلي للمشروع"
                />
              </div>

              {/* Partner Logos */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">شعارات الشركاء (JSON)</label>
                <Input
                  dir="ltr"
                  value={form.partnerLogos}
                  onChange={e => setForm({ ...form, partnerLogos: e.target.value })}
                  className="input-field"
                  placeholder='["https://logo1.png", "https://logo2.png"]'
                />
              </div>

              {/* Featured checkbox */}
              <div className="flex items-center gap-2">
                <Input
                  type="checkbox"
                  id="featured"
                  checked={form.isFeatured}
                  onChange={e => setForm({ ...form, isFeatured: e.target.checked })}
                  className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="featured" className="text-sm text-neutral-700 flex items-center gap-1">
                  <Star size={14} className="text-secondary-500" />
                  مشروع مميز
                </label>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
                <Button unstyled type="button" onClick={() => setShowModal(false)} className="btn-ghost btn-sm">
                  إلغاء
                </Button>
                <Button unstyled type="submit" disabled={submitting} className="btn-primary btn-sm">
                  {submitting ? 'جاري الحفظ...' : editing ? 'تحديث المشروع' : 'إضافة المشروع'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
