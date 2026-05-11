'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  Activity,
  ArrowLeft,
  Award,
  BadgeCheck,
  Briefcase,
  Calendar,
  CheckCircle,
  Circle,
  Clock3,
  ExternalLink,
  FileText,
  GraduationCap,
  Hash,
  Image as ImageIcon,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Route,
  UserRoundCheck,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'

type MemberType = 'BENEFICIARY' | 'TEAM' | 'BOTH'
type MemberStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'

interface PlatformRef {
  id: string
  name: string
  slug: string
  color: string | null
}

interface MemberProfile {
  id: string
  code: string
  firstName: string
  lastName: string
  name: string
  email: string | null
  phone: string | null
  gender: string | null
  birthDate: string | null
  educationLevel: string | null
  nationality: string | null
  country: string | null
  city: string | null
  bio: string | null
  avatar: string | null
  status: MemberStatus
  registeredAt: string
  updatedAt: string
  type: MemberType
  role: string | null
  slug: string | null
  linkedinUrl: string | null
  memberSince: string | null
  interests: string | null
  currentStage: string | null
  currentStageStartedAt: string | null
}

interface JourneyStage {
  id: string
  stage: string
  startedAt: string
  completedAt: string | null
  notes: string | null
}

interface Enrollment {
  id: string
  status: string
  enrolledAt: string
  completedAt: string | null
  notes: string | null
  program: {
    id: string
    name: string
    slug: string
    description: string
    startDate: string | null
    endDate: string | null
    platform: PlatformRef
  }
}

interface Participation {
  id: string
  status: string
  attendedAt: string | null
  score: number | null
  feedback: string | null
  certificateUrl: string | null
  createdAt: string
  enrollment: { id: string; status: string; programId: string } | null
  activity: {
    id: string
    name: string
    slug: string
    description: string
    type: string
    location: string | null
    isOnline: boolean
    startDate: string | null
    endDate: string | null
    program: {
      id: string
      name: string
      slug: string
      platform: PlatformRef
    }
  }
}

interface MemberDetailData {
  member: MemberProfile
  stats: {
    enrollments: number
    activeEnrollments: number
    completedEnrollments: number
    participations: number
    attendedParticipations: number
    certificatesCount: number
    platforms: number
  }
  platforms: PlatformRef[]
  journeyStages: JourneyStage[]
  enrollments: Enrollment[]
  participations: Participation[]
}

interface ApiResponse {
  success: boolean
  message?: string
  data?: MemberDetailData
}

const STAGE_ORDER = ['DISCOVERY', 'APPLICATION', 'ONBOARDING', 'ACTIVE', 'ADVANCED', 'GRADUATED', 'ALUMNI', 'CHAMPION']

const STAGE_CONFIG: Record<string, { label: string; description: string; color: string; iconColor: string }> = {
  DISCOVERY: { label: 'اكتشاف', description: 'تعرف على الشبكة أو وصل إليها لأول مرة.', color: 'bg-neutral-50 border-neutral-200', iconColor: 'text-neutral-500' },
  APPLICATION: { label: 'تقديم', description: 'سجل بياناته أو قدم طلب الانضمام.', color: 'bg-primary-50 border-primary-100', iconColor: 'text-primary-600' },
  ONBOARDING: { label: 'تأهيل', description: 'بدأ التأهيل أو الارتباط ببرنامج.', color: 'bg-primary-50 border-primary-100', iconColor: 'text-primary-700' },
  ACTIVE: { label: 'نشط', description: 'يشارك حالياً في برنامج أو نشاط.', color: 'bg-success-50 border-success-100', iconColor: 'text-success-700' },
  ADVANCED: { label: 'متقدم', description: 'لديه مشاركة متقدمة أو إنجازات متراكمة.', color: 'bg-secondary-50 border-secondary-100', iconColor: 'text-secondary-700' },
  GRADUATED: { label: 'متخرج', description: 'أكمل برنامجاً أو أكثر بنجاح.', color: 'bg-info-50 border-info-100', iconColor: 'text-info-700' },
  ALUMNI: { label: 'خريج', description: 'ضمن شبكة الخريجين ويمكن إعادة إشراكه.', color: 'bg-primary-50 border-primary-200', iconColor: 'text-primary-800' },
  CHAMPION: { label: 'سفير', description: 'عضو مؤثر يمكنه دعم أو قيادة أعضاء آخرين.', color: 'bg-secondary-50 border-secondary-200', iconColor: 'text-secondary-800' },
}

