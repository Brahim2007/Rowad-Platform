'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import {
  ArrowLeft, Activity, BookOpen, Users, Globe, MapPin,
  Hash, Target, BarChart3, Award, CheckCircle, Clock,
  BadgeCheck, ClipboardCheck, FileText, GraduationCap, Mail, MessageSquare, Star,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ───

interface ActivityDetail {
  id: string
  name: string
  slug: string
  description: string
  type: string
  icon: string | null
  location: string | null
  isOnline: boolean
  startDate: string | null
  endDate: string | null
  maxParticipants: number | null
  sortOrder: number
  isActive: boolean
  createdAt: string
  program: {
    id: string
    name: string
    slug: string
    sortOrder: number
    platform: {
      id: string
      name: string
      slug: string
      color: string | null
      logo: string | null
    }
  }
  participationStats: {
    total: number
    registered: number
    attended: number
    completed: number
    absent: number
  }
  participations: ParticipationItem[]
  evaluations: EvaluationItem[]
  _count: {
    participations: number
    evaluations: number
  }
}

interface ParticipationItem {
  id: string
  status: string
  attendedAt: string | null
  score: number | null
  feedback: string | null
  certificateUrl: string | null
  createdAt: string
  beneficiary: {
    id: string
    code: string
    firstName: string
    lastName: string
    email: string | null
    country: string | null
    city: string | null
    avatar: string | null
  }
}

interface EvaluationItem {
  id: string
  title: string
  evaluator: string
  evaluatorRole: string | null
  type: string
  score: number | null
  maxScore: number
  feedback: string | null
  recommendations: string | null
  status: string
  evaluatedAt: string
}

// ─── Constants ───

const ACTIVITY_TYPES: Record<string, string> = {
  WORKSHOP: 'ورشة', BOOTCAMP: 'معسكر', HACKATHON: 'هاكاثون', SEMINAR: 'ندوة',
  COMPETITION: 'مسابقة', MENTORING: 'إرشاد', COURSE: 'دورة', EVENT: 'فعالية', OTHER: 'أخرى',
}

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

const PARTICIPATION_LABELS: Record<string, string> = {
  REGISTERED: 'مسجل',
  ATTENDED: 'حضر',
  COMPLETED: 'أتم',
  ABSENT: 'غائب',
  CANCELLED: 'ملغى',
}

const PARTICIPATION_COLORS: Record<string, string> = {
  REGISTERED: 'bg-info-50 text-info-700 border-info-200',
  ATTENDED: 'bg-primary-50 text-primary-700 border-primary-200',
  COMPLETED: 'bg-success-50 text-success-700 border-success-200',
  ABSENT: 'bg-amber-50 text-amber-700 border-amber-200',
  CANCELLED: 'bg-neutral-100 text-neutral-600 border-neutral-200',
}

const EVALUATION_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'مسودة',
  FINAL: 'نهائي',
  APPROVED: 'معتمد',
}

const EVALUATION_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  FINAL: 'bg-primary-50 text-primary-700 border-primary-200',
  APPROVED: 'bg-success-50 text-success-700 border-success-200',
}

// ─── Parse description into structured fields ───

interface DetailField {
  icon: string
  label: string
  value: string
}

function parseDescription(description: string | null): { fields: DetailField[]; raw: string | null } {
  if (!description) return { fields: [], raw: null }

  const parts = description.split('|').map(s => s.trim())
  const fields: DetailField[] = []

  for (const part of parts) {
    const instructorMatch = part.match(/^المحاضر:\s*(.+)/)
    const durationMatch = part.match(/^المدة:\s*(.+)/)
    const lessonsMatch = part.match(/^عدد الدروس:\s*(.+)/)
    const locationMatch = part.match(/^الموقع:\s*(.+)/)
    const dateMatch = part.match(/^التاريخ:\s*(.+)/)
    const linkMatch = part.match(/^الرابط:\s*(.+)/)

    if (instructorMatch) fields.push({ icon: '🎓', label: 'المحاضر', value: instructorMatch[1] })
    else if (durationMatch) fields.push({ icon: '⏱', label: 'المدة', value: durationMatch[1] })
    else if (lessonsMatch) fields.push({ icon: '📚', label: 'عدد الدروس', value: lessonsMatch[1] })
    else if (locationMatch) fields.push({ icon: '📍', label: 'الموقع', value: locationMatch[1] })
    else if (dateMatch) fields.push({ icon: '📅', label: 'التاريخ', value: dateMatch[1] })
    else if (linkMatch) fields.push({ icon: '🔗', label: 'الرابط', value: linkMatch[1] })
  }

  return { fields, raw: fields.length > 0 ? null : description }
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString('ar') : 'غير محدد'
}

