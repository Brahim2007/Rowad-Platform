'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Database, Activity, Fingerprint, ShieldCheck, Layers, TrendingUp,
  Route, UserCheck, Archive, Search, Download, PieChart, RefreshCw,
  Compass, FileText, CheckSquare, BarChart2, Clock, Target,
  Users, Globe, BookOpen, Briefcase, X, Network, BarChart3,
  Percent, Award, CheckCircle, GraduationCap, MapPin, Calendar,
  Filter, AlertCircle, ListChecks, Handshake, ArrowUpRight,
  FolderSync, Eye, ImageOff
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ───

interface Overview {
  totalBeneficiaries: number
  activeBeneficiaries: number
  totalPlatforms: number
  totalPrograms: number
  totalActivities: number
  totalProjects: number
  totalTeam: number
  totalKnowledge: number
  totalTemplates: number
  totalReports: number
  totalTasks: number
  partners: number
  evaluations: number
}

interface JourneyFunnelItem {
  stage: string
  label: string
  count: number
}

interface ImpactIndicators {
  avgRetention: number
  avgSatisfaction: number
  avgCompletion: number
  totalActiveValue: number
  totalTargetValue: number
}

interface PlatformLive {
  id: string
  name: string
  slug: string
  color: string | null
  logo: string | null
  coverImage: string | null
  focus: string
  members: number
  programsCount: number
  projectsCount: number
  hoursLogged: string
  activityLevel: number
}

interface Beneficiary {
  id: string
  code: string
  name: string
  email: string | null
  country: string | null
  city: string | null
  status: string
  currentStage: string | null
  enrollmentsCount: number
  participationsCount: number
  registeredAt: string
}

interface TaskStatus {
  status: string
  _count: { status: number }
}

interface InterestTag {
  name: string
  pct: number
}

interface DashboardData {
  overview: Overview
  dataQuality: number
  duplicateRate: number
  interestTags: InterestTag[]
  avgScore: number
  journeyFunnel: JourneyFunnelItem[]
  impactIndicators: ImpactIndicators
  platformLiveData: PlatformLive[]
  platformIndicators: unknown[]
  recentBeneficiaries: Beneficiary[]
  taskStatuses: TaskStatus[]
}

// ─── Journey stage config ───

const JOURNEY_STAGES = [
  { key: 'DISCOVERY', label: 'اكتشاف', color: 'bg-neutral-200', barColor: 'bg-neutral-300', textColor: 'text-neutral-600', iconColor: 'text-neutral-400' },
  { key: 'APPLICATION', label: 'تقديم', color: 'bg-primary-100', barColor: 'bg-primary-300', textColor: 'text-primary-700', iconColor: 'text-primary-500' },
  { key: 'ONBOARDING', label: 'تأهيل', color: 'bg-primary-200', barColor: 'bg-primary-400', textColor: 'text-primary-800', iconColor: 'text-primary-600' },
  { key: 'ACTIVE', label: 'نشط', color: 'bg-success-50', barColor: 'bg-success-500', textColor: 'text-success-700', iconColor: 'text-success-500' },
  { key: 'ADVANCED', label: 'متقدم', color: 'bg-secondary-100', barColor: 'bg-secondary-500', textColor: 'text-secondary-800', iconColor: 'text-secondary-600' },
  { key: 'GRADUATED', label: 'متخرج', color: 'bg-info-50', barColor: 'bg-info-500', textColor: 'text-info-700', iconColor: 'text-info-500' },
  { key: 'ALUMNI', label: 'خريج', color: 'bg-primary-50', barColor: 'bg-primary-600', textColor: 'text-primary-900', iconColor: 'text-primary-700' },
  { key: 'CHAMPION', label: 'سفير', color: 'bg-secondary-50', barColor: 'bg-secondary-600', textColor: 'text-secondary-900', iconColor: 'text-secondary-700' },
]

