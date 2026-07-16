'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { NativeSelect } from '@/components/ui/native-select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import {
  Activity, ArrowLeft, Award, BarChart3, Blocks, BookOpen,
  Calendar, ExternalLink, FolderKanban,
  MapPin, PlayCircle, Route, Search, Target, Users,
  Plus, Pencil, Trash2, X, Globe, Hash, ChevronDown, Layers,
  FileText,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ───

interface ActivityItem {
  id: string
  name: string
  slug: string
  description: string
  type: string
  location: string | null
  isOnline: boolean
  startDate: string | null
  endDate: string | null
  maxParticipants: number | null
  icon: string | null
  isActive: boolean
  sortOrder: number
}

interface Program {
  id: string
  name: string
  slug: string
  description: string
  image: string | null
  isActive: boolean
  sortOrder: number
  maxBeneficiaries: number | null
  startDate: string | null
  endDate: string | null
  activities: ActivityItem[]
  _count: {
    enrollments: number
    projects: number
    knowledgeItems: number
    submittedReports: number
  }
}

interface Project {
  id: string
  title: string
  slug: string
  category: string
  status: string
  isFeatured: boolean
  programId: string | null
  program: { id: string; name: string; slug: string } | null
}

interface PlatformDetail {
  id: string
  name: string
  slug: string
  description: string
  vision: string | null
  color: string | null
  logo: string | null
  coverImage: string | null
  isActive: boolean
  programs: Program[]
  projects: Project[]
}

interface PlatformMember {
  id: string
  code: string
  name: string
  email: string | null
  country: string | null
  city: string | null
  status: string
  type: string
  role: string | null
  currentStage: string | null
  programs: { id: string; name: string; slug: string }[]
  enrollmentsCount: number
  completedEnrollments: number
  participationsCount: number
  attendedParticipations: number
}

interface DetailResponse {
  platform: PlatformDetail
  stats: {
    programs: number
    activities: number
    members: number
    activeMembers: number
    enrollments: number
    completedEnrollments: number
    participations: number
    projects: number
  }
  members: PlatformMember[]
}

// ─── Constants ───

const STAGE_LABELS: Record<string, string> = {
  DISCOVERY: 'اكتشاف', APPLICATION: 'تقديم', ONBOARDING: 'تأهيل',
  ACTIVE: 'نشط', ADVANCED: 'متقدم', GRADUATED: 'متخرج', ALUMNI: 'خريج', CHAMPION: 'سفير',
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'نشط', COMPLETED: 'مكتمل', ON_HOLD: 'معلق', PLANNING: 'تخطيط', INACTIVE: 'غير نشط', SUSPENDED: 'موقوف',
}

const ACTIVITY_TYPES: Record<string, string> = {
  WORKSHOP: 'ورشة', BOOTCAMP: 'معسكر', HACKATHON: 'هاكاثون', SEMINAR: 'ندوة',
  COMPETITION: 'مسابقة', MENTORING: 'إرشاد', COURSE: 'دورة', EVENT: 'فعالية', OTHER: 'أخرى',
}

const ACTIVITY_TYPE_LIST = Object.entries(ACTIVITY_TYPES).map(([value, label]) => ({ value, label }))

const ACTIVITY_TYPE_COLORS: Record<string, string> = {
  WORKSHOP: 'bg-amber-100 text-amber-700 border-amber-200',
  BOOTCAMP: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  HACKATHON: 'bg-violet-100 text-violet-700 border-violet-200',
  SEMINAR: 'bg-blue-100 text-blue-700 border-blue-200',
  COMPETITION: 'bg-rose-100 text-rose-700 border-rose-200',
  MENTORING: 'bg-teal-100 text-teal-700 border-teal-200',
  COURSE: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  EVENT: 'bg-orange-100 text-orange-700 border-orange-200',
  OTHER: 'bg-neutral-100 text-neutral-700 border-neutral-200',
}

// ─── Empty Forms ───

const emptyProgram = { name: '', slug: '', description: '', icon: '', image: '', sortOrder: 0, isActive: true, platformId: '' }
const emptyActivity = {
  name: '', slug: '', description: '', icon: '', type: 'WORKSHOP',
  location: '', isOnline: false, maxParticipants: '', sortOrder: 0,
  isActive: true, programId: '',
}

// ─── Shared Components ───

function Badge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${className}`}>
      {children}
    </span>
  )
}

const ActivityTypeBadge = ({ type }: { type?: string }) => {
  const colorClass = ACTIVITY_TYPE_COLORS[type || ''] || ACTIVITY_TYPE_COLORS.OTHER
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${colorClass}`}>
      {ACTIVITY_TYPES[type || ''] || type || 'نشاط'}
    </span>
  )
}