function scorePercent(score: number | null, maxScore: number) {
  if (score === null || !maxScore) return null
  return Math.round((score / maxScore) * 100)
}

// ─── Stat Card ───

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: string | number; icon: any; color: string
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-neutral-200 bg-white p-4 transition-all hover:shadow-md hover:-translate-y-0.5 group">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110 ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
        <div>
          <div className="text-xl font-bold text-neutral-900 tabular-nums">{value}</div>
          <div className="text-xs text-neutral-500 mt-0.5">{label}</div>
        </div>
      </div>
    </div>
  )
}

// ─── Badge ───

function Badge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${className}`}>
      {children}
    </span>
  )
}

// ─── Main Page ───

export default function AdminActivityDetailPage() {
  const params = useParams()
  const platformSlug = params.slug as string
  const activitySlug = params.activitySlug as string
  const [data, setData] = useState<ActivityDetail | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchActivity = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/activities/${activitySlug}`)
      const json = await res.json()
      if (json.success) setData(json.data)
      else toast.error(json.message || 'فشل تحميل بيانات النشاط')
    } catch { toast.error('فشل الاتصال بالخادم') }
    finally { setLoading(false) }
  }, [activitySlug])

  useEffect(() => { fetchActivity() }, [fetchActivity])

  // ─── Loading ───

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="relative w-12 h-12 mx-auto">
              <div className="absolute inset-0 border-4 border-primary-100 rounded-full" />
              <div className="absolute inset-0 border-4 border-transparent border-t-primary-600 rounded-full animate-spin" />
            </div>
            <p className="mt-4 text-sm text-neutral-400 animate-pulse">جاري تحميل النشاط...</p>
          </div>
        </div>
      </div>
    )
  }

  // ─── Error ───

  if (!data) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-white shadow-sm py-16 text-center">
          <Activity size={40} className="text-neutral-300 mx-auto mb-4" />
          <p className="text-lg font-semibold text-neutral-900 mb-1">تعذر تحميل النشاط</p>
          <p className="text-sm text-neutral-500 mb-6">قد يكون هذا النشاط غير موجود أو تم حذفه.</p>
          <Link href={`/ar/admin/platforms/${platformSlug}`} className="btn-primary btn-sm no-underline inline-flex">
            <ArrowLeft size={16} /> العودة للمنصة
          </Link>
        </div>
      </div>
    )
  }

  const activity = data
  const platform = activity.program.platform
  const platformColor = platform.color || '#527F47'
  const { fields, raw } = parseDescription(activity.description)

  // Stats calculations
  const completionRate = activity.participationStats.total > 0
    ? Math.round((activity.participationStats.completed / activity.participationStats.total) * 100)
    : 0
  const attendanceRate = activity.participationStats.total > 0
    ? Math.round(((activity.participationStats.attended + activity.participationStats.completed) / activity.participationStats.total) * 100)
    : 0

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in">
      {/* ─── Breadcrumb ─── */}
      <div className="flex items-center gap-2 text-xs text-neutral-400 mb-4">
        <Link href="/ar/admin/platforms" className="hover:text-primary-700 no-underline transition-colors">المنصات</Link>
        <span>/</span>
        <Link href={`/ar/admin/platforms/${platformSlug}`} className="hover:text-primary-700 no-underline transition-colors">{platform.name}</Link>
        <span>/</span>
        <span className="text-neutral-600 font-medium">{activity.name}</span>
      </div>

      {/* ─── Hero Section ─── */}
      <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden mb-6">
        {/* Image Banner */}
        <div className="relative h-56 md:h-64 overflow-hidden bg-gradient-to-br from-neutral-100 to-neutral-200">
          {activity.icon ? (
            <div className="relative flex h-full w-full items-center justify-center bg-white p-8 md:p-12">
              <Image
                src={activity.icon}
                alt={activity.name}
                fill
                sizes="100vw"
                className="h-full w-full object-contain"
                unoptimized
              />
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100/30">
              <Activity size={80} className="text-primary-300/40" />
            </div>
          )}
          {/* Gradient overlay at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/30 to-transparent" />

          {/* Type badge on image */}
          <div className="absolute top-4 right-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold border shadow-sm bg-white/90 backdrop-blur-sm ${ACTIVITY_TYPE_COLORS[activity.type] || ACTIVITY_TYPE_COLORS.OTHER}`}>
              {ACTIVITY_TYPES[activity.type] || activity.type || 'نشاط'}
            </span>
          </div>

          {/* Status */}
          <div className="absolute top-4 left-4">
            <Badge className={`shadow-sm ${
              activity.isActive
                ? 'bg-white/90 text-success-700 border-success-200 backdrop-blur-sm'
                : 'bg-white/90 text-neutral-500 border-neutral-200 backdrop-blur-sm'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${activity.isActive ? 'bg-success-500' : 'bg-neutral-400'} ml-1 inline-block`} />
              {activity.isActive ? 'نشط' : 'غير نشط'}
            </Badge>
          </div>
        </div>

        {/* Info Section */}
        <div className="px-6 md:px-8 pb-6">
          {/* Overlapping title area */}
          <div className="flex items-end gap-5 -mt-12 mb-5">
            <div
              className="relative h-20 w-20 md:h-24 md:w-24 shrink-0 rounded-2xl border-4 border-white shadow-xl overflow-hidden flex items-center justify-center bg-white"
              style={{ boxShadow: `0 4px 24px ${platformColor}30` }}
            >
              {activity.icon ? (
                <Image src={activity.icon} alt="" fill sizes="96px" className="object-contain p-2" unoptimized />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-100 to-primary-50">
                  <Activity size={32} className="text-primary-400" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 pt-12">
              <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-1">{activity.name}</h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-500">
                <span className="text-neutral-400 font-mono text-xs">/{activity.slug}</span>
                <span className="text-neutral-300">|</span>
                <Link
                  href={`/ar/admin/platforms/${platformSlug}`}
                  className="flex items-center gap-1 text-primary-700 hover:text-primary-900 no-underline font-medium"
                >
                  <BookOpen size={14} />
                  {activity.program.name}
                </Link>
                <span className="text-neutral-300">|</span>
                <span className="flex items-center gap-1" style={{ color: platformColor }}>
                  <Target size={14} />
                  {platform.name}
                </span>
              </div>
            </div>
          </div>

          {/* Detail Fields Grid */}
          {fields.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
              {fields.map((field, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50/50 p-3.5"
                >
                  <div className="w-9 h-9 rounded-lg bg-white border border-neutral-200 flex items-center justify-center shrink-0 shadow-sm">
                    <span className="text-base">{field.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{field.label}</p>
                    <p className="text-sm font-semibold text-neutral-800 truncate">{field.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Raw description fallback */}
          {raw && (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4 mb-5">
              <p className="text-sm text-neutral-700 leading-7">{raw}</p>
            </div>
          )}

          {/* Additional Meta Chips */}
          <div className="flex flex-wrap items-center gap-2">
            {activity.isOnline && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-info-50 px-3 py-1.5 text-xs font-medium text-info-700 border border-info-100">
                <Globe size={13} /> عن بعد
              </span>
            )}
            {activity.location && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-600 border border-neutral-200">
                <MapPin size={13} /> {activity.location}
              </span>
            )}
            {activity.maxParticipants && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 border border-amber-100">
                <Users size={13} /> الحد الأقصى: {activity.maxParticipants} مشارك
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-500 border border-neutral-200">
              <Hash size={13} /> الترتيب: {activity.sortOrder}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-500 border border-neutral-200">
              <Clock size={13} /> {new Date(activity.createdAt).toLocaleDateString('ar')}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Stats ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="إجمالي المشاركات" value={activity.participationStats.total} icon={Users} color="bg-gradient-to-br from-primary-500 to-primary-700" />
        <StatCard label="مكتمل" value={activity.participationStats.completed} icon={Award} color="bg-gradient-to-br from-success-500 to-emerald-700" />
        <StatCard label="نسبة الحضور" value={`${attendanceRate}%`} icon={CheckCircle} color="bg-gradient-to-br from-info-500 to-blue-700" />
        <StatCard label="نسبة الإنجاز" value={`${completionRate}%`} icon={Target} color="bg-gradient-to-br from-secondary-500 to-secondary-700" />
      </div>

      {/* ─── Course Content & Data ─── */}
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] mb-6">
        <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-neutral-100 bg-gradient-to-l from-primary-50/50 to-white">
            <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary-100 flex items-center justify-center">
                <FileText size={14} className="text-primary-600" />
              </div>
              محتوى الدورة
            </h2>
          </div>
          <div className="p-5 space-y-4">
            {raw ? (
              <p className="text-sm leading-8 text-neutral-700">{raw}</p>
            ) : fields.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {fields.map((field, index) => (
                  <div key={`${field.label}-${index}`} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                    <p className="mb-1 text-[11px] font-bold text-neutral-400">{field.label}</p>
                    <p className="text-sm font-semibold leading-7 text-neutral-800">{field.value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 py-8 text-center text-sm text-neutral-400">
                لم يتم إدخال محتوى تفصيلي لهذه الدورة بعد.
              </p>
            )}

            <div className="rounded-xl border border-secondary-100 bg-secondary-50/40 p-4">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-secondary-800">
                <GraduationCap size={14} />
                البرنامج والمنصة
              </p>
              <p className="text-sm leading-7 text-neutral-700">
                هذه الدورة ضمن برنامج <span className="font-bold text-neutral-900">{activity.program.name}</span> في منصة{' '}
                <span className="font-bold" style={{ color: platformColor }}>{platform.name}</span>.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-neutral-100 bg-gradient-to-l from-secondary-50/50 to-white">
            <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-secondary-100 flex items-center justify-center">
                <BadgeCheck size={14} className="text-secondary-600" />
              </div>
              بيانات الدورة
            </h2>
          </div>
          <div className="p-5">
            <dl className="grid gap-3 text-sm">
              {[
                { label: 'نوع الدورة', value: ACTIVITY_TYPES[activity.type] || activity.type || 'نشاط' },
                { label: 'تاريخ البداية', value: formatDate(activity.startDate) },
                { label: 'تاريخ النهاية', value: formatDate(activity.endDate) },
                { label: 'طريقة التنفيذ', value: activity.isOnline ? 'عن بعد' : 'حضوري/ميداني' },
                { label: 'الموقع', value: activity.location || 'غير محدد' },
                { label: 'الحد الأقصى للمشاركين', value: activity.maxParticipants ? `${activity.maxParticipants} مشارك` : 'غير محدد' },
                { label: 'عدد التقييمات', value: activity._count.evaluations },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between gap-4 rounded-xl border border-neutral-100 bg-neutral-50 px-3 py-2.5">
                  <dt className="text-xs font-bold text-neutral-500">{item.label}</dt>
                  <dd className="text-left text-sm font-semibold text-neutral-900">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ─── Extra Info Grid ─── */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Program Info */}
        <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-neutral-100 bg-gradient-to-l from-secondary-50/50 to-white">
            <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-secondary-100 flex items-center justify-center">
                <BookOpen size={14} className="text-secondary-600" />
              </div>
              البرنامج التابع له
            </h2>
          </div>
          <div className="p-5">
            <Link
              href={`/ar/admin/platforms/${platformSlug}`}
              className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 border border-neutral-200 hover:bg-primary-50 hover:border-primary-200 transition-all no-underline group"
            >
              <div className="h-12 w-12 rounded-xl overflow-hidden border border-neutral-100 bg-white flex items-center justify-center shrink-0">
                <BookOpen size={22} className="text-secondary-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-neutral-900 group-hover:text-primary-700 transition-colors">{activity.program.name}</p>
                <p className="text-xs text-neutral-500">عرض البرنامج <ArrowLeft size={12} className="inline group-hover:-translate-x-0.5 transition-transform" /></p>
              </div>
            </Link>

            <Link
              href={`/ar/admin/platforms/${platformSlug}`}
              className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 border border-neutral-200 hover:bg-primary-50 hover:border-primary-200 transition-all no-underline group mt-2"
              style={{ borderColor: `${platformColor}20` }}
            >
              <div
                className="h-12 w-12 rounded-xl overflow-hidden border flex items-center justify-center shrink-0"
                style={{ borderColor: `${platformColor}30`, backgroundColor: `${platformColor}10` }}
              >
                <Target size={20} style={{ color: platformColor }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-neutral-900 group-hover:text-primary-700 transition-colors">{platform.name}</p>
                <p className="text-xs text-neutral-500">عرض المنصة <ArrowLeft size={12} className="inline group-hover:-translate-x-0.5 transition-transform" /></p>
              </div>
            </Link>
          </div>
        </div>

        {/* Participation Breakdown */}
        <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-neutral-100 bg-gradient-to-l from-primary-50/50 to-white">
            <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary-100 flex items-center justify-center">
                <BarChart3 size={14} className="text-primary-600" />
              </div>
              تفاصيل المشاركات
            </h2>
          </div>
          <div className="p-5 space-y-3">
            {[
              { label: 'مسجل', value: activity.participationStats.registered, color: 'bg-info-500', barColor: 'bg-info-100' },
              { label: 'حضر', value: activity.participationStats.attended, color: 'bg-primary-500', barColor: 'bg-primary-100' },
              { label: 'أتم', value: activity.participationStats.completed, color: 'bg-success-500', barColor: 'bg-success-100' },
              { label: 'غائب', value: activity.participationStats.absent, color: 'bg-amber-500', barColor: 'bg-amber-100' },
            ].map(item => {
              const max = Math.max(activity.participationStats.total, 1)
              const pct = Math.round((item.value / max) * 100)
              return (
                <div key={item.label}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium text-neutral-600">{item.label}</span>
                    <span className="text-xs font-bold text-neutral-800">{item.value}</span>
                  </div>
                  <div className={`h-2 rounded-full ${item.barColor} overflow-hidden`}>
                    <div className={`h-full rounded-full ${item.color} transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
            <div className="pt-2 border-t border-neutral-100 flex justify-between">
              <span className="text-xs font-bold text-neutral-500">المجموع</span>
              <span className="text-sm font-bold text-neutral-900">{activity.participationStats.total}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Participants ─── */}
      <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden mb-6">
        <div className="px-5 py-3.5 border-b border-neutral-100 bg-gradient-to-l from-info-50/50 to-white">
          <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-info-100 flex items-center justify-center">
              <Users size={14} className="text-info-600" />
            </div>
            المشاركون في الدورة
          </h2>
        </div>
        <div className="p-5">
          {activity.participations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 py-10 text-center">
              <Users size={30} className="mx-auto mb-2 text-neutral-300" />
              <p className="text-sm text-neutral-500">لا توجد مشاركات مسجلة لهذه الدورة بعد</p>
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {activity.participations.map(participation => {
                const member = participation.beneficiary
                const memberName = `${member.firstName} ${member.lastName}`
                return (
                  <div key={participation.id} className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-3">
                    <div className="flex items-start gap-3">
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-neutral-200 bg-white">
                        {member.avatar ? (
                          <Image src={member.avatar} alt={memberName} fill sizes="44px" className="object-cover" unoptimized />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-primary-50 text-sm font-bold text-primary-700">
                            {memberName.trim().slice(0, 2)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <Link href={`/ar/admin/members/${member.id}`} className="text-sm font-bold text-neutral-900 no-underline hover:text-primary-700">
                            {memberName}
                          </Link>
                          <Badge className={PARTICIPATION_COLORS[participation.status] || PARTICIPATION_COLORS.REGISTERED}>
                            {PARTICIPATION_LABELS[participation.status] || participation.status}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-2 text-[11px] text-neutral-500">
                          <span className="font-mono">{member.code}</span>
                          {member.email && <span className="inline-flex items-center gap-1"><Mail size={11} />{member.email}</span>}
                          {(member.country || member.city) && <span>{[member.country, member.city].filter(Boolean).join(' - ')}</span>}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                          <span className="rounded-lg bg-white px-2 py-1 text-neutral-600 ring-1 ring-neutral-200">
                            التسجيل: {formatDate(participation.createdAt)}
                          </span>
                          {participation.attendedAt && (
                            <span className="rounded-lg bg-white px-2 py-1 text-neutral-600 ring-1 ring-neutral-200">
                              الحضور: {formatDate(participation.attendedAt)}
                            </span>
                          )}
                          {participation.score !== null && (
                            <span className="rounded-lg bg-success-50 px-2 py-1 font-bold text-success-700 ring-1 ring-success-100">
                              الدرجة: {participation.score}
                            </span>
                          )}
                          {participation.certificateUrl && (
                            <a href={participation.certificateUrl} target="_blank" rel="noreferrer" className="rounded-lg bg-secondary-50 px-2 py-1 font-bold text-secondary-700 no-underline ring-1 ring-secondary-100">
                              شهادة
                            </a>
                          )}
                        </div>
                        {participation.feedback && (
                          <p className="mt-2 rounded-lg bg-white px-3 py-2 text-xs leading-6 text-neutral-600 ring-1 ring-neutral-100">{participation.feedback}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* ─── Evaluations ─── */}
      <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-neutral-100 bg-gradient-to-l from-success-50/50 to-white">
          <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-success-100 flex items-center justify-center">
              <ClipboardCheck size={14} className="text-success-600" />
            </div>
            تقييمات الدورة
          </h2>
        </div>
        <div className="p-5">
          {activity.evaluations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 py-10 text-center">
              <ClipboardCheck size={30} className="mx-auto mb-2 text-neutral-300" />
              <p className="text-sm text-neutral-500">لا توجد تقييمات لهذه الدورة بعد</p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {activity.evaluations.map(evaluation => {
                const pct = scorePercent(evaluation.score, evaluation.maxScore)
                return (
                  <article key={evaluation.id} className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-neutral-900">{evaluation.title}</h3>
                        <p className="mt-1 text-xs text-neutral-500">بواسطة {evaluation.evaluator}</p>
                      </div>
                      <Badge className={EVALUATION_STATUS_COLORS[evaluation.status] || EVALUATION_STATUS_COLORS.DRAFT}>
                        {EVALUATION_STATUS_LABELS[evaluation.status] || evaluation.status}
                      </Badge>
                    </div>
                    <div className="mb-3 grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-white p-3 ring-1 ring-neutral-100">
                        <p className="text-[11px] font-bold text-neutral-400">الدرجة</p>
                        <p className="mt-1 flex items-center gap-1 text-lg font-bold text-neutral-900">
                          <Star size={15} className="text-secondary-500" />
                          {evaluation.score ?? '-'} / {evaluation.maxScore}
                        </p>
                      </div>
                      <div className="rounded-lg bg-white p-3 ring-1 ring-neutral-100">
                        <p className="text-[11px] font-bold text-neutral-400">النسبة</p>
                        <p className="mt-1 text-lg font-bold text-primary-700">{pct === null ? '-' : `${pct}%`}</p>
                      </div>
                    </div>
                    {evaluation.feedback && (
                      <p className="mb-2 rounded-lg bg-white px-3 py-2 text-xs leading-6 text-neutral-600 ring-1 ring-neutral-100">
                        <MessageSquare size={12} className="ml-1 inline text-primary-500" />
                        {evaluation.feedback}
                      </p>
                    )}
                    {evaluation.recommendations && (
                      <p className="rounded-lg bg-success-50 px-3 py-2 text-xs leading-6 text-success-800 ring-1 ring-success-100">
                        {evaluation.recommendations}
                      </p>
                    )}
                    <p className="mt-3 text-[11px] text-neutral-400">{formatDate(evaluation.evaluatedAt)}</p>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
