'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Plus, Pencil, Trash2, X, Blocks, BookOpen, Activity,
  Target, Users, Search, Hash, ArrowLeft,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ───

interface ProgramSummary {
  id: string
  _count?: {
    activities?: number
    enrollments?: number
    projects?: number
    knowledgeItems?: number
  }
}

interface Platform {
  id: string
  name: string
  slug: string
  description: string
  vision: string | null
  color: string | null
  logo: string | null
  coverImage: string | null
  isActive: boolean
  sortOrder: number
  programs: ProgramSummary[]
}

interface PlatformForm {
  name: string
  slug: string
  description: string
  vision: string
  color: string
  logo: string
  coverImage: string
  sortOrder: number
  isActive: boolean
}

// ─── Empty Form ───

const emptyPlatform: PlatformForm = {
  name: '',
  slug: '',
  description: '',
  vision: '',
  color: '#527F47',
  logo: '',
  coverImage: '',
  sortOrder: 0,
  isActive: true,
}

// ─── Stat Card ───

const StatCard = ({ label, value, icon: Icon, gradient }: {
  label: string
  value: number
  icon: React.ElementType
  gradient: string
}) => (
  <div className="relative overflow-hidden rounded-xl border border-neutral-200 bg-white p-4 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group">
    <div className={`absolute inset-0 opacity-[0.03] ${gradient}`} />
    <div className="flex items-center gap-3">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm bg-gradient-to-br ${gradient} transition-transform duration-300 group-hover:scale-110`}>
        <Icon size={20} className="text-white" />
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-bold text-neutral-900 tabular-nums">{value.toLocaleString('ar-SA')}</div>
        <div className="text-xs text-neutral-500 mt-0.5">{label}</div>
      </div>
    </div>
  </div>
)

// ─── Platform Card ───

const PlatformCard = ({ platform, onEdit, onDelete }: {
  platform: Platform
  onEdit: (p: Platform) => void
  onDelete: (id: string) => void
}) => {
  const color = platform.color || '#527F47'
  const image = platform.coverImage || platform.logo
  const programsCount = platform.programs.length
  const activitiesCount = platform.programs.reduce((sum, program) => sum + (program._count?.activities ?? 0), 0)
  const enrollmentsCount = platform.programs.reduce((sum, program) => sum + (program._count?.enrollments ?? 0), 0)

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1">
      <div className="h-2 w-full" style={{ backgroundColor: color }} />

      <div className="relative h-36 overflow-hidden bg-gradient-to-br from-neutral-100 to-neutral-200">
        {image ? (
          <Image
            src={image}
            alt={platform.name}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className={`h-full w-full transition-transform duration-500 group-hover:scale-105 ${
              platform.coverImage ? 'object-cover' : 'object-contain p-6'
            }`}
            unoptimized
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center transition-transform duration-500 group-hover:scale-105"
            style={{ backgroundColor: `${color}15` }}
          >
            <Blocks size={48} className="text-white/30" style={{ color: `${color}40` }} />
          </div>
        )}

        <div className="absolute top-3 left-3">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm border ${
            platform.isActive
              ? 'bg-white/90 text-success-700 border-success-200 backdrop-blur-sm'
              : 'bg-white/90 text-neutral-500 border-neutral-200 backdrop-blur-sm'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${platform.isActive ? 'bg-success-500' : 'bg-neutral-400'}`} />
            {platform.isActive ? 'نشطة' : 'غير نشطة'}
          </span>
        </div>

        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(event) => { event.preventDefault(); event.stopPropagation(); onEdit(platform) }}
            className="p-1.5 rounded-lg bg-white/90 backdrop-blur-sm text-neutral-600 hover:bg-primary-50 hover:text-primary-600 border border-neutral-200 shadow-sm transition-all"
            title="تعديل المنصة"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={(event) => { event.preventDefault(); event.stopPropagation(); onDelete(platform.id) }}
            className="p-1.5 rounded-lg bg-white/90 backdrop-blur-sm text-neutral-600 hover:bg-error-50 hover:text-error-600 border border-neutral-200 shadow-sm transition-all"
            title="حذف المنصة"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div
            className="relative h-12 w-12 shrink-0 rounded-xl border-2 flex items-center justify-center overflow-hidden"
            style={{ borderColor: `${color}25`, backgroundColor: `${color}08` }}
          >
            {platform.logo && !platform.coverImage ? (
              <Image src={platform.logo} alt="" fill sizes="48px" className="object-contain p-1" unoptimized />
            ) : (
              <Blocks size={20} style={{ color }} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-neutral-900 truncate">{platform.name}</h3>
            <p className="text-xs text-neutral-500 line-clamp-2 leading-5 mt-0.5">{platform.description}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="inline-flex items-center gap-1 rounded-lg bg-secondary-50 px-2 py-1 text-[10px] font-medium text-secondary-700">
            <BookOpen size={11} />
            {programsCount} برامج
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg bg-primary-50 px-2 py-1 text-[10px] font-medium text-primary-700">
            <Activity size={11} />
            {activitiesCount} أنشطة
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg bg-info-50 px-2 py-1 text-[10px] font-medium text-info-700">
            <Users size={11} />
            {enrollmentsCount} تسجيل
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 px-2 py-1 text-[10px] font-medium text-neutral-500">
            <Hash size={11} />
            {platform.sortOrder}
          </span>
        </div>

        <Link
          href={`/ar/admin/platforms/${platform.slug}`}
          className="w-full h-9 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-primary-50 hover:border-primary-200 hover:text-primary-700 text-neutral-600 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all no-underline group/link"
        >
          عرض التفاصيل
          <ArrowLeft size={13} className="transition-transform group-hover/link:-translate-x-0.5" />
        </Link>
      </div>
    </div>
  )
}

