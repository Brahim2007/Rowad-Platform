'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import {
  Activity, Award, Briefcase, Calendar, CheckCircle, ExternalLink,
  GraduationCap, Hash, Image, Linkedin, Mail, MapPin, Pencil,
  Phone, Plus, RefreshCw, Route, Search, Trash2,
  UserRoundCheck, Users, X, Zap,
} from 'lucide-react'
import { toast } from 'sonner'

type MemberType = 'BENEFICIARY' | 'TEAM' | 'BOTH'
type MemberStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
type MemberTab = 'all' | 'beneficiaries' | 'team'

interface JourneyStage {
  id: string
  stage: string
  startedAt: string
  completedAt: string | null
  notes: string | null
}

interface UnifiedMember {
  id: string
  code: string
  name: string
  firstName: string
  lastName: string
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
  type: MemberType
  role: string | null
  slug: string | null
  linkedinUrl: string | null
  memberSince: string | null
  sortOrder: number
  interests: string | null
  currentStage: string | null
  currentStageStartedAt: string | null
  enrollmentsCount: number
  participationsCount: number
}

interface MemberFormState {
  code: string
  firstName: string
  lastName: string
  email: string
  phone: string
  gender: string
  birthDate: string
  educationLevel: string
  nationality: string
  country: string
  city: string
  bio: string
  avatar: string
  status: MemberStatus
  type: MemberType
  role: string
  slug: string
  linkedinUrl: string
  sortOrder: number
  interests: string
}

const STAGE_ORDER = ['DISCOVERY', 'APPLICATION', 'ONBOARDING', 'ACTIVE', 'ADVANCED', 'GRADUATED', 'ALUMNI', 'CHAMPION']

const STAGE_CONFIG: Record<string, { label: string; color: string; barColor: string; textColor: string }> = {
  DISCOVERY: { label: 'اكتشاف', color: 'bg-neutral-100', barColor: 'bg-neutral-300', textColor: 'text-neutral-600' },
  APPLICATION: { label: 'تقديم', color: 'bg-primary-100', barColor: 'bg-primary-300', textColor: 'text-primary-700' },
  ONBOARDING: { label: 'تأهيل', color: 'bg-primary-100', barColor: 'bg-primary-400', textColor: 'text-primary-800' },
  ACTIVE: { label: 'نشط', color: 'bg-success-50', barColor: 'bg-success-500', textColor: 'text-success-700' },
  ADVANCED: { label: 'متقدم', color: 'bg-secondary-100', barColor: 'bg-secondary-500', textColor: 'text-secondary-800' },
  GRADUATED: { label: 'متخرج', color: 'bg-info-50', barColor: 'bg-info-500', textColor: 'text-info-700' },
  ALUMNI: { label: 'خريج', color: 'bg-primary-50', barColor: 'bg-primary-600', textColor: 'text-primary-900' },
  CHAMPION: { label: 'سفير', color: 'bg-secondary-50', barColor: 'bg-secondary-600', textColor: 'text-secondary-900' },
}

const TYPE_CONFIG: Record<MemberType, { label: string; color: string; icon: LucideIcon }> = {
  BENEFICIARY: { label: 'مستفيد', color: 'bg-primary-100 text-primary-700', icon: UserRoundCheck },
  TEAM: { label: 'فريق', color: 'bg-secondary-100 text-secondary-700', icon: Briefcase },
  BOTH: { label: 'مستفيد وفريق', color: 'bg-info-50 text-info-700', icon: Users },
}

const TYPE_HELP: Record<MemberType, { title: string; description: string; example: string }> = {
  BENEFICIARY: {
    title: 'المستفيدون',
    description: 'أشخاص يتلقون خدمات الشبكة أو يشاركون في البرامج والأنشطة، ويتم تتبع تطورهم من التسجيل حتى التخرج أو الانضمام للشبكة.',
    example: 'مثال: شاب مسجل في برنامج أو مشارك في ورشة.',
  },
  TEAM: {
    title: 'فريق العمل',
    description: 'أشخاص ينفذون أو يديرون أعمال الشبكة مثل التنسيق، الإرشاد، إدارة المبادرات، أو التشغيل.',
    example: 'مثال: منسق منصة، مرشد، مدير مشروع.',
  },
  BOTH: {
    title: 'مستفيد وفريق',
    description: 'يستخدم عندما يتطور المستفيد لاحقاً ليصبح متطوعاً أو قائداً أو عضواً في الفريق، مع الحفاظ على نفس الرقم الموحد.',
    example: 'مثال: خريج برنامج أصبح مرشداً للمستفيدين الجدد.',
  },
}

