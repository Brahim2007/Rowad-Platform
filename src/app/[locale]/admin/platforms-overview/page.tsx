'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Blocks, Users, Clock, AlertTriangle, CheckCircle, Star, BarChart3 } from 'lucide-react'
import Link from 'next/link'

interface PlatformRow {
  platformId: string; platformName: string; platformSlug: string
  memberCount: number; activeMembers: number
  pendingCount: number; stalePending: number
  totalApproved: number; thisMonthApproved: number
  trend: number
  managedBy: string | null; managedByEmail: string | null
}

interface OverviewData {
  platforms: PlatformRow[]
  totals: {
    platforms: number; totalMembers: number; totalPending: number
    totalApproved: number; mostActive: string; mostAtRisk: number
  }
}

function Badge({ children, className }: { children: React.ReactNode; className: string }) {
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>{children}</span>
}

export default function PlatformsOverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/platforms-overview').then(r => r.json()).then(json => {
      if (json.success) setData(json.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" /></div>
  }

  if (!data) {
    return <div className="p-8 text-center text-neutral-400">لا توجد بيانات</div>
  }

  const { platforms, totals } = data

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="text-primary-600" size={28} />
        <div>
          <h1 className="text-xl font-bold text-neutral-900">مركز متابعة المنصات</h1>
          <p className="text-sm text-neutral-500">نظرة شاملة على أداء كل المنصات</p>
        </div>
      </div>

      {/* KPIs الإجمالية */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <KpiCard icon={Blocks} label="المنصات" value={totals.platforms} color="bg-primary-100 text-primary-600" />
        <KpiCard icon={Users} label="الأعضاء" value={totals.totalMembers} color="bg-teal-100 text-teal-600" />
        <KpiCard icon={Clock} label="بانتظار الاعتماد" value={totals.totalPending} color="bg-amber-100 text-amber-600" />
        <KpiCard icon={CheckCircle} label="إجمالي المعتمدة" value={totals.totalApproved} color="bg-green-100 text-green-600" />
        <KpiCard icon={Star} label="المنصة الأنشط" value={totals.mostActive} color="bg-purple-100 text-purple-600" isText />
        <KpiCard icon={AlertTriangle} label="منصات متأخرة" value={totals.mostAtRisk} color={totals.mostAtRisk > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'} />
      </div>

      {/* جدول المنصات */}
      <div className="card">
        <h2 className="font-bold text-neutral-900 mb-4 flex items-center gap-2"><Blocks size={18} className="text-primary-600" /> أداء المنصات — شهرياً</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="text-right p-3 text-neutral-500">المنصة</th>
                <th className="text-center p-3 text-neutral-500">المدير</th>
                <th className="text-center p-3 text-neutral-500">الأعضاء</th>
                <th className="text-center p-3 text-neutral-500">النشطون</th>
                <th className="text-center p-3 text-neutral-500">معلق</th>
                <th className="text-center p-3 text-neutral-500">متأخر +7</th>
                <th className="text-center p-3 text-neutral-500">المعتمدة (الشهر)</th>
                <th className="text-center p-3 text-neutral-500">الاتجاه</th>
                <th className="text-center p-3 text-neutral-500">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {platforms.map(p => (
                <tr key={p.platformId} className={`border-b border-neutral-100 hover:bg-neutral-50 ${p.stalePending > 0 ? 'bg-red-50/30' : ''}`}>
                  <td className="p-3 font-semibold">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#1e40af' }} />
                      {p.platformName}
                    </div>
                  </td>
                  <td className="p-3 text-center text-xs">
                    {p.managedBy ? (
                      <span className="text-neutral-600">{p.managedBy}</span>
                    ) : (
                      <Badge className="bg-red-50 text-red-600">غير معيّن</Badge>
                    )}
                  </td>
                  <td className="p-3 text-center font-mono">{p.memberCount}</td>
                  <td className="p-3 text-center font-mono">{p.activeMembers}</td>
                  <td className="p-3 text-center">
                    <span className={`font-mono font-bold ${p.pendingCount > 0 ? 'text-amber-600' : 'text-neutral-400'}`}>{p.pendingCount}</span>
                  </td>
                  <td className="p-3 text-center">
                    {p.stalePending > 0 ? (
                      <span className="inline-flex items-center gap-1 text-red-600 font-bold">
                        <AlertTriangle size={12} /> {p.stalePending}
                      </span>
                    ) : (
                      <span className="text-neutral-300">—</span>
                    )}
                  </td>
                  <td className="p-3 text-center font-mono font-bold text-primary-700">{p.thisMonthApproved}</td>
                  <td className="p-3 text-center">
                    {p.trend > 0 ? (
                      <span className="inline-flex items-center gap-1 text-green-600 font-semibold"><TrendingUp size={12} /> +{p.trend}%</span>
                    ) : p.trend < 0 ? (
                      <span className="inline-flex items-center gap-1 text-red-600 font-semibold"><TrendingDown size={12} /> {p.trend}%</span>
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <Link href={`/admin/impact?tab=activities`} className="text-xs text-primary-600 hover:underline">تفاصيل</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* تنبيه المنصات المتأخرة */}
      {platforms.some(p => p.stalePending > 0) && (
        <div className="card mt-4 p-5 border-2 border-red-200 bg-red-50/50">
          <h2 className="font-bold text-red-800 mb-3 flex items-center gap-2"><AlertTriangle size={18} /> منصات تحتاج انتباهاً</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {platforms.filter(p => p.stalePending > 0).map(p => (
              <div key={p.platformId} className="bg-white border border-red-200 rounded-lg p-3">
                <div className="font-semibold text-sm text-neutral-800">{p.platformName}</div>
                <div className="text-xs text-red-600 mt-1">
                  {p.stalePending} أنشطة معلقة منذ أكثر من 7 أيام
                  {p.managedBy && <span className="text-neutral-500"> · المدير: {p.managedBy}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, color, isText }: { icon: any; label: string; value: string | number; color: string; isText?: boolean }) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}><Icon size={18} /></div>
      <div>
        <div className={`${isText ? 'text-sm' : 'text-lg'} font-bold text-neutral-900`}>{value}</div>
        <div className="text-xs text-neutral-500">{label}</div>
      </div>
    </div>
  )
}