// ─── Modal Component ───

const Modal = ({ show, onClose, title, icon: ModalIcon, iconColor, children }: {
  show: boolean
  onClose: () => void
  title: string
  icon: React.ElementType
  iconColor: string
  children: React.ReactNode
}) => {
  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-auto animate-scale-in border border-neutral-200" onClick={event => event.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconColor}`}>
              <ModalIcon size={16} className="text-white" />
            </div>
            {title}
          </h2>
          <button onClick={onClose} className="p-2 text-neutral-400 hover:text-neutral-600 rounded-xl hover:bg-neutral-100 transition-all">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ─── Main Page ───

export default function AdminPlatformsPage() {
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Platform | null>(null)
  const [form, setForm] = useState<PlatformForm>(emptyPlatform)
  const [submitting, setSubmitting] = useState(false)

  const fetchPlatforms = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/platforms')
      const data = await res.json()
      if (data.success) setPlatforms(data.data.platforms)
    } catch {
      toast.error('فشل تحميل المنصات')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPlatforms() }, [fetchPlatforms])

  const stats = useMemo(() => ({
    total: platforms.length,
    active: platforms.filter(platform => platform.isActive).length,
    programs: platforms.reduce((sum, platform) => sum + platform.programs.length, 0),
    activities: platforms.reduce(
      (sum, platform) => sum + platform.programs.reduce((programSum, program) => programSum + (program._count?.activities ?? 0), 0),
      0
    ),
  }), [platforms])

  const normalizedSearch = searchTerm.trim().toLowerCase()
  const filteredPlatforms = useMemo(() => {
    if (!normalizedSearch) return platforms
    return platforms.filter(platform =>
      `${platform.name} ${platform.slug} ${platform.description}`.toLowerCase().includes(normalizedSearch)
    )
  }, [normalizedSearch, platforms])

  const openAdd = () => {
    setEditing(null)
    setForm(emptyPlatform)
    setShowModal(true)
  }

  const openEdit = (platform: Platform) => {
    setEditing(platform)
    setForm({
      name: platform.name,
      slug: platform.slug,
      description: platform.description,
      vision: platform.vision || '',
      color: platform.color || '#527F47',
      logo: platform.logo || '',
      coverImage: platform.coverImage || '',
      sortOrder: platform.sortOrder,
      isActive: platform.isActive,
    })
    setShowModal(true)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)

    try {
      const method = editing ? 'PUT' : 'POST'
      const body = editing ? { id: editing.id, ...form } : form
      const res = await fetch('/api/admin/platforms', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()

      if (data.success) {
        toast.success(editing ? 'تم تحديث المنصة' : 'تم إضافة المنصة')
        setShowModal(false)
        setEditing(null)
        setForm(emptyPlatform)
        fetchPlatforms()
      } else {
        toast.error(data.message || 'حدث خطأ')
      }
    } catch {
      toast.error('حدث خطأ في الاتصال')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه المنصة؟')) return

    try {
      const res = await fetch(`/api/admin/platforms?id=${id}`, { method: 'DELETE' })
      if ((await res.json()).success) {
        toast.success('تم حذف المنصة')
        fetchPlatforms()
      }
    } catch {
      toast.error('حدث خطأ في الاتصال')
    }
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950 p-6 md:p-8 mb-6">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="relative">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center shadow-sm">
                  <Blocks size={22} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-white">المنصات</h1>
                  <p className="text-primary-200 text-sm mt-1">إدارة وعرض جميع المنصات في شبكة الرواد</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:min-w-[260px]">
                <Search size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-primary-300" />
                <input
                  value={searchTerm}
                  onChange={event => setSearchTerm(event.target.value)}
                  className="w-full h-10 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl pr-10 pl-4 text-sm text-white placeholder:text-primary-300 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all"
                  placeholder="بحث في المنصات..."
                />
              </div>
              <button
                onClick={openAdd}
                className="h-10 px-5 bg-white text-primary-800 hover:bg-primary-50 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:-translate-y-0.5 shrink-0"
              >
                <Plus size={18} />
                إضافة منصة
              </button>
            </div>
          </div>
        </div>
      </div>

      {!loading && platforms.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard label="إجمالي المنصات" value={stats.total} icon={Blocks} gradient="from-primary-500 to-primary-700" />
          <StatCard label="المنصات النشطة" value={stats.active} icon={Target} gradient="from-success-500 to-emerald-700" />
          <StatCard label="البرامج" value={stats.programs} icon={BookOpen} gradient="from-secondary-500 to-secondary-700" />
          <StatCard label="الدورات والأنشطة" value={stats.activities} icon={Activity} gradient="from-info-500 to-blue-700" />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="relative w-12 h-12 mx-auto">
              <div className="absolute inset-0 border-4 border-primary-100 rounded-full" />
              <div className="absolute inset-0 border-4 border-transparent border-t-primary-600 rounded-full animate-spin" />
            </div>
            <p className="mt-4 text-sm text-neutral-400 animate-pulse">جاري التحميل...</p>
          </div>
        </div>
      ) : platforms.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-white shadow-sm">
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center mb-4 shadow-sm">
              <Blocks size={32} className="text-primary-400" />
            </div>
            <p className="text-lg font-semibold text-neutral-900 mb-1">لا توجد منصات بعد</p>
            <p className="text-sm text-neutral-500 mb-6 max-w-sm text-center">أضف منصتك الأولى لبدء بناء البرامج والدورات والأنشطة.</p>
            <button onClick={openAdd} className="btn-primary btn-sm">
              <Plus size={16} /> إضافة منصة
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-neutral-500">
              <span className="font-semibold text-neutral-700">{filteredPlatforms.length}</span> منصة
              {normalizedSearch && <> - نتائج البحث عن &quot;{searchTerm}&quot;</>}
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredPlatforms.map(platform => (
              <PlatformCard
                key={platform.id}
                platform={platform}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </>
      )}

      <Modal
        show={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'تعديل المنصة' : 'إضافة منصة جديدة'}
        icon={Blocks}
        iconColor="bg-gradient-to-br from-primary-500 to-primary-700"
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1.5">الاسم <span className="text-error-500">*</span></label>
            <input className="input-field" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} required placeholder="اسم المنصة" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1.5">الرابط المختصر <span className="text-error-500">*</span></label>
              <input className="input-field font-mono text-xs" value={form.slug} onChange={event => setForm({ ...form, slug: event.target.value })} required dir="ltr" placeholder="platform-slug" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1.5">اللون</label>
              <div className="flex items-center gap-2">
                <input type="color" className="h-10 w-14 rounded-lg border border-neutral-300 cursor-pointer" value={form.color} onChange={event => setForm({ ...form, color: event.target.value })} />
                <span className="text-xs text-neutral-400 font-mono">{form.color}</span>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1.5">الوصف <span className="text-error-500">*</span></label>
            <textarea className="input-field" rows={3} value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} required placeholder="وصف المنصة..." />
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1.5">الرؤية</label>
            <textarea className="input-field" rows={2} value={form.vision} onChange={event => setForm({ ...form, vision: event.target.value })} placeholder="رؤية المنصة..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1.5">الترتيب</label>
              <input type="number" className="input-field" value={form.sortOrder} onChange={event => setForm({ ...form, sortOrder: parseInt(event.target.value) || 0 })} />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={event => setForm({ ...form, isActive: event.target.checked })} className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500" />
                <span className="text-sm text-neutral-700 font-medium">منصة نشطة</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
            <button type="button" onClick={() => setShowModal(false)} className="btn-ghost btn-sm">إلغاء</button>
            <button type="submit" className="btn-primary btn-sm" disabled={submitting}>
              {submitting ? 'جارٍ الحفظ...' : editing ? 'تحديث المنصة' : 'إضافة المنصة'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