const STAGE_HELP: Record<string, string> = {
  DISCOVERY: 'تعرف على الشبكة أو وصل إليها لأول مرة.',
  APPLICATION: 'سجل بياناته أو قدم طلب الانضمام.',
  ONBOARDING: 'بدأ التأهيل أو الارتباط ببرنامج.',
  ACTIVE: 'يشارك حالياً في برنامج أو نشاط.',
  ADVANCED: 'لديه نشاط متقدم أو أكمل جزءاً مهماً من المسار.',
  GRADUATED: 'أكمل برنامجاً أو أكثر بنجاح.',
  ALUMNI: 'أصبح ضمن شبكة الخريجين ويمكن إعادة إشراكه.',
  CHAMPION: 'عضو مؤثر أو سفير يمكنه قيادة أو دعم أعضاء آخرين.',
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

const COUNTRIES = ['سوريا', 'الأردن', 'مصر', 'لبنان', 'الجزائر', 'المغرب', 'السعودية', 'تونس', 'اليمن', 'الإمارات', 'فلسطين', 'العراق']

const emptyForm: MemberFormState = {
  code: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  gender: '',
  birthDate: '',
  educationLevel: '',
  nationality: '',
  country: '',
  city: '',
  bio: '',
  avatar: '',
  status: 'ACTIVE',
  type: 'BENEFICIARY',
  role: '',
  slug: '',
  linkedinUrl: '',
  sortOrder: 0,
  interests: '',
}

const tabToType: Record<MemberTab, string> = {
  all: '',
  beneficiaries: 'BENEFICIARY',
  team: 'TEAM',
}

function Badge({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {children}
    </span>
  )
}

function initialTabFromUrl(): MemberTab {
  if (typeof window === 'undefined') return 'all'
  const type = new URLSearchParams(window.location.search).get('type')
  if (type === 'team') return 'team'
  if (type === 'beneficiaries') return 'beneficiaries'
  return 'all'
}

function memberToForm(member: UnifiedMember): MemberFormState {
  return {
    code: member.code,
    firstName: member.firstName,
    lastName: member.lastName,
    email: member.email || '',
    phone: member.phone || '',
    gender: member.gender || '',
    birthDate: member.birthDate ? member.birthDate.slice(0, 10) : '',
    educationLevel: member.educationLevel || '',
    nationality: member.nationality || '',
    country: member.country || '',
    city: member.city || '',
    bio: member.bio || '',
    avatar: member.avatar || '',
    status: member.status,
    type: member.type,
    role: member.role || '',
    slug: member.slug || '',
    linkedinUrl: member.linkedinUrl || '',
    sortOrder: member.sortOrder,
    interests: member.interests || '',
  }
}

function getApiMessage(data: { message?: string; error?: string; errors?: { formErrors?: string[]; fieldErrors?: Record<string, string[]> } }) {
  if (data.message || data.error) return data.message || data.error
  const firstField = data.errors?.fieldErrors ? Object.values(data.errors.fieldErrors).flat()[0] : null
  return firstField || data.errors?.formErrors?.[0] || 'حدث خطأ'
}

function isTeamLike(type: MemberType) {
  return type === 'TEAM' || type === 'BOTH'
}

function StageProgressBar({ currentStage }: { currentStage: string | null }) {
  if (!currentStage) return <span className="text-xs text-neutral-400">لم يبدأ</span>

  const index = STAGE_ORDER.indexOf(currentStage)
  if (index === -1) return <span className="text-xs text-neutral-400">{currentStage}</span>

  const config = STAGE_CONFIG[currentStage]
  const progress = Math.round(((index + 1) / STAGE_ORDER.length) * 100)

  return (
    <div className="flex items-center gap-2 min-w-[150px]">
      <div className="h-1.5 flex-1 bg-neutral-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${config.barColor}`} style={{ width: `${progress}%` }} />
      </div>
      <span className={`text-[10px] font-bold whitespace-nowrap ${config.textColor}`}>
        {config.label}
      </span>
    </div>
  )
}

function JourneyTimelineModal({
  member,
  stages,
  onClose,
  onRefresh,
}: {
  member: UnifiedMember
  stages: JourneyStage[]
  onClose: () => void
  onRefresh: () => void
}) {
  const [localStages, setLocalStages] = useState(stages)
  const [busy, setBusy] = useState(false)
  const currentStage = localStages.reduce<string | null>((latest, stage) => {
    const latestIdx = latest ? STAGE_ORDER.indexOf(latest) : -1
    const stageIdx = STAGE_ORDER.indexOf(stage.stage)
    return stageIdx > latestIdx ? stage.stage : latest
  }, member.currentStage)
  const currentStageIdx = currentStage ? STAGE_ORDER.indexOf(currentStage) : -1

  const refreshStages = async () => {
    const res = await fetch(`/api/admin/journey?beneficiaryId=${member.id}`)
    const data = await res.json()
    if (data.success) setLocalStages(data.data || [])
  }

  const autoAdvance = async () => {
    setBusy(true)
    try {
      const res = await fetch('/api/admin/journey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ beneficiaryId: member.id }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`تم تحديث المسار إلى "${data.data.label}"`)
        await refreshStages()
        onRefresh()
      } else {
        toast.error(getApiMessage(data))
      }
    } catch {
      toast.error('فشل تحديث المسار')
    } finally {
      setBusy(false)
    }
  }

  const moveToStage = async (stage: string) => {
    setBusy(true)
    try {
      const res = await fetch('/api/admin/journey', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ beneficiaryId: member.id, stage }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`تم النقل إلى "${STAGE_CONFIG[stage]?.label || stage}"`)
        await refreshStages()
        onRefresh()
      } else {
        toast.error(getApiMessage(data))
      }
    } catch {
      toast.error('فشل النقل')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-auto max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center bg-neutral-50 sticky top-0 z-10">
          <h3 className="font-bold text-neutral-900 flex items-center gap-2">
            <Route className="text-primary-600" size={20} />
            مسار تطور العضو
          </h3>
          <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-error-500 hover:bg-error-50 rounded-lg transition-colors" aria-label="إغلاق">
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-5 bg-primary-50 p-4 rounded-xl border border-primary-200">
            <div className="flex justify-between items-start gap-3">
              <div>
                <p className="font-bold text-neutral-900 text-lg">{member.name}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{member.email || member.phone || 'لا توجد بيانات تواصل'}</p>
              </div>
              <Badge className="font-mono text-[10px] bg-white text-primary-700 border border-primary-200">{member.code}</Badge>
            </div>
            <div className="flex flex-wrap gap-3 mt-3 text-xs text-neutral-600">
              {member.country && <span className="flex items-center gap-1"><MapPin size={12} /> {member.country}</span>}
              {member.role && <span className="flex items-center gap-1"><Briefcase size={12} /> {member.role}</span>}
              <span className="flex items-center gap-1"><Activity size={12} /> {member.participationsCount} مشاركات</span>
              <span className="flex items-center gap-1"><Award size={12} /> {member.enrollmentsCount} تسجيلات</span>
            </div>
          </div>

          <button
            onClick={autoAdvance}
            disabled={busy}
            className="w-full mb-6 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
          >
            {busy ? <RefreshCw size={16} className="animate-spin" /> : <Zap size={16} />}
            {busy ? 'جاري التحديث...' : 'إعادة تحليل النشاط'}
          </button>
          <p className="text-[11px] text-neutral-400 text-center -mt-4 mb-6">
            يتم تحديث المسار تلقائياً عند فتح Journey، وهذا الزر لإعادة التحليل عند الحاجة فقط.
          </p>

          <div className="relative border-r-2 border-neutral-200 pr-6 space-y-5">
            {STAGE_ORDER.map((stageKey, i) => {
              const stage = localStages.find(s => s.stage === stageKey)
              const isCompleted = !!stage?.completedAt
              const isCurrent = currentStageIdx === i
              const isPast = currentStageIdx > i
              const config = STAGE_CONFIG[stageKey]
              const dotColor = isCompleted ? 'bg-primary-500' : isCurrent ? 'bg-secondary-500' : isPast ? 'bg-primary-400' : 'bg-neutral-300'

              return (
                <div key={stageKey} className="relative">
                  <div className={`absolute -right-[25px] top-0.5 w-5 h-5 rounded-full border-4 border-white flex items-center justify-center shadow-sm ${dotColor}`}>
                    {isCompleted && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                  <div className={`p-3 rounded-xl border ${isCurrent ? 'bg-secondary-50 border-secondary-200' : isCompleted ? 'bg-primary-50/50 border-primary-100' : 'bg-neutral-50 border-neutral-100'}`}>
                    <div className="flex items-center justify-between gap-3">
                      <h4 className={`font-bold text-sm ${isCurrent ? 'text-secondary-700' : isCompleted ? 'text-primary-700' : 'text-neutral-400'}`}>
                        {config.label}
                      </h4>
                      {stage?.startedAt && (
                        <span className="text-[10px] text-neutral-400">{new Date(stage.startedAt).toLocaleDateString('ar')}</span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-1 leading-relaxed">
                      {stage?.notes || (stage ? 'مرحلة موثقة ضمن ملف العضو.' : 'لم يصل العضو إلى هذه المرحلة بعد.')}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200">
          <p className="text-xs font-bold text-neutral-600 mb-2">نقل يدوي إلى مرحلة:</p>
          <div className="flex flex-wrap gap-1.5">
            {STAGE_ORDER.map(stageKey => {
              const isReached = currentStageIdx >= STAGE_ORDER.indexOf(stageKey)
              return (
                <button
                  key={stageKey}
                  disabled={busy || isReached}
                  onClick={() => moveToStage(stageKey)}
                  className={`text-[10px] px-2 py-1 rounded-lg border transition-colors ${
                    isReached
                      ? 'bg-primary-100 border-primary-200 text-primary-600 cursor-not-allowed opacity-60'
                      : 'bg-white border-neutral-200 text-neutral-500 hover:border-primary-300 hover:text-primary-600'
                  }`}
                >
                  {STAGE_CONFIG[stageKey]?.label || stageKey}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminMembersPage() {
  const [members, setMembers] = useState<UnifiedMember[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<MemberTab>('all')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [stageFilter, setStageFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<UnifiedMember | null>(null)
  const [form, setForm] = useState<MemberFormState>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [journeyMember, setJourneyMember] = useState<UnifiedMember | null>(null)
  const [journeyStages, setJourneyStages] = useState<JourneyStage[]>([])
  const [syncingJourneyId, setSyncingJourneyId] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const querySearch = params.get('search')
    const queryStage = params.get('stage')

    setActiveTab(initialTabFromUrl())
    if (querySearch) setSearch(querySearch)
    if (queryStage && STAGE_ORDER.includes(queryStage)) setStageFilter(queryStage)
  }, [])

  const fetchMembers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (tabToType[activeTab]) params.set('type', tabToType[activeTab])
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)

      const res = await fetch(`/api/admin/members?${params}`)
      const data = await res.json()
      if (data.success) setMembers(data.data || [])
      else toast.error(getApiMessage(data))
    } catch {
      toast.error('فشل تحميل الأعضاء')
    } finally {
      setLoading(false)
    }
  }, [activeTab, search, statusFilter])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  const stats = useMemo(() => ({
    total: members.length,
    beneficiaries: members.filter(m => m.type === 'BENEFICIARY' || m.type === 'BOTH').length,
    team: members.filter(m => m.type === 'TEAM' || m.type === 'BOTH').length,
    active: members.filter(m => m.status === 'ACTIVE').length,
  }), [members])

  const journeyDistribution = useMemo(() => {
    const total = Math.max(members.length, 1)
    return STAGE_ORDER.map(stage => {
      const count = members.filter(m => m.currentStage === stage).length
      return {
        stage,
        count,
        pct: Math.round((count / total) * 100),
        config: STAGE_CONFIG[stage],
      }
    })
  }, [members])

  const displayedMembers = useMemo(() => (
    stageFilter ? members.filter(member => member.currentStage === stageFilter) : members
  ), [members, stageFilter])

  const openCreate = () => {
    const type: MemberType = activeTab === 'team' ? 'TEAM' : activeTab === 'beneficiaries' ? 'BENEFICIARY' : 'BENEFICIARY'
    setEditing(null)
    setForm({ ...emptyForm, type })
    setShowModal(true)
  }

  const openEdit = (member: UnifiedMember) => {
    setEditing(member)
    setForm(memberToForm(member))
    setShowModal(true)
  }

  const openJourney = async (member: UnifiedMember) => {
    setSyncingJourneyId(member.id)
    try {
      const syncRes = await fetch('/api/admin/journey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ beneficiaryId: member.id }),
      })
      const syncData = await syncRes.json()
      if (!syncData.success) toast.error(getApiMessage(syncData))

      const stagesRes = await fetch(`/api/admin/journey?beneficiaryId=${member.id}`)
      const stagesData = await stagesRes.json()
      setJourneyStages(stagesData.success ? stagesData.data || [] : [])
      setJourneyMember({
        ...member,
        currentStage: syncData.success ? syncData.data.stage : member.currentStage,
      })

      if (syncData.success) await fetchMembers()
    } catch {
      setJourneyStages([])
      setJourneyMember(member)
      toast.error('فشل مزامنة مسار العضو')
    } finally {
      setSyncingJourneyId(null)
    }
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      const payload = { ...form, sortOrder: Number(form.sortOrder) || 0 }
      const res = await fetch('/api/admin/members', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing ? { id: editing.id, ...payload } : payload),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(editing ? 'تم تحديث العضو' : 'تم إنشاء العضو')
        setShowModal(false)
        await fetchMembers()
      } else {
        toast.error(getApiMessage(data))
      }
    } catch {
      toast.error('فشل حفظ العضو')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (member: UnifiedMember) => {
    if (!confirm(`هل تريد حذف ملف ${member.name}؟`)) return
    try {
      const res = await fetch(`/api/admin/members?id=${member.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('تم حذف العضو')
        await fetchMembers()
      } else {
        toast.error(getApiMessage(data))
      }
    } catch {
      toast.error('فشل حذف العضو')
    }
  }

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('')
    setStageFilter('')
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-6 gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900 mb-2 flex items-center gap-3">
            <Users className="text-primary-600" size={28} />
            إدارة الأعضاء
          </h1>
          <p className="text-neutral-500 max-w-2xl text-sm">
            ملف واحد لكل شخص، سواء كان مستفيداً أو ضمن الفريق أو الاثنين معاً.
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary btn-sm flex items-center gap-2">
          <Plus size={18} />
          عضو جديد
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'إجمالي الأعضاء', value: stats.total, icon: Users, color: 'bg-primary-100 text-primary-600' },
          { label: 'مستفيدون', value: stats.beneficiaries, icon: UserRoundCheck, color: 'bg-info-50 text-info-600' },
          { label: 'فريق العمل', value: stats.team, icon: Briefcase, color: 'bg-secondary-100 text-secondary-600' },
          { label: 'نشطون', value: stats.active, icon: CheckCircle, color: 'bg-success-50 text-success-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card flex items-center gap-3 p-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}><Icon size={18} /></div>
            <div>
              <div className="text-lg font-bold text-neutral-900">{value}</div>
              <div className="text-xs text-neutral-500">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card mb-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <Users size={18} className="text-primary-600" />
              دليل نوع العضوية
            </h2>
            <p className="text-xs text-neutral-500 mt-1 max-w-3xl leading-relaxed">
              النظام يعتمد ملفاً موحداً لكل شخص. عند تغير دور الشخص لا تنشئ ملفاً جديداً؛ عدل نوع العضوية حتى يبقى السجل والمسار والأنشطة مرتبطة بنفس الرقم الموحد.
            </p>
          </div>
          <Badge className="bg-success-50 text-success-700 self-start">
            <CheckCircle size={12} />
            رقم موحد لكل شخص
          </Badge>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          {(Object.entries(TYPE_HELP) as Array<[MemberType, (typeof TYPE_HELP)[MemberType]]>).map(([type, help]) => {
            const Icon = TYPE_CONFIG[type].icon
            return (
              <div key={type} className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${TYPE_CONFIG[type].color}`}>
                    <Icon size={16} />
                  </span>
                  <h3 className="text-sm font-bold text-neutral-900">{help.title}</h3>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">{help.description}</p>
                <p className="text-[11px] text-neutral-400 mt-2 leading-relaxed">{help.example}</p>
              </div>
            )
          })}
        </div>
      </div>

      <div className="card mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <Route size={18} className="text-primary-600" />
              مسار تطور الأعضاء (Journey)
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              المسار يوضح أين وصل العضو داخل الشبكة. يبدأ من الاكتشاف والتقديم، ثم التأهيل والنشاط، وقد يتقدم إلى خريج أو سفير حسب المشاركة والإنجاز.
            </p>
          </div>
          <button
            onClick={() => setStageFilter('')}
            className="btn-ghost btn-sm flex items-center gap-1.5 self-start lg:self-auto"
          >
            <RefreshCw size={14} />
            عرض كل المراحل
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-3 mb-4">
          <div className="rounded-xl border border-primary-100 bg-primary-50 p-3">
            <h3 className="text-xs font-bold text-primary-800 mb-1">كيف تقرأه؟</h3>
            <p className="text-[11px] text-primary-900/75 leading-relaxed">
              الرقم داخل كل مرحلة هو عدد الأعضاء الموجودين في تلك المرحلة حالياً. النسبة توضح وزن المرحلة من نتائج البحث الحالية.
            </p>
          </div>
          <div className="rounded-xl border border-secondary-100 bg-secondary-50 p-3">
            <h3 className="text-xs font-bold text-secondary-800 mb-1">كيف تستخدمه؟</h3>
            <p className="text-[11px] text-secondary-900/75 leading-relaxed">
              اضغط على أي مرحلة لتصفية الجدول، ثم افتح زر Journey في صف العضو لعرض التفاصيل أو تحديث المرحلة حسب النشاط.
            </p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
            <h3 className="text-xs font-bold text-neutral-800 mb-1">متى يتغير؟</h3>
            <p className="text-[11px] text-neutral-600 leading-relaxed">
              يتغير المسار عند تسجيل العضو في البرامج، حضوره للأنشطة، إكماله للمسارات، أو عند نقله يدوياً من نافذة Journey.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {journeyDistribution.map(({ stage, count, pct, config }) => (
            <button
              key={stage}
              onClick={() => setStageFilter(stage)}
              className={`min-h-[76px] p-2.5 rounded-xl border text-center transition-colors ${
                stageFilter === stage
                  ? 'border-primary-300 ring-2 ring-primary-100 bg-white'
                  : `${config.color} border-transparent hover:border-primary-200`
              }`}
              title={`عرض أعضاء مرحلة ${config.label}`}
            >
              <div className={`text-lg font-bold ${config.textColor}`}>{count}</div>
              <div className={`text-[10px] font-bold ${config.textColor}`}>{config.label}</div>
              <div className="text-[9px] text-neutral-400">{pct}%</div>
            </button>
          ))}
        </div>

        <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {STAGE_ORDER.map(stage => (
            <div key={stage} className="rounded-lg bg-white border border-neutral-100 p-2">
              <p className={`text-[11px] font-bold ${STAGE_CONFIG[stage].textColor}`}>{STAGE_CONFIG[stage].label}</p>
              <p className="text-[10px] text-neutral-500 leading-relaxed mt-1">{STAGE_HELP[stage]}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4 items-center justify-between">
        <div>
          <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl w-fit">
            {([
              { key: 'all', label: 'الكل', icon: Users },
              { key: 'beneficiaries', label: 'المستفيدون', icon: UserRoundCheck },
              { key: 'team', label: 'فريق العمل', icon: Briefcase },
            ] as const).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === key ? 'bg-white text-primary-700 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-neutral-400 mt-2">
            تبويب المستفيدين يعرض من يتلقى الخدمات أو يشارك في البرامج، وتبويب فريق العمل يعرض من ينفذ أو يدير أو يرشد داخل الشبكة.
          </p>
        </div>
      </div>

      <div className="card mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pr-9 h-10 text-sm"
              placeholder="بحث بالاسم أو الكود أو البريد أو الدور"
            />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field h-10 text-sm min-w-[130px]">
            <option value="">كل الحالات</option>
            {Object.entries(STATUS_CONFIG).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
          </select>
          <select value={stageFilter} onChange={e => setStageFilter(e.target.value)} className="input-field h-10 text-sm min-w-[130px]">
            <option value="">كل المراحل</option>
            {STAGE_ORDER.map(stage => <option key={stage} value={stage}>{STAGE_CONFIG[stage].label}</option>)}
          </select>
          <button onClick={clearFilters} className="btn-ghost btn-sm flex items-center gap-1.5">
            <X size={14} />
            مسح
          </button>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
              <p className="mt-3 text-sm text-neutral-400">جاري التحميل...</p>
            </div>
          </div>
        ) : displayedMembers.length === 0 ? (
          <div className="py-12 text-center">
            <Users size={36} className="mx-auto mb-3 text-neutral-300" />
            <p className="text-neutral-500 text-sm">لا توجد ملفات مطابقة</p>
            <button onClick={openCreate} className="btn-primary btn-sm mt-3">
              <Plus size={16} />
              إضافة عضو
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="text-right py-3 px-4 font-bold text-neutral-600 text-xs">العضو</th>
                  <th className="text-right py-3 px-4 font-bold text-neutral-600 text-xs">النوع</th>
                  <th className="text-right py-3 px-4 font-bold text-neutral-600 text-xs">المسار والدور</th>
                  <th className="text-right py-3 px-4 font-bold text-neutral-600 text-xs hidden md:table-cell">النشاط</th>
                  <th className="text-right py-3 px-4 font-bold text-neutral-600 text-xs hidden lg:table-cell">التواصل</th>
                  <th className="text-right py-3 px-4 font-bold text-neutral-600 text-xs">الحالة</th>
                  <th className="text-center py-3 px-4 font-bold text-neutral-600 text-xs">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {displayedMembers.map(member => {
                  const typeCfg = TYPE_CONFIG[member.type]
                  const statusCfg = STATUS_CONFIG[member.status]
                  const TypeIcon = typeCfg.icon
                  return (
                    <tr key={member.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3 min-w-[190px]">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                            member.status === 'ACTIVE' ? 'bg-primary-100 text-primary-600' : 'bg-neutral-100 text-neutral-400'
                          }`}>
                            {member.avatar ? (
                              <img src={member.avatar} alt={member.name} className="w-full h-full rounded-xl object-cover" />
                            ) : (
                              member.name.charAt(0)
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link href={`/ar/admin/members/${member.id}`} className="font-semibold text-neutral-900 hover:text-primary-700 text-sm truncate no-underline block">
                              {member.name}
                            </Link>
                            <p className="text-[10px] text-neutral-400 font-mono">{member.code}</p>
                            {member.country && <p className="text-[10px] text-neutral-400 md:hidden">{member.country}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={`${typeCfg.color} text-[10px] whitespace-nowrap`}>
                          <TypeIcon size={11} />
                          {typeCfg.label}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1.5 min-w-[170px]">
                          {member.role && (
                            <span className="inline-flex items-center gap-1 text-xs text-neutral-600">
                              <Briefcase size={12} className="text-secondary-500" />
                              {member.role}
                            </span>
                          )}
                          <StageProgressBar currentStage={member.currentStage} />
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <div className="flex items-center gap-3 text-xs text-neutral-500">
                          <span className="flex items-center gap-1" title="تسجيلات"><Briefcase size={12} className="text-secondary-500" /> {member.enrollmentsCount}</span>
                          <span className="flex items-center gap-1" title="مشاركات"><Activity size={12} className="text-primary-500" /> {member.participationsCount}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell">
                        <div className="space-y-1 text-xs text-neutral-500">
                          {member.email && <span className="flex items-center gap-1"><Mail size={11} /> {member.email}</span>}
                          {member.phone && <span className="flex items-center gap-1"><Phone size={11} /> {member.phone}</span>}
                          {member.linkedinUrl && (
                            <a href={member.linkedinUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-800">
                              <Linkedin size={11} /> LinkedIn <ExternalLink size={10} />
                            </a>
                          )}
                          {!member.email && !member.phone && !member.linkedinUrl && <span className="text-neutral-400">لا يوجد</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={`${statusCfg.color} text-[10px] whitespace-nowrap`}>{statusCfg.label}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <Link
                            href={`/ar/admin/members/${member.id}`}
                            className="inline-flex items-center gap-1 px-2 py-1.5 text-[10px] font-bold text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors no-underline"
                            title="فتح الملف التفصيلي"
                          >
                            <ExternalLink size={14} />
                            الملف
                          </Link>
                          <button
                            onClick={() => openJourney(member)}
                            disabled={syncingJourneyId === member.id}
                            className="inline-flex items-center gap-1 px-2 py-1.5 text-[10px] font-bold text-secondary-700 bg-secondary-50 hover:bg-secondary-100 disabled:opacity-60 rounded-lg transition-colors"
                            title="عرض مسار تطور العضو"
                          >
                            {syncingJourneyId === member.id ? (
                              <RefreshCw size={14} className="animate-spin" />
                            ) : (
                              <Route size={14} />
                            )}
                            {syncingJourneyId === member.id ? 'تحديث...' : 'Journey'}
                          </button>
                          <button onClick={() => openEdit(member)} className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="تعديل">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDelete(member)} className="p-1.5 text-neutral-400 hover:text-error-600 hover:bg-error-50 rounded-lg transition-colors" title="حذف">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-neutral-200 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                <Users size={20} className="text-primary-600" />
                {editing ? 'تعديل عضو' : 'عضو جديد'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100 transition-colors" aria-label="إغلاق">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">نوع العضوية</label>
                <p className="text-xs text-neutral-500 mb-3 leading-relaxed">
                  اختر الدور الحالي للشخص. إذا كان مستفيداً ثم أصبح ضمن الفريق، استخدم "مستفيد وفريق" حتى يبقى مسار التطور والأنشطة في ملف واحد.
                </p>
                <div className="flex flex-wrap gap-2">
                  {(Object.entries(TYPE_CONFIG) as Array<[MemberType, (typeof TYPE_CONFIG)[MemberType]]>).map(([type, cfg]) => {
                    const Icon = cfg.icon
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setForm({ ...form, type })}
                        className={`px-3 py-2 rounded-xl border text-sm font-medium flex items-center gap-2 transition-colors ${
                          form.type === type ? 'border-primary-300 bg-primary-50 text-primary-700' : 'border-neutral-200 text-neutral-500 hover:border-neutral-300'
                        }`}
                      >
                        <Icon size={16} />
                        {cfg.label}
                      </button>
                    )
                  })}
                </div>
                <div className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                  <h3 className="text-xs font-bold text-neutral-800">{TYPE_HELP[form.type].title}</h3>
                  <p className="text-[11px] text-neutral-600 mt-1 leading-relaxed">{TYPE_HELP[form.type].description}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">الكود <span className="text-error-500">*</span></label>
                  <div className="relative">
                    <Hash size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input required value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} className="input-field pr-9" placeholder="MEM-20260001" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">الحالة</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as MemberStatus })} className="input-field">
                    {(Object.entries(STATUS_CONFIG) as Array<[MemberStatus, (typeof STATUS_CONFIG)[MemberStatus]]>).map(([status, cfg]) => (
                      <option key={status} value={status}>{cfg.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">الاسم الأول <span className="text-error-500">*</span></label>
                  <input required value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">اسم العائلة <span className="text-error-500">*</span></label>
                  <input required value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">البريد الإلكتروني</label>
                  <div className="relative">
                    <Mail size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input type="email" dir="ltr" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input-field pr-9" placeholder="email@example.com" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">رقم الهاتف</label>
                  <div className="relative">
                    <Phone size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input type="tel" dir="ltr" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input-field pr-9" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">الجنس</label>
                  <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} className="input-field">
                    <option value="">غير محدد</option>
                    <option value="MALE">ذكر</option>
                    <option value="FEMALE">أنثى</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">تاريخ الميلاد</label>
                  <div className="relative">
                    <Calendar size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input type="date" value={form.birthDate} onChange={e => setForm({ ...form, birthDate: e.target.value })} className="input-field pr-9" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">المستوى التعليمي</label>
                  <div className="relative">
                    <GraduationCap size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <select value={form.educationLevel} onChange={e => setForm({ ...form, educationLevel: e.target.value })} className="input-field pr-9">
                      <option value="">غير محدد</option>
                      {Object.entries(EDUCATION_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">الجنسية</label>
                  <input value={form.nationality} onChange={e => setForm({ ...form, nationality: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">الدولة</label>
                  <div className="relative">
                    <MapPin size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <select value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} className="input-field pr-9">
                      <option value="">غير محدد</option>
                      {COUNTRIES.map(country => <option key={country} value={country}>{country}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">المدينة</label>
                  <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="input-field" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-neutral-100">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">الدور</label>
                  <div className="relative">
                    <Briefcase size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="input-field pr-9" placeholder={isTeamLike(form.type) ? 'منسق، مرشد، قائد مبادرة...' : 'اختياري'} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">الرابط المختصر</label>
                  <div className="relative">
                    <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input dir="ltr" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} className="input-field pl-8" placeholder="member-name" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">رابط الصورة</label>
                  <div className="relative">
                    <Image size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input dir="ltr" value={form.avatar} onChange={e => setForm({ ...form, avatar: e.target.value })} className="input-field pr-9" placeholder="https://..." />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">رابط LinkedIn</label>
                  <div className="relative">
                    <Linkedin size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input dir="ltr" value={form.linkedinUrl} onChange={e => setForm({ ...form, linkedinUrl: e.target.value })} className="input-field pr-9" placeholder="https://linkedin.com/in/..." />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">ترتيب العرض</label>
                  <input type="number" value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: Number(e.target.value) || 0 })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">الاهتمامات</label>
                  <input value={form.interests} onChange={e => setForm({ ...form, interests: e.target.value })} className="input-field" placeholder="تقنية، قيادة، تطوع" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">نبذة</label>
                  <textarea rows={3} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} className="input-field" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
                <button type="button" onClick={() => setShowModal(false)} className="btn-ghost btn-sm">إلغاء</button>
                <button type="submit" disabled={submitting} className="btn-primary btn-sm flex items-center gap-2">
                  {submitting && <RefreshCw size={14} className="animate-spin" />}
                  {submitting ? 'جاري الحفظ...' : editing ? 'تحديث العضو' : 'إنشاء العضو'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {journeyMember && (
        <JourneyTimelineModal
          member={journeyMember}
          stages={journeyStages}
          onClose={() => setJourneyMember(null)}
          onRefresh={fetchMembers}
        />
      )}
    </div>
  )
}