/** Parse description like "المحاضر: صخر الغزالي | المدة: 04:16 ساعات | عدد الدروس: 3" into structured fields */
function ActivityDetails({ description }: { description: string | null }) {
  if (!description) return null

  // Try to parse structured fields
  const parts = description.split('|').map(s => s.trim())
  const fields: { icon: string; label: string }[] = []

  for (const part of parts) {
    const instructorMatch = part.match(/^المحاضر:\s*(.+)/)
    const durationMatch = part.match(/^المدة:\s*(.+)/)
    const lessonsMatch = part.match(/^عدد الدروس:\s*(.+)/)
    const locationMatch = part.match(/^الموقع:\s*(.+)/)
    const dateMatch = part.match(/^التاريخ:\s*(.+)/)
    const linkMatch = part.match(/^الرابط:\s*(.+)/)

    if (instructorMatch) fields.push({ icon: '🎓', label: instructorMatch[1] })
    else if (durationMatch) fields.push({ icon: '⏱', label: durationMatch[1] })
    else if (lessonsMatch) fields.push({ icon: '📚', label: ` ${lessonsMatch[1]} دروس` })
    else if (locationMatch) fields.push({ icon: '📍', label: locationMatch[1] })
    else if (dateMatch) fields.push({ icon: '📅', label: dateMatch[1] })
    else if (linkMatch) fields.push({ icon: '🔗', label: 'رابط' })
  }

  // If we parsed structured fields, show them as chips
  if (fields.length > 0) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {fields.map((field, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1 rounded-lg bg-neutral-50 border border-neutral-200 px-2.5 py-1 text-[11px] text-neutral-700"
          >
            <span className="text-[12px]">{field.icon}</span>
            <span className="font-medium">{field.label}</span>
          </span>
        ))}
      </div>
    )
  }

  // Fallback: show raw description
  return (
    <p className="text-[11px] text-neutral-600 leading-6">{description}</p>
  )
}

function Modal({ show, onClose, title, icon: ModalIcon, iconColor, children }: {
  show: boolean; onClose: () => void; title: string; icon: any; iconColor: string; children: React.ReactNode
}) {
  if (!show) return null
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-auto animate-scale-in border border-neutral-200" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconColor}`}>
              <ModalIcon size={16} className="text-white" />
            </div>
            {title}
          </h2>
          <Button unstyled onClick={onClose} className="p-2 text-neutral-400 hover:text-neutral-600 rounded-xl hover:bg-neutral-100 transition-all">
            <X size={18} />
          </Button>
        </div>
        {children}
      </div>
    </div>
  )
}

function dateLabel(value: string | null) {
  return value ? new Date(value).toLocaleDateString('ar') : 'غير محدد'
}

// ─── Stat Box ───