const STAGE_LABEL: Record<string, string> = {
  DISCOVERY: 'اكتشاف', APPLICATION: 'تقديم', ONBOARDING: 'تأهيل',
  ACTIVE: 'نشط', ADVANCED: 'متقدم', GRADUATED: 'متخرج',
  ALUMNI: 'خريج', CHAMPION: 'سفير',
}

const JOURNEY_STEPS = ['اكتشاف', 'تقديم', 'تأهيل', 'نشط', 'متقدم', 'متخرج', 'خريج', 'سفير']

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'نشط', INACTIVE: 'غير نشط', SUSPENDED: 'معلق',
}

const STATUS_VARIANT: Record<string, string> = {
  ACTIVE: 'success', INACTIVE: 'neutral', SUSPENDED: 'warning',
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
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant] || variants.primary} ${className}`}>
      {children}
    </span>
  )
}

// ─── Journey Modal ───

function JourneyModal({ beneficiary, onClose }: { beneficiary: Beneficiary | null; onClose: () => void }) {
  if (!beneficiary) return null

  // Determine current stage index
  const currentIdx = beneficiary.currentStage
    ? JOURNEY_STEPS.indexOf(STAGE_LABEL[beneficiary.currentStage] || beneficiary.currentStage)
    : -1

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center bg-neutral-50">
          <h3 className="font-bold text-neutral-900 flex items-center gap-2">
            <Route className="text-primary-600" size={20} />
            مسار تطور العضو
          </h3>
          <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-error-500 hover:bg-error-50 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Beneficiary card */}
          <div className="mb-6 bg-primary-50 p-4 rounded-xl border border-primary-200">
            <div className="flex justify-between items-start mb-2">
              <span className="font-bold text-neutral-900 text-lg">{beneficiary.name}</span>
              <Badge variant="primary" className="font-mono text-[10px]">{beneficiary.code}</Badge>
            </div>
            <div className="text-sm text-neutral-600 flex gap-2 flex-wrap leading-relaxed">
              <span className="font-semibold text-primary-800">المنصات المرتبطة:</span>
              <span className="text-neutral-500">{beneficiary.enrollmentsCount} تسجيل • {beneficiary.participationsCount} مشاركة</span>
            </div>
          </div>

          {/* Timeline */}
          <div className="relative border-r-2 border-neutral-200 pr-6 space-y-6">
            {JOURNEY_STEPS.map((stepName, i) => {
              const stepNum = i + 1
              const isCompleted = currentIdx >= i
              const isCurrent = currentIdx === i
              const stageConfig = JOURNEY_STAGES[i]

              return (
                <div key={stepNum} className="relative">
                  <div className={`absolute -right-[25px] top-0 w-5 h-5 rounded-full border-4 border-white flex items-center justify-center shadow-sm transition-colors ${isCompleted ? stageConfig?.barColor || 'bg-primary-500' : 'bg-neutral-300'}`}>
                    {isCompleted && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <div>
                    <h4 className={`font-bold text-base mb-0.5 ${isCurrent ? 'text-primary-600' : isCompleted ? 'text-neutral-900' : 'text-neutral-400'}`}>
                      {stepName}
                      {isCurrent && <span className="mr-2 text-[10px] bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">المرحلة الحالية</span>}
                    </h4>
                    <p className="text-xs leading-relaxed text-neutral-500">
                      {isCompleted
                        ? `تم توثيق بيانات العضو في مرحلة "${stepName}" ضمن النظام الموحد.`
                        : 'لم يصل العضو إلى هذه المرحلة بعد.'}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 flex justify-end">
          <button onClick={onClose} className="btn-ghost btn-sm">إغلاق</button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Dashboard Page ───

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMember, setSelectedMember] = useState<Beneficiary | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/dashboard')
      const json = await res.json()
      if (json.success) setData(json.data)
      else toast.error('فشل تحميل البيانات')
    } catch {
      toast.error('فشل الاتصال بالخادم')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
            <p className="mt-4 text-neutral-500">جاري تحميل لوحة البيانات...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertCircle size={40} className="text-error-500 mx-auto mb-4" />
            <p className="text-neutral-600">تعذر تحميل البيانات. يرجى المحاولة لاحقاً.</p>
            <button onClick={fetchData} className="btn-primary btn-sm mt-4">إعادة المحاولة</button>
          </div>
        </div>
      </div>
    )
  }

  const { overview, journeyFunnel, impactIndicators, platformLiveData, recentBeneficiaries, interestTags } = data
  const maxFunnelCount = Math.max(...journeyFunnel.map(j => j.count), 1)

  // Filter beneficiaries
  const filteredBeneficiaries = searchTerm
    ? recentBeneficiaries.filter(b =>
        b.name.includes(searchTerm) || b.code.includes(searchTerm) || b.email?.includes(searchTerm)
      )
    : recentBeneficiaries

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* ─── Header ─── */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-6 gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900 mb-2 flex items-center gap-3">
            <Database className="text-primary-600" size={28} />
            لوحة قيادة منظومة البيانات
          </h1>
          <p className="text-neutral-500 max-w-2xl text-sm">
            مراقبة شاملة للبيانات، التحليلات، والأداء الحي للمنصات والمبادرات لضمان جودة الأرشفة ودعم القرار.
          </p>
        </div>
        <Badge variant="success" className="flex items-center gap-1.5 px-3 py-1.5 text-xs animate-pulse">
          <Activity size={12} />
          النظام متصل ومحدث
        </Badge>
      </div>

      {/* ─── Top KPIs ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="flex justify-between items-start mb-3">
            <div className="w-9 h-9 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center">
              <Fingerprint size={18} />
            </div>
            <Badge variant={data.duplicateRate <= 1 ? 'success' : data.duplicateRate <= 5 ? 'primary' : 'warning'}>
              {data.duplicateRate}% تكرار
            </Badge>
          </div>
          <p className="text-neutral-500 text-xs font-medium mb-0.5">ملفات موحدة (ID) نشطة</p>
          <h3 className="text-2xl font-bold text-neutral-900">{overview.totalBeneficiaries.toLocaleString('ar')}</h3>
        </div>

        <div className="card">
          <div className="flex justify-between items-start mb-3">
            <div className="w-9 h-9 bg-secondary-100 text-secondary-600 rounded-lg flex items-center justify-center">
              <ShieldCheck size={18} />
            </div>
            <Badge variant={data.dataQuality >= 90 ? 'success' : data.dataQuality >= 70 ? 'primary' : 'warning'}>
              {data.dataQuality >= 90 ? 'جودة عالية' : data.dataQuality >= 70 ? 'جيدة' : 'بحاجة تحسين'}
            </Badge>
          </div>
          <p className="text-neutral-500 text-xs font-medium mb-0.5">جودة البيانات</p>
          <h3 className="text-2xl font-bold text-neutral-900">{data.dataQuality}%</h3>
        </div>

        <div className="card">
          <div className="flex justify-between items-start mb-3">
            <div className="w-9 h-9 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center">
              <BarChart3 size={18} />
            </div>
            <Badge variant="primary">{data.avgScore}% تقييم</Badge>
          </div>
          <p className="text-neutral-500 text-xs font-medium mb-0.5">متوسط التقييم المؤسسي</p>
          <h3 className="text-2xl font-bold text-neutral-900">{data.avgScore}%</h3>
        </div>

        <div className="card">
          <div className="flex justify-between items-start mb-3">
            <div className="w-9 h-9 bg-secondary-100 text-secondary-600 rounded-lg flex items-center justify-center">
              <Layers size={18} />
            </div>
            <Badge variant={overview.activeBeneficiaries / overview.totalBeneficiaries >= 0.5 ? 'success' : 'primary'}>
              {Math.round((overview.activeBeneficiaries / overview.totalBeneficiaries) * 100)}% نشط
            </Badge>
          </div>
          <p className="text-neutral-500 text-xs font-medium mb-0.5">الأعضاء النشطون</p>
          <h3 className="text-2xl font-bold text-neutral-900">{overview.activeBeneficiaries.toLocaleString('ar')}</h3>
        </div>
      </div>

      {/* ─── Summary Stats ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'المنصات النشطة', value: overview.totalPlatforms, icon: BarChart2, color: 'bg-primary-100 text-primary-600' },
          { label: 'البرامج النشطة', value: overview.totalPrograms, icon: BookOpen, color: 'bg-secondary-100 text-secondary-600' },
          { label: 'الأنشطة', value: overview.totalActivities, icon: Calendar, color: 'bg-info-50 text-info-500' },
          { label: 'المشاريع', value: overview.totalProjects, icon: Briefcase, color: 'bg-success-50 text-success-500' },
          { label: 'التقارير المرفوعة', value: overview.totalReports, icon: FileText, color: 'bg-primary-100 text-primary-600' },
          { label: 'المعرفة المنشورة', value: overview.totalKnowledge, icon: BookOpen, color: 'bg-secondary-100 text-secondary-600' },
          { label: 'فريق العمل', value: overview.totalTeam, icon: Users, color: 'bg-info-50 text-info-500' },
          { label: 'الشركاء', value: overview.partners, icon: Globe, color: 'bg-success-50 text-success-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card flex items-center gap-3 p-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
              <Icon size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-xl font-bold text-neutral-900">{value}</div>
              <div className="text-xs text-neutral-500 truncate">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Main Grid: Platform Tracking + Impact ─── */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">

        {/* Platform Live Tracking */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                <Activity className="text-primary-600" size={20} />
                الديناميكية والتتبع الحي
              </h3>
              <p className="text-xs text-neutral-500">قياس التغيرات، حجم الأنشطة، وساعات العمل بين المنصات.</p>
            </div>
            <Badge variant="success" className="text-[10px]">تحديث مباشر</Badge>
          </div>

          <div className="space-y-3">
            {platformLiveData.slice(0, 4).map(platform => {
              const image = platform.coverImage || platform.logo

              return (
                <div key={platform.id} className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 hover:border-primary-200 transition-colors relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-1 h-full" style={{ backgroundColor: platform.color || '#527F47' }} />

                  <div className="grid gap-3 sm:grid-cols-[76px_minmax(0,1fr)]">
                    <div className="aspect-square overflow-hidden rounded-lg border border-neutral-100 bg-white">
                      {image ? (
                        <img
                          src={image}
                          alt={platform.name}
                          className={`h-full w-full ${platform.coverImage ? 'object-cover' : 'object-contain'}`}
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-secondary-50">
                          <ImageOff size={24} className="text-secondary-300" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex justify-between items-start gap-3 mb-2">
                        <div className="min-w-0">
                          <p className="truncate font-bold text-neutral-900 text-sm">{platform.name}</p>
                          <p className="text-neutral-500 text-xs mt-0.5">{platform.programsCount} برامج • {platform.projectsCount} مشاريع</p>
                        </div>
                        <div className="text-left shrink-0">
                          <Badge variant={platform.activityLevel >= 85 ? 'success' : platform.activityLevel >= 70 ? 'primary' : 'neutral'} className="text-[10px]">
                            {platform.activityLevel >= 85 ? 'نشط جداً' : platform.activityLevel >= 70 ? 'نشط' : 'مستقر'}
                          </Badge>
                        </div>
                      </div>

                      {/* Metrics row */}
                      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-neutral-200/50 text-center">
                        <div>
                          <p className="text-[10px] text-neutral-400 mb-0.5">الأعضاء</p>
                          <p className="font-bold text-neutral-900 text-sm">
                            <Users size={12} className="inline text-secondary-500 ml-0.5" />
                            {platform.members}
                          </p>
                        </div>
                        <div className="border-x border-neutral-200/50">
                          <p className="text-[10px] text-neutral-400 mb-0.5">ساعات العمل</p>
                          <p className="font-bold text-neutral-900 text-sm">
                            <Clock size={12} className="inline text-primary-500 ml-0.5" />
                            {platform.hoursLogged}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-neutral-400 mb-0.5">التفاعل</p>
                          <p className="font-bold text-neutral-900 text-sm">
                            <Activity size={12} className="inline text-secondary-500 ml-0.5" />
                            {platform.activityLevel}%
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link href={`/ar/admin/platforms/${platform.slug}`} className="inline-flex items-center gap-1 rounded-lg bg-primary-50 px-2.5 py-1 text-[11px] font-bold text-primary-700 no-underline hover:bg-primary-100">
                          <FolderSync size={12} />
                          إدارة
                        </Link>
                        <Link href={`/ar/platforms/${platform.slug}`} className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-[11px] font-bold text-neutral-600 no-underline ring-1 ring-neutral-200 hover:text-primary-700">
                          <Eye size={12} />
                          عرض عام
                          <ArrowUpRight size={11} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Mini bar chart */}
          <div className="mt-4 pt-4 border-t border-neutral-200">
            <h4 className="text-xs font-bold text-neutral-900 mb-2 flex items-center gap-1.5">
              <BarChart2 size={14} className="text-primary-600" />
              مقارنة تفاعل المنصات
            </h4>
            <div className="flex items-end gap-1.5 h-16">
              {platformLiveData.slice(0, 4).map((p, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end group relative cursor-pointer">
                  <div
                    className="w-full rounded-t-sm transition-all duration-300 hover:opacity-80"
                    style={{
                      height: `${Math.max(p.activityLevel * 0.6, 10)}%`,
                      backgroundColor: p.color || '#527F47',
                    }}
                  />
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-[8px] py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 pointer-events-none">
                    {p.name}: {p.activityLevel}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Impact Indicators */}
        <div className="flex flex-col gap-6">
          <div className="card">
            <h3 className="text-lg font-bold text-neutral-900 mb-1 flex items-center gap-2">
              <Target className="text-secondary-600" size={20} />
              قياس الأثر والفاعلية
            </h3>
            <p className="text-xs text-neutral-500 mb-4">مؤشرات أداء رئيسية تقيس مدى تأثير البرامج والمبادرات.</p>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200 text-center">
                <p className="text-[10px] font-bold text-neutral-500 mb-1.5">معدل الاحتفاظ</p>
                <p className="text-xl font-bold text-neutral-900 mb-0.5">{impactIndicators.avgRetention}%</p>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  impactIndicators.avgRetention >= 70 ? 'bg-success-50 text-success-700' : 'bg-warning-50 text-warning-700'
                }`}>
                  {impactIndicators.avgRetention >= 70 ? 'مستقر' : 'بحاجة تحسين'}
                </span>
              </div>

              <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200 text-center">
                <p className="text-[10px] font-bold text-neutral-500 mb-1.5">رضا الأعضاء</p>
                <p className="text-xl font-bold text-neutral-900 mb-0.5">{impactIndicators.avgSatisfaction}/10</p>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  impactIndicators.avgSatisfaction >= 7 ? 'bg-success-50 text-success-700' : 'bg-warning-50 text-warning-700'
                }`}>
                  {impactIndicators.avgSatisfaction >= 7 ? 'جيد' : 'بحاجة تحسين'}
                </span>
              </div>

              <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200 text-center">
                <p className="text-[10px] font-bold text-neutral-500 mb-1.5">إكمال البرامج</p>
                <p className="text-xl font-bold text-neutral-900 mb-0.5">{impactIndicators.avgCompletion}%</p>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  impactIndicators.avgCompletion >= 80 ? 'bg-success-50 text-success-700' : 'bg-warning-50 text-warning-700'
                }`}>
                  {impactIndicators.avgCompletion >= 80 ? 'ممتاز' : 'قيد التطوير'}
                </span>
              </div>
            </div>
          </div>

          {/* Journey Funnel */}
          <div className="card flex-grow">
            <h3 className="text-lg font-bold text-neutral-900 mb-1 flex items-center gap-2">
              <Route className="text-primary-600" size={20} />
              مسار تطور الأعضاء
            </h3>
            <p className="text-xs text-neutral-500 mb-4">تحليل دورة حياة الشباب داخل الشبكة بناءً على رحلة العضو.</p>

            <div className="space-y-2.5">
              {journeyFunnel.map((item, idx) => {
                const pct = maxFunnelCount > 0 ? Math.round((item.count / maxFunnelCount) * 100) : 0
                const stageConfig = JOURNEY_STAGES.find(s => s.key === item.stage)

                return (
                  <div key={item.stage} className="relative">
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-neutral-700 font-medium">{item.label}</span>
                      <span className="font-bold text-primary-600">{item.count} عضو</span>
                    </div>
                    <div className="w-full bg-neutral-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${stageConfig?.barColor || 'bg-primary-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Interests */}
            <div className="mt-4 pt-4 border-t border-neutral-200">
              <h4 className="text-xs font-bold text-neutral-900 mb-2">أبرز الاهتمامات (بناءً على بيانات الأعضاء)</h4>
              <div className="flex flex-wrap gap-1.5">
                {interestTags && interestTags.length > 0 ? (
                  interestTags.map(tag => (
                    <span key={tag.name} className="text-[10px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full border border-neutral-200">
                      {tag.name} ({tag.pct}%)
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] text-neutral-400">لا توجد بيانات اهتمامات كافية</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Unified Database Table ─── */}
      <div className="card mb-6">
        <div className="flex flex-col lg:flex-row justify-between lg:items-center mb-4 gap-3">
          <div>
            <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2 mb-0.5">
              <Database className="text-primary-600" size={20} />
              قاعدة البيانات الموحدة (Unified ID)
            </h3>
            <p className="text-xs text-neutral-500">
              هيكل بيانات متكامل يربط المبادرات والمنصات لتتبع رحلة الفرد وتطوره دون تكرار.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant={data.duplicateRate <= 1 ? 'success' : 'warning'} className="flex items-center gap-1 px-2.5 py-1">
              <ShieldCheck size={12} />
              {data.duplicateRate <= 1 ? 'قاعدة خالية من التكرار' : `${data.duplicateRate}% تكرار`}
            </Badge>
            <Link
              href="/ar/admin/members"
              className="btn-primary btn-sm flex items-center gap-1.5 no-underline"
            >
              <Users size={14} />
              إدارة الأعضاء
              <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4 max-w-xs">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="بحث بالاسم أو الكود..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="input-field pr-9 pl-3 py-2 text-sm"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-sm">
            <thead>
              <tr className="text-neutral-600 border-b-2 border-neutral-200 bg-neutral-50">
                <th className="p-3 font-bold text-xs">الرقم الموحد (ID)</th>
                <th className="p-3 font-bold text-xs">اسم العضو</th>
                <th className="p-3 font-bold text-xs hidden md:table-cell">الدولة</th>
                <th className="p-3 font-bold text-xs">المسار (Journey)</th>
                <th className="p-3 font-bold text-xs hidden sm:table-cell">النشاط</th>
                <th className="p-3 font-bold text-xs text-center">الحالة</th>
                <th className="p-3 font-bold text-xs text-center">إدارة</th>
              </tr>
            </thead>
            <tbody>
              {filteredBeneficiaries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-neutral-400 text-xs">لا يوجد أعضاء</td>
                </tr>
              ) : (
                filteredBeneficiaries.map(b => {
                  const stageLabel = b.currentStage ? STAGE_LABEL[b.currentStage] : 'لم يبدأ'
                  const stageIdx = JOURNEY_STEPS.indexOf(stageLabel)
                  const stageConfig = JOURNEY_STAGES.find(s => s.key === b.currentStage)

                  return (
                    <tr key={b.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                      <td className="p-3">
                        <span className="font-mono font-bold text-primary-600 text-xs">{b.code}</span>
                      </td>
                      <td className="p-3 font-medium text-neutral-900">{b.name}</td>
                      <td className="p-3 text-neutral-500 hidden md:table-cell">{b.country || '—'}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold ${stageConfig?.textColor || 'text-neutral-500'}`}>
                            {stageLabel}
                          </span>
                          <button
                            onClick={() => setSelectedMember(b)}
                            className="text-primary-600 hover:text-primary-800 hover:bg-primary-50 p-1.5 rounded-lg transition-colors"
                            title="عرض مسار الرحلة"
                          >
                            <Route size={14} />
                          </button>
                        </div>
                      </td>
                      <td className="p-3 hidden sm:table-cell">
                        <div className="flex items-center gap-2 text-xs text-neutral-500">
                          <span className="flex items-center gap-0.5"><Briefcase size={11} />{b.enrollmentsCount}</span>
                          <span className="flex items-center gap-0.5"><Activity size={11} />{b.participationsCount}</span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant={STATUS_VARIANT[b.status] || 'neutral'} className="text-[10px]">
                          {STATUS_LABEL[b.status] || b.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <Link
                          href={`/ar/admin/members/${b.id}`}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-primary-700 hover:text-primary-900 bg-primary-50 hover:bg-primary-100 px-2 py-1 rounded-lg no-underline"
                        >
                          <Users size={11} />
                          فتح الملف
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Decision Support & Coordination ─── */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-base font-bold text-neutral-900 mb-3 flex items-center gap-2">
            <Compass className="text-secondary-600" size={18} />
            دعم اتخاذ القرار والتطوير
          </h3>
          <div className="space-y-3">
            <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200 hover:border-secondary-200 transition-colors">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-sm font-bold text-neutral-900">تقارير دورية وتوجيه الاستراتيجيات</span>
                <FileText size={16} className="text-secondary-500" />
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed">
                تقديم تقارير دورية للإدارة والمنسقين تمكن الفريق من استخدام البيانات بشكل فعّال.{' '}
                {overview.totalReports > 0
                  ? `${overview.totalReports} تقريراً مرفوعاً حتى الآن`
                  : 'لم يتم رفع أي تقارير بعد'}
                {' — '}
                {impactIndicators.avgCompletion < 70
                  ? 'يُنصح بتعزيز نسب إكمال البرامج وتحسين آليات المتابعة.'
                  : impactIndicators.avgRetention < 60
                    ? 'يُنصح بتطوير استراتيجيات الاحتفاظ بالأعضاء وزيادة التفاعل.'
                    : 'مؤشرات الأداء مستقرة، يُنصح بالتركيز على توسيع نطاق البرامج والوصول لشرائح جديدة.'}
              </p>
            </div>
            <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200 hover:border-secondary-200 transition-colors">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-sm font-bold text-neutral-900">آليات تقييم مستقلة</span>
                <CheckSquare size={16} className="text-secondary-500" />
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed">
                {overview.evaluations} تقييماً مسجلاً — تطوير آليات تقييم مستقلة كطرف ثالث داعم للجودة، لضمان موضوعية النتائج.
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-base font-bold text-neutral-900 mb-3 flex items-center gap-2">
            <Handshake className="text-primary-600" size={18} />
            التنسيق المؤسسي
          </h3>
          <div className="space-y-3">
            <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200 hover:border-primary-200 transition-colors">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-sm font-bold text-neutral-900">التكامل وتحديد المعايير</span>
                <Handshake size={16} className="text-primary-500" />
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed">
                العمل بشكل تكاملي مع بقية الأدوار والتنسيق المستمر مع منسقي المبادرات والمنصات. {overview.totalTasks} مهمة تنسيق نشطة.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {data.taskStatuses?.map((ts: { status: string; _count: { status: number } }) => (
                  <Badge key={ts.status} variant="neutral" className="text-[10px]">
                    {ts.status === 'PENDING' ? 'قيد الانتظار' : ts.status === 'IN_PROGRESS' ? 'قيد التنفيذ' : ts.status === 'COMPLETED' ? 'مكتمل' : 'ملغى'}: {ts._count.status}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Journey Modal ─── */}
      {selectedMember && (
        <JourneyModal beneficiary={selectedMember} onClose={() => setSelectedMember(null)} />
      )}
    </div>
  )
}
