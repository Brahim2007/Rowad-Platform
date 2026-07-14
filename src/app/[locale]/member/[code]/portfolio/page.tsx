'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Shield, Medal, TrendingUp, Calendar, Clock, Activity } from 'lucide-react'

interface PortfolioData {
  name: string; code: string; networkRole: string | null; platformName: string | null
  joinDate: string | null; totalPoints: number; monthlyPoints: number
  level: string; levelProgress: number; nextLevel: string | null; gapToNext: number | null
  activitiesCount: number; awardsCount: number; awards: Array<{ title: string; date: string }>
  recentActivities: Array<{ actionName: string; date: string; category: string }>
  byCategory: Record<string, number>
}

function Badge({ children, className }: { children: React.ReactNode; className: string }) {
  return <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>{children}</span>
}

export default function MemberPortfolioPage() {
  const { code } = useParams<{ code: string }>()
  const [data, setData] = useState<PortfolioData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/member/portfolio?code=${code}`).then(r => r.json()).then(json => {
      if (json.success) setData(json.data)
      else setError('العضو غير موجود')
    }).catch(() => setError('فشل التحميل')).finally(() => setLoading(false))
  }, [code])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-neutral-50"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
  }

  if (error || !data) {
    return <div className="min-h-screen flex items-center justify-center bg-neutral-50"><div className="text-center text-neutral-400"><Shield size={48} className="mx-auto mb-4 text-neutral-300" /><p className="text-lg">{error || 'غير موجود'}</p></div></div>
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8 px-4" dir="rtl">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-600 to-teal-500 text-white flex items-center justify-center text-3xl font-bold mx-auto shadow-lg mb-4">
            {data.name.charAt(0) || '?'}
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">{data.name}</h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Badge className="bg-primary-100 text-primary-700">{data.code}</Badge>
            {data.networkRole && <Badge className="bg-neutral-100 text-neutral-600">{data.networkRole}</Badge>}
            {data.platformName && <Badge className="bg-teal-50 text-teal-600">{data.platformName}</Badge>}
          </div>
          <p className="text-xs text-neutral-400 mt-2 flex items-center justify-center gap-1">
            <Calendar size={12} /> انضم: {data.joinDate ? new Date(data.joinDate).toLocaleDateString('ar') : '—'}
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 text-center border shadow-sm">
            <div className="text-2xl font-bold text-amber-600 font-mono">{data.totalPoints}</div>
            <div className="text-xs text-neutral-500">النقاط الكلية</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center border shadow-sm">
            <div className="text-2xl font-bold text-green-600 font-mono">{data.monthlyPoints}</div>
            <div className="text-xs text-neutral-500">نقاط الشهر</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center border shadow-sm">
            <div className="text-2xl font-bold text-purple-600">{data.awardsCount}</div>
            <div className="text-xs text-neutral-500">الدروع</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center border shadow-sm">
            <div className="text-2xl font-bold text-teal-600">{data.activitiesCount}</div>
            <div className="text-xs text-neutral-500">الأنشطة</div>
          </div>
        </div>

        {/* Level */}
        <div className="bg-white rounded-xl p-5 border shadow-sm mb-6">
          <div className="flex justify-between mb-2">
            <span className="font-bold text-neutral-800 flex items-center gap-1.5"><TrendingUp size={16} className="text-primary-600" /> {data.level}</span>
            <span className="text-sm text-neutral-500">{data.totalPoints} نقطة</span>
          </div>
          <div className="h-3 bg-neutral-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-teal-500 to-amber-400 rounded-full transition-all" style={{ width: `${data.levelProgress}%` }} />
          </div>
          {data.nextLevel && (
            <p className="text-xs text-neutral-500 mt-2">🎯 تبقى {data.gapToNext} نقطة للوصول إلى «{data.nextLevel}»</p>
          )}
        </div>

        {/* Categories */}
        <div className="bg-white rounded-xl p-5 border shadow-sm mb-6">
          <h2 className="font-bold text-neutral-900 mb-3 flex items-center gap-2"><Activity size={16} className="text-primary-600" /> توزيع النقاط</h2>
          <div className="space-y-2">
            {Object.entries(data.byCategory).map(([cat, pts]) => (
              <div key={cat} className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">{cat}</span>
                <span className="text-sm font-mono font-bold">{pts} نقطة</span>
              </div>
            ))}
          </div>
        </div>

        {/* Awards */}
        {data.awards.length > 0 && (
          <div className="bg-white rounded-xl p-5 border shadow-sm mb-6">
            <h2 className="font-bold text-neutral-900 mb-3 flex items-center gap-2"><Medal size={16} className="text-amber-600" /> الدروع والمكافآت</h2>
            <div className="space-y-2">
              {data.awards.map((a, i) => (
                <div key={i} className="flex items-center justify-between border-b border-neutral-50 pb-2">
                  <span className="text-sm font-semibold text-neutral-700">🏅 {a.title}</span>
                  <span className="text-xs text-neutral-400">{new Date(a.date).toLocaleDateString('ar')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activities */}
        <div className="bg-white rounded-xl p-5 border shadow-sm">
          <h2 className="font-bold text-neutral-900 mb-3 flex items-center gap-2"><Clock size={16} className="text-teal-600" /> آخر الأنشطة</h2>
          {data.recentActivities.length > 0 ? (
            <div className="space-y-2">
              {data.recentActivities.map((act, i) => (
                <div key={i} className="flex items-center justify-between border-b border-neutral-50 pb-2">
                  <div>
                    <div className="text-sm font-semibold text-neutral-700">{act.actionName}</div>
                    <div className="text-xs text-neutral-400">{act.category} · {new Date(act.date).toLocaleDateString('ar')}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-4 text-neutral-400 text-sm">لا توجد أنشطة بعد</p>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-neutral-400">
          <Shield size={16} className="mx-auto mb-1 text-neutral-300" />
          شبكة رواد الإلكترونية — لوحة أثر الرواد
        </div>
      </div>
    </div>
  )
}