const StatBox = ({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) => (
  <div className="relative overflow-hidden rounded-xl border border-neutral-200 bg-white p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group">
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110 ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
      <div className="min-w-0">
        <div className="text-xl font-bold text-neutral-900 tabular-nums">{value}</div>
        <div className="text-xs text-neutral-500 mt-0.5">{label}</div>
      </div>
    </div>
  </div>
)

// ─── Main Page ───

export default function AdminPlatformDetailPage() {
  const params = useParams()
  const slug = params.slug as string
  const [data, setData] = useState<DetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [memberSearch, setMemberSearch] = useState('')

  // Program modal
  const [showProgramModal, setShowProgramModal] = useState(false)
  const [editingProgram, setEditingProgram] = useState<Program | null>(null)
  const [programForm, setProgramForm] = useState(emptyProgram)
  const [submitting, setSubmitting] = useState(false)

  // Activity modal
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [editingActivity, setEditingActivity] = useState<ActivityItem | null>(null)
  const [activityForm, setActivityForm] = useState(emptyActivity)
  const [expandedProgramId, setExpandedProgramId] = useState<string | null>(null)

  // ─── Data ───

  const fetchPlatform = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/platforms/${slug}`)
      const json = await res.json()
      if (json.success) setData(json.data)
      else toast.error(json.message || 'فشل تحميل بيانات المنصة')
    } catch { toast.error('فشل الاتصال بالخادم') }
    finally { setLoading(false) }
  }, [slug])

  useEffect(() => { fetchPlatform() }, [fetchPlatform])

  const filteredMembers = useMemo(() => {
    if (!data) return []
    const q = memberSearch.trim()
    if (!q) return data.members
    return data.members.filter(m =>
      m.name.includes(q) || m.code.includes(q) || m.email?.includes(q) ||
      m.programs.some(p => p.name.includes(q))
    )
  }, [data, memberSearch])

  // ─── Program CRUD ───

  const openAddProgram = () => {
    if (!data) return
    setEditingProgram(null)
    setProgramForm({ ...emptyProgram, platformId: data.platform.id })
    setShowProgramModal(true)
  }

  const openEditProgram = (program: Program) => {
    setEditingProgram(program)
    setProgramForm({
      name: program.name, slug: program.slug, description: program.description,
      icon: program.image || '', image: program.image || '',
      sortOrder: program.sortOrder, isActive: program.isActive,
      platformId: data?.platform.id || '',
    })
    setShowProgramModal(true)
  }

  const handleProgramSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true)
    try {
      const res = await fetch('/api/admin/platforms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: editingProgram ? 'update-program' : 'add-program',
          ...(editingProgram ? { id: editingProgram.id } : {}),
          ...programForm,
        }),
      })
      const result = await res.json()
      if (result.success) {
        toast.success(editingProgram ? 'تم تحديث البرنامج' : 'تم إضافة البرنامج')
        setShowProgramModal(false); setEditingProgram(null); setProgramForm(emptyProgram)
        fetchPlatform()
      } else toast.error(result.message || 'حدث خطأ')
    } catch { toast.error('حدث خطأ في الاتصال') }
    finally { setSubmitting(false) }
  }

  const handleDeleteProgram = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا البرنامج؟')) return
    try {
      const res = await fetch('/api/admin/platforms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete-program', id }),
      })
      if ((await res.json()).success) { toast.success('تم حذف البرنامج'); fetchPlatform() }
    } catch { toast.error('حدث خطأ في الاتصال') }
  }

  // ─── Activity CRUD ───

  const openAddActivity = (programId: string) => {
    setEditingActivity(null)
    setActivityForm({ ...emptyActivity, programId })
    setShowActivityModal(true)
  }

  const openEditActivity = (activity: ActivityItem, programId: string) => {
    setEditingActivity(activity)
    setActivityForm({
      name: activity.name, slug: activity.slug, description: activity.description,
      icon: activity.icon || '', type: activity.type || 'WORKSHOP',
      location: activity.location || '', isOnline: Boolean(activity.isOnline),
      maxParticipants: activity.maxParticipants ? String(activity.maxParticipants) : '',
      sortOrder: activity.sortOrder, isActive: activity.isActive, programId,
    })
    setShowActivityModal(true)
  }

  const handleActivitySubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true)
    try {
      const payload = {
        ...activityForm,
        maxParticipants: activityForm.maxParticipants ? Number(activityForm.maxParticipants) : undefined,
      }
      const res = await fetch('/api/admin/platforms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: editingActivity ? 'update-activity' : 'add-activity',
          ...(editingActivity ? { id: editingActivity.id } : {}),
          ...payload,
        }),
      })
      const result = await res.json()
      if (result.success) {
        toast.success(editingActivity ? 'تم تحديث النشاط' : 'تم إضافة النشاط')
        setShowActivityModal(false); setEditingActivity(null); setActivityForm(emptyActivity)
        fetchPlatform()
      } else toast.error(result.message || 'حدث خطأ')
    } catch { toast.error('حدث خطأ في الاتصال') }
    finally { setSubmitting(false) }
  }

  const handleDeleteActivity = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا النشاط؟')) return
    try {
      const res = await fetch('/api/admin/platforms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete-activity', id }),
      })
      if ((await res.json()).success) { toast.success('تم حذف النشاط'); fetchPlatform() }
    } catch { toast.error('حدث خطأ في الاتصال') }
  }

  // ─── Render ───

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="relative w-12 h-12 mx-auto">
              <div className="absolute inset-0 border-4 border-primary-100 rounded-full" />
              <div className="absolute inset-0 border-4 border-transparent border-t-primary-600 rounded-full animate-spin" />
            </div>
            <p className="mt-4 text-sm text-neutral-400 animate-pulse">جاري تحميل تفاصيل المنصة...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-white shadow-sm py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-error-50 to-error-100 flex items-center justify-center mx-auto mb-4">
            <Blocks size={32} className="text-error-400" />
          </div>
          <p className="text-lg font-semibold text-neutral-900 mb-1">تعذر تحميل المنصة</p>
          <p className="text-sm text-neutral-500 mb-6">قد تكون هذه المنصة غير موجودة أو تم حذفها.</p>
          <Link href="/ar/admin/platforms" className="btn-primary btn-sm no-underline inline-flex">
            <ArrowLeft size={16} /> العودة للمنصات
          </Link>
        </div>
      </div>
    )
  }

  const { platform, stats } = data
  const color = platform.color || '#527F47'
  const completionRate = stats.enrollments > 0 ? Math.round((stats.completedEnrollments / stats.enrollments) * 100) : 0

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in">
      {/* ─── Back + Header ─── */}
      <div className="mb-6">
        <Link href="/ar/admin/platforms" className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-primary-700 no-underline mb-3 transition-colors">
          <ArrowLeft size={14} />
          العودة إلى المنصات
        </Link>

        <div className="relative overflow-hidden rounded-2xl bg-white border border-neutral-200 shadow-sm">
          {/* Cover */}
          <div className="relative h-36 md:h-48 overflow-hidden bg-gradient-to-br from-neutral-100 to-neutral-200">
            {platform.coverImage || platform.logo ? (
              <Image
                src={platform.coverImage || platform.logo || ''}
                alt={platform.name}
                fill
                sizes="100vw"
                className={`h-full w-full ${platform.coverImage ? 'object-cover' : 'object-contain p-8'}`}
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                <Blocks size={64} className="text-white/30" style={{ color: `${color}30` }} />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>

          {/* Profile section overlapping cover */}
          <div className="relative px-6 pb-6">
            <div className="flex items-end gap-5 -mt-12 mb-4">
              {/* Avatar */}
              <div
                className="relative h-24 w-24 shrink-0 rounded-2xl border-4 border-white shadow-xl overflow-hidden flex items-center justify-center bg-white"
                style={{ boxShadow: `0 4px 24px ${color}30` }}
              >
                {platform.logo || platform.coverImage ? (
                  <Image
                    src={platform.logo || platform.coverImage || ''}
                    alt={platform.name}
                    fill
                    sizes="96px"
                    className="h-full w-full object-contain p-1.5"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: color }}>
                    <Blocks size={32} className="text-white" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1 pt-8">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900">{platform.name}</h1>
                  <div className="flex gap-1.5">
                    <Badge className={platform.isActive ? 'bg-success-50 text-success-700 border-success-200' : 'bg-neutral-100 text-neutral-500 border-neutral-200'}>
                      <span className={`w-1.5 h-1.5 rounded-full ${platform.isActive ? 'bg-success-500' : 'bg-neutral-400'} ml-1 inline-block animate-pulse`} />
                      {platform.isActive ? 'نشطة' : 'غير نشطة'}
                    </Badge>
                    <Badge className="bg-neutral-100 text-neutral-500 border-neutral-200">/{platform.slug}</Badge>
                  </div>
                </div>
                <p className="text-sm text-neutral-500 line-clamp-2">{platform.description}</p>
              </div>

              <div className="flex shrink-0 gap-2 pt-8">
                <Link
                  href={`/ar/platforms/${platform.slug}`}
                  className="h-9 px-4 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:text-primary-700 font-semibold text-xs flex items-center gap-1.5 transition-all no-underline"
                >
                  <ExternalLink size={13} />
                  الصفحة العامة
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatBox label="البرامج" value={stats.programs} icon={BookOpen} color="bg-gradient-to-br from-secondary-500 to-secondary-700" />
              <StatBox label="الأنشطة" value={stats.activities} icon={Activity} color="bg-gradient-to-br from-primary-500 to-primary-700" />
              <StatBox label="الأعضاء" value={stats.members} icon={Users} color="bg-gradient-to-br from-info-500 to-blue-700" />
              <StatBox label="الإتمام" value={`${completionRate}%`} icon={Award} color="bg-gradient-to-br from-success-500 to-emerald-700" />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Vision ─── */}
      {platform.vision && (
        <div className="rounded-2xl border border-secondary-100 bg-gradient-to-br from-secondary-50/80 to-white p-5 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-secondary-200/50 flex items-center justify-center shrink-0">
              <Target size={16} className="text-secondary-700" />
            </div>
            <div>
              <p className="text-xs font-bold text-secondary-800 mb-1">رؤية المنصة</p>
              <p className="text-sm leading-7 text-neutral-700">{platform.vision}</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Programs & Activities Section ─── */}
      <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-neutral-100 bg-gradient-to-r from-primary-50/50 to-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary-100 flex items-center justify-center">
                  <Layers size={15} className="text-primary-600" />
                </div>
                البرامج والأنشطة
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">إدارة البرامج والدورات والأنشطة المرتبطة بالمنصة.</p>
            </div>
            <Button unstyled
              onClick={openAddProgram}
              className="h-9 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              <Plus size={14} />
              إضافة برنامج
            </Button>
          </div>
        </div>

        <div className="p-6">
          {platform.programs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50 py-14 text-center">
              <div className="w-14 h-14 rounded-xl bg-neutral-100 flex items-center justify-center mx-auto mb-3">
                <BookOpen size={28} className="text-neutral-300" />
              </div>
              <p className="text-sm font-semibold text-neutral-600">لا توجد برامج في هذه المنصة</p>
              <p className="text-xs text-neutral-400 mt-1">أضف برنامجاً جديداً لبدء بناء المحتوى.</p>
              <Button unstyled onClick={openAddProgram} className="btn-primary btn-sm mt-4">
                <Plus size={14} /> إضافة برنامج
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              {platform.programs.map(program => {
                const isExpanded = expandedProgramId === program.id
                return (
                  <article key={program.id} className="overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-all duration-200 hover:shadow-md">
                    {/* ─── Program Card Header ─── */}
                    <div
                      onClick={() => setExpandedProgramId(isExpanded ? null : program.id)}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpandedProgramId(isExpanded ? null : program.id) }}}
                      role="button"
                      tabIndex={0}
                      className={`flex w-full cursor-pointer text-right transition-all ${
                        isExpanded ? 'border-b border-neutral-100' : ''
                      }`}
                    >
                      {/* Program Image - fills card height */}
                      <div className="relative w-56 shrink-0 overflow-hidden bg-white border-l border-neutral-100 max-md:hidden">
                        {program.image ? (
                          <Image
                            src={program.image}
                            alt={program.name}
                            fill
                            sizes="224px"
                            className="h-full w-full object-contain p-3"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary-50 to-secondary-100/50">
                            <BookOpen size={52} className="text-secondary-300/50" />
                          </div>
                        )}
                      </div>

                      {/* Mobile/tablet image */}
                      <div className="flex-1 p-4 md:pr-5">
                        <div className="flex items-start gap-4">
                          <div className="relative md:hidden h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-neutral-100 bg-white">
                            {program.image ? (
                              <Image src={program.image} alt={program.name} fill sizes="96px" className="object-contain p-2" unoptimized />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary-50 to-secondary-100/50">
                                <BookOpen size={28} className="text-secondary-300" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="text-base font-bold text-neutral-900 md:text-lg">{program.name}</h3>
                                  <Badge className={`text-[9px] ${
                                    program.isActive ? 'bg-success-50 text-success-700 border-success-200' : 'bg-neutral-100 text-neutral-500 border-neutral-200'
                                  }`}>
                                    {program.isActive ? 'نشط' : 'غير نشط'}
                                  </Badge>
                                </div>
                                <p className="text-xs text-neutral-500 mt-1 line-clamp-2 leading-6">{program.description}</p>
                              </div>
                            </div>

                            {/* Stats chips */}
                            <div className="mt-3 flex flex-wrap items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 rounded-lg bg-primary-50 px-2.5 py-1 text-[11px] font-medium text-primary-700 border border-primary-100">
                                <PlayCircle size={12} /> {program.activities.length} دورة
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-lg bg-secondary-50 px-2.5 py-1 text-[11px] font-medium text-secondary-700 border border-secondary-100">
                                <Users size={12} /> {program._count.enrollments} تسجيل
                              </span>
                              {program._count.projects > 0 && (
                                <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 border border-emerald-100">
                                  <FolderKanban size={12} /> {program._count.projects} مشروع
                                </span>
                              )}
                              {program._count.knowledgeItems > 0 && (
                                <span className="inline-flex items-center gap-1 rounded-lg bg-info-50 px-2.5 py-1 text-[11px] font-medium text-info-700 border border-info-100">
                                  <FileText size={12} /> {program._count.knowledgeItems} مكتبة
                                </span>
                              )}
                              {program._count.submittedReports > 0 && (
                                <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700 border border-amber-100">
                                  <BarChart3 size={12} /> {program._count.submittedReports} تقارير
                                </span>
                              )}
                              {(program.startDate || program.endDate) && (
                                <span className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-600 border border-neutral-200">
                                  <Calendar size={12} /> {dateLabel(program.startDate)} - {dateLabel(program.endDate)}
                                </span>
                              )}
                              {/* Show sort order on mobile too */}
                              <span className="md:hidden inline-flex items-center gap-1 rounded-lg bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-500 font-mono border border-neutral-200">
                                <Hash size={12} />{program.sortOrder}
                              </span>
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex shrink-0 items-start gap-1" onClick={e => e.stopPropagation()}>
                            <Button unstyled
                              onClick={(e) => { e.stopPropagation(); openEditProgram(program) }}
                              className="rounded-lg p-2 text-neutral-400 hover:bg-primary-50 hover:text-primary-600 transition-all"
                              title="تعديل البرنامج"
                            >
                              <Pencil size={14} />
                            </Button>
                            <Button unstyled
                              onClick={(e) => { e.stopPropagation(); handleDeleteProgram(program.id) }}
                              className="rounded-lg p-2 text-neutral-400 hover:bg-error-50 hover:text-error-600 transition-all"
                              title="حذف البرنامج"
                            >
                              <Trash2 size={14} />
                            </Button>
                            <div className={`p-2 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                              <ChevronDown size={16} className="text-neutral-400" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ─── Expanded: Activities ─── */}
                    {isExpanded && (
                      <div className="bg-neutral-50/70 p-5 md:p-6 space-y-5 animate-fade-in">
                        {/* Section header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-primary-100 flex items-center justify-center">
                              <PlayCircle size={14} className="text-primary-600" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-neutral-800">الدورات والأنشطة</h4>
                              <p className="text-[10px] text-neutral-400">{program.activities.length} نشاط</p>
                            </div>
                          </div>
                          <Button unstyled
                            onClick={() => openAddActivity(program.id)}
                            className="h-8 px-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold text-[11px] flex items-center gap-1.5 transition-all hover:shadow-md hover:-translate-y-0.5"
                          >
                            <Plus size={12} />
                            إضافة دورة/نشاط
                          </Button>
                        </div>

                        {/* Activity cards - VISUAL GRID WITH LARGE IMAGES */}
                        {program.activities.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-neutral-200 bg-white py-10 text-center">
                            <Activity size={24} className="text-neutral-300 mx-auto mb-2" />
                            <p className="text-sm text-neutral-400">لا توجد دورات أو أنشطة في هذا البرنامج</p>
                          </div>
                        ) : (
                          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {program.activities.map(activity => (
                              <div
                                key={activity.id}
                                className="group relative overflow-hidden rounded-xl border border-neutral-200 bg-white transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                              >
                                {/* Activity Image - fills card */}
                                <div className="relative h-44 overflow-hidden bg-white border-b border-neutral-100">
                                  {activity.icon ? (
                                    <Image
                                      src={activity.icon}
                                      alt={activity.name}
                                      fill
                                      sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
                                      className="h-full w-full object-contain p-4"
                                      unoptimized
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100/30">
                                      <Activity size={48} className="text-primary-300/40" />
                                    </div>
                                  )}
                                  {/* Image badges row */}
                                  <div className="absolute top-2 left-2 flex gap-1.5">
                                    <Badge className={`text-[9px] shadow-sm ${
                                      activity.isActive
                                        ? 'bg-white/90 text-success-700 border-success-200 backdrop-blur-sm'
                                        : 'bg-white/90 text-neutral-500 border-neutral-200 backdrop-blur-sm'
                                    }`}>
                                      {activity.isActive ? 'نشط' : 'مخفي'}
                                    </Badge>
                                  </div>
                                  <div className="absolute bottom-2 right-2">
                                    <ActivityTypeBadge type={activity.type} />
                                  </div>
                                  {/* Hover actions */}
                                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button unstyled
                                      onClick={(e) => { e.stopPropagation(); openEditActivity(activity, program.id) }}
                                      className="p-1.5 rounded-lg bg-white/90 backdrop-blur-sm text-neutral-600 hover:bg-primary-50 hover:text-primary-600 border border-white/50 shadow-sm transition-all"
                                      title="تعديل النشاط"
                                    >
                                      <Pencil size={12} />
                                    </Button>
                                    <Button unstyled
                                      onClick={(e) => { e.stopPropagation(); handleDeleteActivity(activity.id) }}
                                      className="p-1.5 rounded-lg bg-white/90 backdrop-blur-sm text-neutral-600 hover:bg-error-50 hover:text-error-600 border border-white/50 shadow-sm transition-all"
                                      title="حذف النشاط"
                                    >
                                      <Trash2 size={12} />
                                    </Button>
                                  </div>
                                </div>

                                {/* Activity details */}
                                <div className="p-4">
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="min-w-0">
                                      <h5 className="text-sm font-bold text-neutral-900">
                                        <Link
                                          href={`/ar/admin/platforms/${slug}/activities/${activity.slug}`}
                                          className="hover:text-primary-700 transition-colors no-underline group/link"
                                        >
                                          {activity.name}
                                          <ArrowLeft size={12} className="inline mr-1 text-neutral-300 group-hover/link:text-primary-500 group-hover/link:-translate-x-0.5 transition-all" />
                                        </Link>
                                      </h5>
                                    </div>
                                  </div>

                                  {/* Parsed structured details */}
                                  <div className="mb-3">
                                    <ActivityDetails description={activity.description} />
                                  </div>

                                  {/* Meta tags */}
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    {activity.isOnline && (
                                      <span className="inline-flex items-center gap-0.5 rounded-lg bg-info-50 px-2 py-0.5 text-[10px] font-medium text-info-700 border border-info-100">
                                        <Globe size={10} /> عن بعد
                                      </span>
                                    )}
                                    {activity.location && (
                                      <span className="inline-flex items-center gap-0.5 rounded-lg bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-600 truncate max-w-[120px] border border-neutral-200">
                                        <MapPin size={10} /> {activity.location}
                                      </span>
                                    )}
                                    {activity.maxParticipants && (
                                      <span className="inline-flex items-center gap-0.5 rounded-lg bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 border border-amber-100">
                                        <Users size={10} /> {activity.maxParticipants}
                                      </span>
                                    )}
                                    <span className="inline-flex items-center gap-0.5 rounded-lg bg-neutral-50 px-2 py-0.5 text-[10px] font-medium text-neutral-400 font-mono border border-neutral-200">
                                      <Hash size={9} />{activity.sortOrder}
                                    </span>
                                  </div>

                                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-neutral-100 pt-3">
                                    <Link
                                      href={`/ar/admin/platforms/${slug}/activities/${activity.slug}`}
                                      className="inline-flex items-center gap-1 rounded-lg bg-primary-50 px-2.5 py-1.5 text-[11px] font-bold text-primary-700 no-underline hover:bg-primary-100"
                                    >
                                      عرض صفحة الدورة
                                      <ArrowLeft size={11} />
                                    </Link>
                                    <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                                      <Button unstyled
                                        onClick={(e) => { e.stopPropagation(); openEditActivity(activity, program.id) }}
                                        className="text-[11px] font-semibold text-primary-600 hover:text-primary-800 flex items-center gap-1"
                                      >
                                        <Pencil size={10} /> تعديل
                                      </Button>
                                      <Button unstyled
                                        onClick={(e) => { e.stopPropagation(); handleDeleteActivity(activity.id) }}
                                        className="text-[11px] font-semibold text-error-500 hover:text-error-700 flex items-center gap-1"
                                      >
                                        <Trash2 size={10} /> حذف
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Related counts */}
                        {(program._count.projects > 0 || program._count.knowledgeItems > 0 || program._count.submittedReports > 0) && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {program._count.projects > 0 && (
                              <div className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-white px-3 py-2 shadow-sm">
                                <FolderKanban size={13} className="text-emerald-600" />
                                <span className="text-xs font-semibold text-emerald-800">{program._count.projects} مشاريع</span>
                              </div>
                            )}
                            {program._count.knowledgeItems > 0 && (
                              <div className="inline-flex items-center gap-1.5 rounded-xl border border-info-200 bg-white px-3 py-2 shadow-sm">
                                <FileText size={13} className="text-info-600" />
                                <span className="text-xs font-semibold text-info-800">{program._count.knowledgeItems} محتوى معرفي</span>
                              </div>
                            )}
                            {program._count.submittedReports > 0 && (
                              <div className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-white px-3 py-2 shadow-sm">
                                <BarChart3 size={13} className="text-amber-600" />
                                <span className="text-xs font-semibold text-amber-800">{program._count.submittedReports} تقارير</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* ─── Members + Projects ─── */}
      <div className="grid xl:grid-cols-2 gap-6">
        {/* Members */}
        <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <Users size={18} className="text-info-600" />
                أعضاء المنصة
                <span className="text-neutral-400 font-normal text-xs">({stats.members})</span>
              </h2>
              <div className="relative">
                <Search size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <Input
                  value={memberSearch}
                  onChange={e => setMemberSearch(e.target.value)}
                  className="h-9 pr-9 pl-3 rounded-xl border border-neutral-200 text-xs bg-neutral-50 w-full sm:w-[200px] placeholder:text-neutral-400 focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 transition-all"
                  placeholder="بحث في الأعضاء..."
                />
              </div>
            </div>
          </div>

          <div className="p-6">
            {filteredMembers.length === 0 ? (
              <div className="py-10 text-center">
                <Users size={28} className="text-neutral-300 mx-auto mb-2" />
                <p className="text-sm text-neutral-500">لا يوجد أعضاء مرتبطون بهذه المنصة</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-6">
                <Table className="w-full text-sm">
                  <TableHeader>
                    <TableRow className="border-b border-neutral-100">
                      <TableHead className="text-right py-3 px-6 text-[10px] text-neutral-500 font-bold">العضو</TableHead>
                      <TableHead className="text-right py-3 px-3 text-[10px] text-neutral-500 font-bold">المسار</TableHead>
                      <TableHead className="text-right py-3 px-3 text-[10px] text-neutral-500 font-bold">النشاط</TableHead>
                      <TableHead className="text-center py-3 px-3 text-[10px] text-neutral-500 font-bold">الملف</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map(member => (
                      <TableRow key={member.id} className="border-b border-neutral-50 hover:bg-neutral-50/50 transition-colors">
                        <TableCell className="py-3 px-6">
                          <p className="font-semibold text-neutral-900 text-xs">{member.name}</p>
                          <p className="text-[10px] text-neutral-400 font-mono">{member.code}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {member.programs.slice(0, 2).map(p => (
                              <span key={p.id} className="text-[9px] bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded-full">{p.name}</span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-3">
                          <Badge className="bg-secondary-50 text-secondary-700 border-secondary-200 text-[10px]">
                            <Route size={10} />
                            {member.currentStage ? STAGE_LABELS[member.currentStage] || member.currentStage : 'لم يبدأ'}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 px-3">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[11px] text-neutral-600">{member.enrollmentsCount} تسجيلات</span>
                            <span className="text-[11px] text-neutral-600">{member.participationsCount} مشاركات</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-3 text-center">
                          <Link
                            href={`/ar/admin/members/${member.id}`}
                            className="inline-flex items-center px-2.5 py-1 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 text-[10px] font-bold no-underline transition-colors"
                          >
                            الملف
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </section>

        {/* Projects */}
        <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-100">
            <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <FolderKanban size={18} className="text-success-600" />
              المشاريع المرتبطة
              <span className="text-neutral-400 font-normal text-xs">({platform.projects.length})</span>
            </h2>
          </div>

          <div className="p-6">
            {platform.projects.length === 0 ? (
              <div className="py-10 text-center">
                <FolderKanban size={28} className="text-neutral-300 mx-auto mb-2" />
                <p className="text-sm text-neutral-500">لا توجد مشاريع مرتبطة بهذه المنصة</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {platform.projects.map(project => (
                  <div key={project.id} className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4 transition-all hover:shadow-sm">
                    <div className="flex justify-between gap-3 items-start">
                      <h3 className="text-sm font-bold text-neutral-900">{project.title}</h3>
                      {project.isFeatured && (
                        <span className="shrink-0 text-[9px] bg-secondary-100 text-secondary-700 px-2 py-0.5 rounded-full font-semibold">مميز</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-white text-neutral-600 border border-neutral-200">{project.category}</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-success-50 text-success-700 border border-success-200">
                        {STATUS_LABELS[project.status] || project.status}
                      </span>
                      {project.program && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-primary-50 text-primary-700 border border-primary-200">
                          {project.program.name}
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/ar/admin/projects?search=${encodeURIComponent(project.title)}`}
                      className="inline-flex items-center gap-1 mt-3 text-[10px] font-bold text-primary-700 hover:text-primary-900 no-underline transition-colors"
                    >
                      فتح في إدارة المشاريع <ExternalLink size={11} />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ─── Program Modal ─── */}
      <Modal
        show={showProgramModal}
        onClose={() => setShowProgramModal(false)}
        title={editingProgram ? 'تعديل البرنامج' : 'إضافة برنامج جديد'}
        icon={BookOpen}
        iconColor="bg-gradient-to-br from-secondary-500 to-secondary-700"
      >
        <form onSubmit={handleProgramSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1.5">الاسم <span className="text-error-500">*</span></label>
            <Input className="input-field" value={programForm.name} onChange={e => setProgramForm({ ...programForm, name: e.target.value })} required placeholder="اسم البرنامج" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1.5">الرابط المختصر <span className="text-error-500">*</span></label>
              <Input className="input-field font-mono text-xs" value={programForm.slug} onChange={e => setProgramForm({ ...programForm, slug: e.target.value })} required dir="ltr" placeholder="program-slug" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1.5">الترتيب</label>
              <Input type="number" className="input-field" value={programForm.sortOrder} onChange={e => setProgramForm({ ...programForm, sortOrder: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1.5">الوصف <span className="text-error-500">*</span></label>
            <Textarea className="input-field" rows={2} value={programForm.description} onChange={e => setProgramForm({ ...programForm, description: e.target.value })} required placeholder="وصف البرنامج..." />
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1.5">رابط الصورة</label>
            <Input className="input-field text-xs" value={programForm.image || ''} onChange={e => setProgramForm({ ...programForm, image: e.target.value })} dir="ltr" placeholder="https://example.com/image.jpg" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
            <Button unstyled type="button" onClick={() => setShowProgramModal(false)} className="btn-ghost btn-sm">إلغاء</Button>
            <Button unstyled type="submit" className="btn-primary btn-sm" disabled={submitting}>
              {submitting ? 'جارٍ الحفظ...' : editingProgram ? 'تحديث البرنامج' : 'إضافة البرنامج'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─── Activity Modal ─── */}
      <Modal
        show={showActivityModal}
        onClose={() => setShowActivityModal(false)}
        title={editingActivity ? 'تعديل النشاط' : 'إضافة نشاط جديد'}
        icon={Activity}
        iconColor="bg-gradient-to-br from-info-500 to-blue-700"
      >
        <form onSubmit={handleActivitySubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1.5">الاسم <span className="text-error-500">*</span></label>
            <Input className="input-field" value={activityForm.name} onChange={e => setActivityForm({ ...activityForm, name: e.target.value })} required placeholder="اسم النشاط" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1.5">الرابط المختصر <span className="text-error-500">*</span></label>
              <Input className="input-field font-mono text-xs" value={activityForm.slug} onChange={e => setActivityForm({ ...activityForm, slug: e.target.value })} required dir="ltr" placeholder="activity-slug" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1.5">الترتيب</label>
              <Input type="number" className="input-field" value={activityForm.sortOrder} onChange={e => setActivityForm({ ...activityForm, sortOrder: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1.5">نوع النشاط</label>
              <NativeSelect className="input-field" value={activityForm.type} onChange={e => setActivityForm({ ...activityForm, type: e.target.value })}>
                {ACTIVITY_TYPE_LIST.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </NativeSelect>
            </div>
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1.5">الحد الأقصى للمشاركين</label>
              <Input type="number" className="input-field" value={activityForm.maxParticipants} onChange={e => setActivityForm({ ...activityForm, maxParticipants: e.target.value })} placeholder="اختياري" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1.5">الموقع</label>
            <Input className="input-field" value={activityForm.location} onChange={e => setActivityForm({ ...activityForm, location: e.target.value })} placeholder="المقر، المدينة، أو رابط اللقاء" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1.5">الوصف <span className="text-error-500">*</span></label>
            <Textarea className="input-field" rows={2} value={activityForm.description} onChange={e => setActivityForm({ ...activityForm, description: e.target.value })} required placeholder="وصف النشاط..." />
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1.5">رابط الصورة</label>
            <Input className="input-field text-xs" value={activityForm.icon} onChange={e => setActivityForm({ ...activityForm, icon: e.target.value })} dir="ltr" placeholder="https://example.com/image.jpg" />
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <Input type="checkbox" checked={activityForm.isOnline} onChange={e => setActivityForm({ ...activityForm, isOnline: e.target.checked })} className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500" />
              <span className="text-sm text-neutral-700 font-medium">نشاط عن بعد</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Input type="checkbox" checked={activityForm.isActive} onChange={e => setActivityForm({ ...activityForm, isActive: e.target.checked })} className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500" />
              <span className="text-sm text-neutral-700 font-medium">نشط</span>
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
            <Button unstyled type="button" onClick={() => setShowProgramModal(false)} className="btn-ghost btn-sm">إلغاء</Button>
            <Button unstyled type="submit" className="btn-primary btn-sm" disabled={submitting}>
              {submitting ? 'جارٍ الحفظ...' : editingActivity ? 'تحديث النشاط' : 'إضافة النشاط'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