const TYPE_CONFIG: Record<MemberType, { label: string; color: string; icon: LucideIcon }> = {
  BENEFICIARY: { label: 'مستفيد', color: 'bg-primary-100 text-primary-700', icon: UserRoundCheck },
  TEAM: { label: 'فريق العمل', color: 'bg-secondary-100 text-secondary-700', icon: Briefcase },
  BOTH: { label: 'مستفيد وفريق', color: 'bg-info-50 text-info-700', icon: Users },
}

const STATUS_CONFIG: Record<MemberStatus, { label: string; color: string }> = {
  ACTIVE: { label: 'نشط', color: 'bg-success-50 text-success-700' },
  INACTIVE: { label: 'غير نشط', color: 'bg-neutral-100 text-neutral-500' },
  SUSPENDED: { label: 'معلق', color: 'bg-error-50 text-error-700' },
}

const EDUCATION_LABELS: Record<string, string> = {
  HIGH_SCHOOL: 'ثانوية',
  DIPLOMA: 'دبلوم',
  BACHELOR: 'بكالوريوس',
  MASTER: 'ماجستير',
  DOCTORATE: 'دكتوراه',
  OTHER: 'أخرى',
}

const ENROLLMENT_STATUS: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'قيد المراجعة', color: 'bg-neutral-100 text-neutral-600' },
  ACTIVE: { label: 'نشط', color: 'bg-success-50 text-success-700' },
  COMPLETED: { label: 'مكتمل', color: 'bg-info-50 text-info-700' },
  DROPPED: { label: 'منسحب', color: 'bg-warning-50 text-warning-700' },
  REJECTED: { label: 'مرفوض', color: 'bg-error-50 text-error-700' },
}

const PARTICIPATION_STATUS: Record<string, { label: string; color: string }> = {
  REGISTERED: { label: 'مسجل', color: 'bg-neutral-100 text-neutral-600' },
  ATTENDED: { label: 'حضر', color: 'bg-success-50 text-success-700' },
  COMPLETED: { label: 'أتم', color: 'bg-info-50 text-info-700' },
  ABSENT: { label: 'غائب', color: 'bg-warning-50 text-warning-700' },
  CANCELLED: { label: 'ملغى', color: 'bg-error-50 text-error-700' },
}

const ACTIVITY_TYPES: Record<string, string> = {
  WORKSHOP: 'ورشة',
  BOOTCAMP: 'معسكر',
  HACKATHON: 'هاكاثون',
  SEMINAR: 'ندوة',
  COMPETITION: 'مسابقة',
  MENTORING: 'إرشاد',
  COURSE: 'دورة',
  EVENT: 'فعالية',
  OTHER: 'أخرى',
}

function Badge({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {children}
    </span>
  )
}

function dateLabel(value: string | null | undefined) {
  return value ? new Date(value).toLocaleDateString('ar-SA') : 'غير محدد'
}

function initials(name: string) {
  const letters = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
  return letters || 'ع'
}

function InfoItem({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: LucideIcon
  label: string
  value: string | null | undefined
  href?: string
}) {
  if (!value) return null

  const content = (
    <div className="flex items-start gap-3 rounded-xl border border-neutral-100 bg-neutral-50 p-3">
      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-neutral-500 shrink-0">
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-neutral-400 mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-neutral-800 break-words">{value}</p>
      </div>
    </div>
  )

  return href ? (
    <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noreferrer' : undefined} className="block no-underline">
      {content}
    </a>
  ) : content
}

function EmptyState({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="text-center py-10 rounded-xl border border-dashed border-neutral-200 bg-neutral-50">
      <Icon size={28} className="text-neutral-300 mx-auto mb-2" />
      <p className="text-sm text-neutral-400">{text}</p>
    </div>
  )
}

