'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BarChart3,
  CalendarDays,
  Earth,
  Eye,
  Globe,
  Monitor,
  RefreshCw,
  Search,
  Smartphone,
  Tablet,
  TrendingUp,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'

interface Summary {
  totalVisits: number
  uniqueVisitors: number
  todayVisits: number
  countriesCount: number
}

interface DailyStat {
  date: string
  count: number
}

interface CountryStat {
  country: string
  count: number
}

interface DeviceStat {
  device: string
  count: number
}

interface BrowserStat {
  browser: string
  count: number
}

interface OsStat {
  os: string
  count: number
}

interface PageStat {
  path: string
  count: number
}

interface ReferrerStat {
  referrer: string
  count: number
}

interface Visit {
  id: string
  path: string
  country: string | null
  city: string | null
  deviceType: string | null
  browser: string | null
  os: string | null
  referrer: string | null
  screenSize: string | null
  language: string | null
  timestamp: string
  visitorId: string | null
}

interface Pagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

interface VisitorsData {
  summary: Summary
  dailyStats: DailyStat[]
  countryStats: CountryStat[]
  deviceStats: DeviceStat[]
  browserStats: BrowserStat[]
  osStats: OsStat[]
  pageStats: PageStat[]
  referrerStats: ReferrerStat[]
  recentVisits: Visit[]
  pagination: Pagination
}

function dateLabel(value: string) {
  return new Date(value).toLocaleString('ar-SA')
}

function shortDate(value: string) {
  return new Date(value).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })
}

function getDeviceIcon(device: string | null) {
  if (device === 'mobile') return Smartphone
  if (device === 'tablet') return Tablet
  return Monitor
}

function getCountryFlag(country: string | null) {
  if (!country) return '🌍'
  // Country code to flag emoji
  const code = country.toUpperCase()
  const flag = String.fromCodePoint(
    ...code.split('').map(c => 0x1F1E6 + c.charCodeAt(0) - 65)
  )
  return flag
}

const COUNTRY_NAMES: Record<string, string> = {
  SA: 'السعودية',
  AE: 'الإمارات',
  EG: 'مصر',
  KW: 'الكويت',
  QA: 'قطر',
  BH: 'البحرين',
  OM: 'عُمان',
  JO: 'الأردن',
  LB: 'لبنان',
  IQ: 'العراق',
  YE: 'اليمن',
  SY: 'سوريا',
  PS: 'فلسطين',
  DZ: 'الجزائر',
  MA: 'المغرب',
  TN: 'تونس',
  LY: 'ليبيا',
  SD: 'السودان',
  MR: 'موريتانيا',
  SO: 'الصومال',
  DJ: 'جيبوتي',
  KM: 'جزر القمر',
  US: 'الولايات المتحدة',
  GB: 'المملكة المتحدة',
  FR: 'فرنسا',
  DE: 'ألمانيا',
  CA: 'كندا',
  AU: 'أستراليا',
  IN: 'الهند',
  TR: 'تركيا',
  PK: 'باكستان',
  BD: 'بنغلاديش',
  MY: 'ماليزيا',
  ID: 'إندونيسيا',
}

const DEVICE_LABELS: Record<string, string> = {
  mobile: 'جوال',
  desktop: 'حاسوب',
  tablet: 'جهاز لوحي',
  unknown: 'غير معروف',
}