export default function AdminMemberDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const [data, setData] = useState<MemberDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  const refreshMember = useCallback(async ({
    sync = false,
    quiet = false,
    loadingState = true,
  }: {
    sync?: boolean
    quiet?: boolean
    loadingState?: boolean
  } = {}) => {
    if (!id) return

    if (loadingState) setLoading(true)

    if (sync) {
      setSyncing(true)
      try {
        const syncRes = await fetch('/api/admin/journey', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ beneficiaryId: id }),
        })
        const syncData = await syncRes.json()
        if (!quiet) {
          if (syncData.success) toast.success('تم تحديث مسار العضو حسب النشاط')
          else toast.error(syncData.message || 'تعذر تحديث المسار')
        }
      } catch {
        if (!quiet) toast.error('فشل الاتصال أثناء تحديث المسار')
      } finally {
        setSyncing(false)
      }
    }

    try {
      const res = await fetch(`/api/admin/members/${id}`)
      const json = (await res.json()) as ApiResponse
      if (json.success && json.data) {
        setData(json.data)
      } else {
        toast.error(json.message || 'تعذر تحميل ملف العضو')
        setData(null)
      }
    } catch {
      toast.error('فشل الاتصال بالخادم')
      setData(null)
    } finally {
      if (loadingState) setLoading(false)
    }
  }, [id])

  useEffect(() => {
    refreshMember({ sync: true, quiet: true })
  }, [refreshMember])

  const currentStageIndex = useMemo(() => {
    if (!data?.member.currentStage) return -1
    return STAGE_ORDER.indexOf(data.member.currentStage)
  }, [data])

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <RefreshCw size={34} className="text-primary-600 animate-spin mx-auto" />
            <p className="mt-4 text-neutral-500">جاري تحميل ملف العضو...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="card text-center py-12">
          <Users size={40} className="text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-500">تعذر تحميل ملف العضو</p>
          <Link href="/ar/admin/members" className="btn-primary btn-sm mt-4 no-underline inline-flex">
            العودة إلى إدارة الأعضاء
          </Link>
        </div>
      </div>
    )
  }

  const { member, stats } = data
  const typeCfg = TYPE_CONFIG[member.type]
  const statusCfg = STATUS_CONFIG[member.status]
  const TypeIcon = typeCfg.icon
  const currentStageCfg = member.currentStage ? STAGE_CONFIG[member.currentStage] : null

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4 border-b border-neutral-200 pb-5 mb-6">
        <div>
          <Link href="/ar/admin/members" className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-primary-700 no-underline mb-3">
            <ArrowLeft size={16} />
            العودة إلى إدارة الأعضاء
          </Link>
          <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900 mb-2">ملف العضو التفصيلي</h1>
          <p className="text-sm text-neutral-500 max-w-3xl leading-relaxed">
            هذا الملف يجمع بيانات العضو وحساباته وتسجيلاته ومشاركاته ومسار تطوره في مكان واحد مرتبط بالرقم الموحد.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => refreshMember({ sync: true, quiet: false, loadingState: false })}
            disabled={syncing}
            className="btn-primary btn-sm flex items-center gap-1.5"
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'تحديث المسار...' : 'تحديث Journey'}
          </button>
          <Link href={`/ar/admin/members?search=${encodeURIComponent(member.code)}`} className="btn-ghost btn-sm no-underline flex items-center gap-1.5">
            <FileText size={14} />
            تعديل البيانات
          </Link>
        </div>
      </div>

      <div className="card mb-6">
        <div className="flex flex-col lg:flex-row gap-5">
          <div className="w-28 h-28 rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-center overflow-hidden shrink-0">
            {member.avatar ? (
              <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-primary-700">{initials(member.name)}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-neutral-900 break-words">{member.name}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge className={typeCfg.color}>
                    <TypeIcon size={12} />
                    {typeCfg.label}
                  </Badge>
                  <Badge className={statusCfg.color}>{statusCfg.label}</Badge>
                  {currentStageCfg && (
                    <Badge className="bg-secondary-50 text-secondary-700">
                      <Route size={12} />
                      {currentStageCfg.label}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-left lg:text-right">
                <p className="text-[11px] text-neutral-400">الرقم الموحد</p>
                <p className="font-mono text-sm font-bold text-neutral-900">{member.code}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
              {[
                { label: 'المنصات', value: stats.platforms, icon: Hash, color: 'bg-primary-100 text-primary-700' },
                { label: 'التسجيلات', value: stats.enrollments, icon: GraduationCap, color: 'bg-secondary-100 text-secondary-700' },
                { label: 'المشاركات', value: stats.participations, icon: Activity, color: 'bg-info-50 text-info-700' },
                { label: 'الشهادات', value: stats.certificatesCount, icon: Award, color: 'bg-success-50 text-success-700' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="rounded-xl border border-neutral-100 bg-neutral-50 p-3 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
                    <Icon size={17} />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-neutral-900">{value}</p>
                    <p className="text-[11px] text-neutral-500">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            {(member.role || member.bio) && (
              <div className="mt-5 rounded-xl border border-neutral-100 bg-white p-4">
                {member.role && <p className="text-sm font-bold text-neutral-900 mb-1">{member.role}</p>}
                {member.bio && <p className="text-sm text-neutral-600 leading-relaxed">{member.bio}</p>}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-6">
          <section className="card">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
              <div>
                <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                  <Route size={19} className="text-primary-600" />
                  مسار تطور العضو (Journey)
                </h2>
                <p className="text-xs text-neutral-500 mt-1">
                  يتم تحديث هذا المسار تلقائياً عند فتح الملف، ويمكن إعادة تحليله حسب البرامج والأنشطة من زر تحديث Journey.
                </p>
              </div>
              {currentStageCfg && (
                <Badge className="bg-primary-50 text-primary-700">
                  المرحلة الحالية: {currentStageCfg.label}
                </Badge>
              )}
            </div>

            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
              {STAGE_ORDER.map((stageKey, index) => {
                const stage = data.journeyStages.find(item => item.stage === stageKey)
                const cfg = STAGE_CONFIG[stageKey]
                const isCurrent = member.currentStage === stageKey
                const isCompleted = !!stage?.completedAt || (currentStageIndex > index)
                const reached = !!stage || isCompleted || isCurrent

                return (
                  <div
                    key={stageKey}
                    className={`rounded-xl border p-3 min-h-[132px] ${reached ? cfg.color : 'bg-white border-neutral-100'} ${isCurrent ? 'ring-2 ring-primary-100' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${reached ? 'bg-white' : 'bg-neutral-50'} ${cfg.iconColor}`}>
                        {isCompleted ? <CheckCircle size={17} /> : isCurrent ? <Clock3 size={17} /> : <Circle size={17} />}
                      </div>
                      <span className="text-[10px] text-neutral-400 font-mono">{index + 1}</span>
                    </div>
                    <p className="font-bold text-sm text-neutral-900">{cfg.label}</p>
                    <p className="text-[11px] text-neutral-500 leading-relaxed mt-1">{stage?.notes || cfg.description}</p>
                    <p className="text-[10px] text-neutral-400 mt-3">
                      {stage ? `بدأت: ${dateLabel(stage.startedAt)}` : 'لم يصل إليها بعد'}
                    </p>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="card">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                  <GraduationCap size={19} className="text-secondary-600" />
                  البرامج والتسجيلات
                </h2>
                <p className="text-xs text-neutral-500 mt-1">كل برنامج مرتبط بالعضو مع حالة التسجيل والمنصة التابعة له.</p>
              </div>
              <Badge className="bg-secondary-50 text-secondary-700">{stats.completedEnrollments} مكتملة</Badge>
            </div>

            {data.enrollments.length === 0 ? (
              <EmptyState icon={GraduationCap} text="لا توجد تسجيلات برامج لهذا العضو بعد" />
            ) : (
              <div className="space-y-3">
                {data.enrollments.map(enrollment => {
                  const status = ENROLLMENT_STATUS[enrollment.status] || ENROLLMENT_STATUS.PENDING
                  return (
                    <div key={enrollment.id} className="rounded-xl border border-neutral-100 p-4">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="font-bold text-neutral-900">{enrollment.program.name}</h3>
                            <Badge className={status.color}>{status.label}</Badge>
                          </div>
                          <p className="text-sm text-neutral-500 leading-relaxed line-clamp-2">{enrollment.program.description}</p>
                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-neutral-400 mt-3">
                            <span className="inline-flex items-center gap-1">
                              <Calendar size={12} />
                              التسجيل: {dateLabel(enrollment.enrolledAt)}
                            </span>
                            {enrollment.completedAt && <span>الإكمال: {dateLabel(enrollment.completedAt)}</span>}
                          </div>
                        </div>
                        <Link href={`/ar/admin/platforms/${enrollment.program.platform.slug}`} className="btn-ghost btn-sm no-underline shrink-0 inline-flex items-center gap-1.5">
                          {enrollment.program.platform.name}
                          <ExternalLink size={13} />
                        </Link>
                      </div>
                      {enrollment.notes && <p className="text-xs text-neutral-500 mt-3 border-t border-neutral-100 pt-3">{enrollment.notes}</p>}
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <section className="card">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                  <Activity size={19} className="text-primary-600" />
                  الأنشطة والمشاركات
                </h2>
                <p className="text-xs text-neutral-500 mt-1">حضور العضو في الورش والدورات والفعاليات، مع النتيجة والشهادة عند توفرها.</p>
              </div>
              <Badge className="bg-success-50 text-success-700">{stats.attendedParticipations} حضور</Badge>
            </div>

            {data.participations.length === 0 ? (
              <EmptyState icon={Activity} text="لا توجد مشاركات أنشطة لهذا العضو بعد" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50">
                      <th className="text-right py-3 px-3 text-xs text-neutral-500 font-bold">النشاط</th>
                      <th className="text-right py-3 px-3 text-xs text-neutral-500 font-bold">البرنامج</th>
                      <th className="text-right py-3 px-3 text-xs text-neutral-500 font-bold">الحالة</th>
                      <th className="text-right py-3 px-3 text-xs text-neutral-500 font-bold">النتيجة</th>
                      <th className="text-center py-3 px-3 text-xs text-neutral-500 font-bold">الشهادة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.participations.map(participation => {
                      const status = PARTICIPATION_STATUS[participation.status] || PARTICIPATION_STATUS.REGISTERED
                      return (
                        <tr key={participation.id} className="border-b border-neutral-100">
                          <td className="py-3 px-3">
                            <p className="font-semibold text-neutral-900 text-xs">{participation.activity.name}</p>
                            <div className="flex flex-wrap gap-2 text-[10px] text-neutral-400 mt-1">
                              <span>{ACTIVITY_TYPES[participation.activity.type] || participation.activity.type}</span>
                              <span>{participation.activity.isOnline ? 'عن بعد' : participation.activity.location || 'حضوري'}</span>
                              <span>{dateLabel(participation.activity.startDate || participation.createdAt)}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <Link href={`/ar/admin/platforms/${participation.activity.program.platform.slug}`} className="text-primary-700 hover:text-primary-900 no-underline font-semibold text-xs">
                              {participation.activity.program.name}
                            </Link>
                            <p className="text-[10px] text-neutral-400">{participation.activity.program.platform.name}</p>
                          </td>
                          <td className="py-3 px-3">
                            <Badge className={status.color}>{status.label}</Badge>
                          </td>
                          <td className="py-3 px-3 text-neutral-600">
                            {participation.score !== null ? participation.score : 'غير محدد'}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {participation.certificateUrl ? (
                              <a href={participation.certificateUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] font-bold text-success-700 bg-success-50 hover:bg-success-100 px-2 py-1 rounded-lg no-underline">
                                <BadgeCheck size={12} />
                                فتح
                              </a>
                            ) : (
                              <span className="text-[10px] text-neutral-300">لا يوجد</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card">
            <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2 mb-4">
              <Mail size={18} className="text-primary-600" />
              الحسابات والتواصل
            </h2>
            <div className="space-y-3">
              <InfoItem icon={Mail} label="البريد الإلكتروني" value={member.email} href={member.email ? `mailto:${member.email}` : undefined} />
              <InfoItem icon={Phone} label="رقم الجوال" value={member.phone} href={member.phone ? `tel:${member.phone}` : undefined} />
              <InfoItem icon={Linkedin} label="LinkedIn" value={member.linkedinUrl} href={member.linkedinUrl || undefined} />
              <InfoItem icon={Hash} label="الرابط المختصر" value={member.slug} />
              <InfoItem icon={ImageIcon} label="رابط الصورة" value={member.avatar} href={member.avatar || undefined} />
            </div>
          </section>

          <section className="card">
            <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2 mb-4">
              <MapPin size={18} className="text-secondary-600" />
              البيانات الشخصية
            </h2>
            <div className="space-y-3">
              <InfoItem icon={MapPin} label="الموقع" value={[member.country, member.city].filter(Boolean).join(' - ') || null} />
              <InfoItem icon={Users} label="الجنسية" value={member.nationality} />
              <InfoItem icon={GraduationCap} label="المؤهل" value={member.educationLevel ? EDUCATION_LABELS[member.educationLevel] || member.educationLevel : null} />
              <InfoItem icon={Calendar} label="تاريخ التسجيل" value={dateLabel(member.registeredAt)} />
              <InfoItem icon={Calendar} label="آخر تحديث" value={dateLabel(member.updatedAt)} />
            </div>
          </section>

          <section className="card">
            <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2 mb-4">
              <Briefcase size={18} className="text-info-700" />
              المنصات المرتبطة
            </h2>
            {data.platforms.length === 0 ? (
              <EmptyState icon={Briefcase} text="لم يرتبط العضو بأي منصة بعد" />
            ) : (
              <div className="space-y-2">
                {data.platforms.map(platform => (
                  <Link
                    key={platform.id}
                    href={`/ar/admin/platforms/${platform.slug}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-neutral-100 bg-neutral-50 hover:bg-white p-3 no-underline transition-colors"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: platform.color || '#527F47' }} />
                      <span className="font-semibold text-sm text-neutral-800 truncate">{platform.name}</span>
                    </span>
                    <ExternalLink size={13} className="text-neutral-400 shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </section>

          {member.interests && (
            <section className="card">
              <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2 mb-3">
                <Award size={18} className="text-success-700" />
                الاهتمامات
              </h2>
              <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-wrap">{member.interests}</p>
            </section>
          )}
        </aside>
      </div>
    </div>
  )
}