export default function AdminVisitorsPage() {
  const [data, setData] = useState<VisitorsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('period', period)
      params.set('page', String(page))
      params.set('pageSize', '50')
      if (search.trim()) params.set('search', search.trim())

      const res = await fetch(`/api/admin/visitors?${params}`)
      const json = await res.json()
      if (json.success) setData(json.data)
      else toast.error(json.message || 'فشل تحميل البيانات')
    } catch {
      toast.error('فشل الاتصال بالخادم')
    } finally {
      setLoading(false)
    }
  }, [period, page, search])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [period, search])

  const maxDailyCount = useMemo(() => {
    if (!data?.dailyStats.length) return 1
    return Math.max(...data.dailyStats.map(d => d.count), 1)
  }, [data?.dailyStats])

  const totalDeviceCount = useMemo(() => {
    if (!data?.deviceStats.length) return 1
    return data.deviceStats.reduce((s, d) => s + d.count, 0)
  }, [data?.deviceStats])

  if (loading && !data) {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="py-20 text-center text-neutral-400">
          <RefreshCw size={32} className="animate-spin mx-auto mb-3" />
          <p className="text-sm">جاري تحميل بيانات الزوار...</p>
        </div>
      </div>
    )
  }

  const summaryCards = data ? [
    { label: 'إجمالي الزيارات', value: data.summary.totalVisits.toLocaleString('ar-SA'), icon: Eye, color: 'bg-primary-100 text-primary-700' },
    { label: 'زوار فريدون', value: data.summary.uniqueVisitors.toLocaleString('ar-SA'), icon: Users, color: 'bg-info-100 text-info-700' },
    { label: 'زيارات اليوم', value: data.summary.todayVisits.toLocaleString('ar-SA'), icon: TrendingUp, color: 'bg-success-100 text-success-700' },
    { label: 'الدول', value: data.summary.countriesCount.toLocaleString('ar-SA'), icon: Globe, color: 'bg-warning-100 text-warning-700' },
  ] : []

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-6 gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900 mb-2 flex items-center gap-3">
            <BarChart3 className="text-primary-600" size={28} />
            تحليلات الزوار
          </h1>
          <p className="text-neutral-500 max-w-2xl text-sm">
            إحصائيات زوار الموقع: الدول، الأجهزة، المتصفحات، والصفحات الأكثر زيارة.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="input-field text-sm py-2"
          >
            <option value="7">آخر 7 أيام</option>
            <option value="30">آخر 30 يوم</option>
            <option value="90">آخر 3 أشهر</option>
            <option value="365">آخر سنة</option>
          </select>
          <button onClick={fetchData} className="btn-primary btn-sm flex items-center gap-1.5" disabled={loading}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            تحديث
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {summaryCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card flex items-center gap-3 p-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
              <Icon size={20} />
            </div>
            <div>
              <div className="text-xl font-bold text-neutral-900">{value}</div>
              <div className="text-xs text-neutral-500">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart Section */}
      {data && data.dailyStats.length > 0 && (
        <div className="card p-5 mb-6">
          <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <CalendarDays size={18} className="text-primary-600" />
            الزيارات اليومية
          </h3>
          <div className="flex items-end gap-1 h-40">
            {data.dailyStats.map((stat) => (
              <div
                key={stat.date}
                className="flex-1 flex flex-col items-center gap-1 group relative"
              >
                <div className="w-full bg-primary-100 rounded-t transition-all duration-200 hover:bg-primary-300 relative"
                  style={{ height: `${(stat.count / maxDailyCount) * 100}%` }}
                >
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-neutral-800 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity z-10">
                    {stat.count} زيارة
                  </div>
                </div>
                <span className="text-[10px] text-neutral-400 -rotate-45 origin-right whitespace-nowrap mt-1">
                  {shortDate(stat.date)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Countries */}
        <div className="card p-5">
          <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <Earth size={18} className="text-primary-600" />
            الدول
          </h3>
          {data && data.countryStats.length > 0 ? (
            <div className="space-y-2">
              {data.countryStats.slice(0, 10).map((stat) => {
                const pct = data.summary.totalVisits > 0
                  ? Math.round((stat.count / data.summary.totalVisits) * 100)
                  : 0
                return (
                  <div key={stat.country} className="flex items-center gap-3">
                    <span className="text-lg">{getCountryFlag(stat.country)}</span>
                    <span className="text-sm text-neutral-700 w-24 truncate">
                      {COUNTRY_NAMES[stat.country] || stat.country}
                    </span>
                    <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-neutral-500 w-12 text-left" dir="ltr">
                      {stat.count.toLocaleString('ar-SA')}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-neutral-400 py-4 text-center">لا توجد بيانات</p>
          )}
        </div>

        {/* Devices */}
        <div className="card p-5">
          <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <Monitor size={18} className="text-primary-600" />
            الأجهزة
          </h3>
          {data && data.deviceStats.length > 0 ? (
            <div className="space-y-3">
              {data.deviceStats.map((stat) => {
                const pct = totalDeviceCount > 0
                  ? Math.round((stat.count / totalDeviceCount) * 100)
                  : 0
                const Icon = getDeviceIcon(stat.device)
                return (
                  <div key={stat.device} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center">
                      <Icon size={16} className="text-neutral-600" />
                    </div>
                    <span className="text-sm text-neutral-700 w-20">
                      {DEVICE_LABELS[stat.device] || stat.device}
                    </span>
                    <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-info-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-neutral-500 w-16 text-left" dir="ltr">
                      {pct}%
                    </span>
                    <span className="text-xs text-neutral-500 w-12 text-left" dir="ltr">
                      {stat.count.toLocaleString('ar-SA')}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-neutral-400 py-4 text-center">لا توجد بيانات</p>
          )}
        </div>

        {/* Browsers */}
        <div className="card p-5">
          <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <Monitor size={18} className="text-primary-600" />
            المتصفحات
          </h3>
          {data && data.browserStats.length > 0 ? (
            <div className="space-y-2">
              {data.browserStats.slice(0, 8).map((stat) => {
                const pct = data.summary.totalVisits > 0
                  ? Math.round((stat.count / data.summary.totalVisits) * 100)
                  : 0
                return (
                  <div key={stat.browser} className="flex items-center gap-3">
                    <span className="text-sm text-neutral-700 w-28 truncate">{stat.browser}</span>
                    <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-secondary-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-neutral-500 w-12 text-left" dir="ltr">
                      {pct}%
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-neutral-400 py-4 text-center">لا توجد بيانات</p>
          )}
        </div>

        {/* Top Pages */}
        <div className="card p-5">
          <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <Eye size={18} className="text-primary-600" />
            الصفحات الأكثر زيارة
          </h3>
          {data && data.pageStats.length > 0 ? (
            <div className="space-y-2">
              {data.pageStats.slice(0, 10).map((stat) => {
                const pct = data.summary.totalVisits > 0
                  ? Math.round((stat.count / data.summary.totalVisits) * 100)
                  : 0
                return (
                  <div key={stat.path} className="flex items-center gap-3">
                    <span className="text-[11px] text-neutral-700 flex-1 truncate" dir="ltr">
                      {stat.path.replace(/^\/(ar)\/?/, '/')}
                    </span>
                    <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden max-w-[120px]">
                      <div
                        className="h-full bg-warning-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-neutral-500 w-12 text-left" dir="ltr">
                      {stat.count.toLocaleString('ar-SA')}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-neutral-400 py-4 text-center">لا توجد بيانات</p>
          )}
        </div>

        {/* Operating Systems */}
        <div className="card p-5">
          <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <Monitor size={18} className="text-primary-600" />
            أنظمة التشغيل
          </h3>
          {data && data.osStats.length > 0 ? (
            <div className="space-y-2">
              {data.osStats.slice(0, 8).map((stat) => {
                const pct = data.summary.totalVisits > 0
                  ? Math.round((stat.count / data.summary.totalVisits) * 100)
                  : 0
                return (
                  <div key={stat.os} className="flex items-center gap-3">
                    <span className="text-sm text-neutral-700 w-28 truncate">{stat.os}</span>
                    <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-success-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-neutral-500 w-12 text-left" dir="ltr">
                      {pct}%
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-neutral-400 py-4 text-center">لا توجد بيانات</p>
          )}
        </div>

        {/* Referrers */}
        <div className="card p-5">
          <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <Globe size={18} className="text-primary-600" />
            المصادر (المُحيلون)
          </h3>
          {data && data.referrerStats.length > 0 ? (
            <div className="space-y-2">
              {data.referrerStats.slice(0, 8).map((stat) => (
                <div key={stat.referrer} className="flex items-center gap-3">
                  <span className="text-xs text-neutral-700 flex-1 truncate" dir="ltr">
                    {new URL(stat.referrer).hostname}
                  </span>
                  <span className="text-xs text-neutral-500 w-12 text-left" dir="ltr">
                    {stat.count.toLocaleString('ar-SA')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-400 py-4 text-center">لا توجد بيانات</p>
          )}
        </div>
      </div>

      {/* Recent Visits Table */}
      <div className="card p-5 mb-6">
        <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
          <Eye size={18} className="text-primary-600" />
          آخر الزيارات
        </h3>

        <div className="relative mb-4">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pr-9"
            placeholder="بحث في الزيارات..."
          />
        </div>

        <div className="overflow-x-auto">
          {data && data.recentVisits.length > 0 ? (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200">
                    <th className="text-right py-3 px-3 text-xs font-bold text-neutral-500">الصفحة</th>
                    <th className="text-right py-3 px-3 text-xs font-bold text-neutral-500">الدولة</th>
                    <th className="text-right py-3 px-3 text-xs font-bold text-neutral-500">الجهاز</th>
                    <th className="text-right py-3 px-3 text-xs font-bold text-neutral-500">المتصفح</th>
                    <th className="text-right py-3 px-3 text-xs font-bold text-neutral-500">نظام التشغيل</th>
                    <th className="text-right py-3 px-3 text-xs font-bold text-neutral-500">الشاشة</th>
                    <th className="text-right py-3 px-3 text-xs font-bold text-neutral-500">التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentVisits.map((visit) => (
                    <tr key={visit.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                      <td className="py-2.5 px-3">
                        <span className="text-xs text-neutral-700 block max-w-[200px] truncate" dir="ltr">
                          {visit.path.replace(/^\/(ar)\/?/, '/')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="flex items-center gap-1.5 text-xs text-neutral-700">
                          {visit.country ? (
                            <>
                              <span>{getCountryFlag(visit.country)}</span>
                              <span>{COUNTRY_NAMES[visit.country] || visit.country}</span>
                              {visit.city && <span className="text-neutral-400">- {visit.city}</span>}
                            </>
                          ) : (
                            <span className="text-neutral-400">--</span>
                          )}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-xs text-neutral-600">
                        {DEVICE_LABELS[visit.deviceType || ''] || visit.deviceType || '--'}
                      </td>
                      <td className="py-2.5 px-3 text-xs text-neutral-600">{visit.browser || '--'}</td>
                      <td className="py-2.5 px-3 text-xs text-neutral-600">{visit.os || '--'}</td>
                      <td className="py-2.5 px-3 text-xs text-neutral-400">{visit.screenSize || '--'}</td>
                      <td className="py-2.5 px-3 text-xs text-neutral-400 whitespace-nowrap">
                        {dateLabel(visit.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-100">
                  <p className="text-xs text-neutral-500">
                    الصفحة {data.pagination.page} من {data.pagination.totalPages}
                    {' '}({data.pagination.total.toLocaleString('ar-SA')} زيارة)
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="px-3 py-1.5 text-xs rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      السابق
                    </button>
                    <button
                      onClick={() => setPage(p => p + 1)}
                      disabled={page >= data.pagination.totalPages}
                      className="px-3 py-1.5 text-xs rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      التالي
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-12 text-center text-neutral-400">
              <Eye size={30} className="mx-auto mb-3 text-neutral-300" />
              <p className="text-sm">لا توجد زيارات مسجلة بعد</p>
              <p className="text-xs text-neutral-300 mt-1">سيتم تسجيل الزيارات عند دخول المستخدمين إلى الموقع</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
