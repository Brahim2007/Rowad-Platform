'use client'

import { useEffect, useState, useCallback, type FormEvent } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Shield, LogOut, TrendingUp, Star, Medal, Send, Clock, Activity, FileText, Settings, Hourglass } from 'lucide-react'
import { toast } from 'sonner'

// ═══════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════

interface MemberInfo {
  id: string; code: string; name: string; email: string | null
  networkRole: string | null; platformId: string | null; platformName: string | null; mustChangePassword: boolean
}

interface MemberStats {
  totalPoints: number; monthlyPoints: number; level: string; levelProgress: number
  levelName: string; nextLevel: string | null; gapToNext: number | null
  activitiesCount: number; awardsCount: number; rank: number; streak: number
}

interface ActivityItem {
  id: string; actionName: string; category: string; count: number
  quality: string; status: string; date: string; note: string | null; rejectionReason: string | null
}

interface ImpactAction {
  id: string
  name: string
  category: string
  points: number
  isActive: boolean
}

const QUALITY_LABELS: Record<string, string> = { WEAK: 'ضعيف', ACCEPTABLE: 'مقبول', GOOD: 'جيد', EXCELLENT: 'ممتاز', EXCEPTIONAL: 'استثنائي' }
const STATUS_LABELS: Record<string, string> = { APPROVED: 'معتمد', PENDING_REVIEW: 'قيد المراجعة', REJECTED: 'مرفوض' }
const CATEGORY_LABELS: Record<string, string> = { DIGITAL_ACTIVITY: 'النشاط الرقمي', SCIENTIFIC_EVENTS: 'المشاركة العلمية', INITIATIVES: 'المبادرات والإنتاج', DISCIPLINE: 'الالتزام' }

function Badge({ children, className }: { children: React.ReactNode; className: string }) {
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>{children}</span>
}

function today() { return new Date().toISOString().slice(0, 10) }

export default function MemberPortalPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') || 'dashboard'

  const [member, setMember] = useState<MemberInfo | null>(null)
  const [stats, setStats] = useState<MemberStats | null>(null)
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [actions, setActions] = useState<ImpactAction[]>([])
  const [submitting, setSubmitting] = useState(false)

  // Submit form
  const [subForm, setSubForm] = useState({ actionId: '', count: '1', date: today(), link: '', note: '' })
  const [statusFilter, setStatusFilter] = useState('')

  // Profile form
  const [profileForm, setProfileForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })

  const switchTab = (t: string) => {
    router.push(`/ar/member${t === 'dashboard' ? '' : `?tab=${t}`}`, { scroll: false })
  }

  const logout = () => {
    document.cookie = 'member_token=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/'
    router.push('/ar/member/login')
  }

  const fetchData = useCallback(async () => {
    if (!member?.id) return
    try {
      const url = `/api/member/dashboard?memberId=${member.id}&tab=${tab === 'dashboard' ? 'dashboard' : 'activities'}&status=${statusFilter}`
      const res = await fetch(url)
      if (res.ok) {
        const json = await res.json()
        if (json.success) {
          if (tab === 'dashboard') {
            setStats(json.data.stats)
            setActivities(json.data.recentActivities || [])
          } else if (tab === 'history') {
            setActivities(json.data || [])
          }
        }
      }
    } catch { /* fallback */ }
  }, [member?.id, tab, statusFilter])

  // Load member session on mount
  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch('/api/member/auth')
        if (res.ok) {
          const json = await res.json()
          if (json.success) {
            setMember(json.data)
            return
          }
        }
        router.push('/ar/member/login')
      } catch { router.push('/ar/member/login') }
    }
    loadSession()
  }, [router])

  // Load actions catalog
  useEffect(() => {
    fetch('/api/admin/impact/actions?limit=100').then(r => r.json()).then(d => {
      if (d.success) setActions(d.data || [])
    }).catch(() => {})
  }, [])

  // Fetch stats when member is loaded
  useEffect(() => {
    if (member?.id) fetchData()
  }, [member?.id, fetchData])

  // Submit activity
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!member) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/impact/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beneficiaryId: member.id,
          actionId: subForm.actionId,
          count: Number(subForm.count),
          date: subForm.date,
          link: subForm.link || null,
          note: subForm.note || null,
          status: 'PENDING_REVIEW',
          sourceType: 'MANUAL',
          platformId: member.platformId || null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('تم إرسال النشاط — في انتظار اعتماد مدير المنصة')
        setSubForm({ actionId: '', count: '1', date: today(), link: '', note: '' })
        fetchData()
      } else {
        toast.error(data.message || 'فشل الإرسال')
      }
    } catch { toast.error('فشل الاتصال') }
    finally { setSubmitting(false) }
  }

  // Change password
  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault()
    if (profileForm.newPassword !== profileForm.confirmPassword) {
      toast.error('كلمات المرور غير متطابقة')
      return
    }
    if (profileForm.newPassword.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/member/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: member?.id,
          currentPassword: profileForm.currentPassword,
          newPassword: profileForm.newPassword,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('تم تغيير كلمة المرور بنجاح')
        setProfileForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        toast.error(data.message || 'فشل')
      }
    } catch { toast.error('فشل') }
    finally { setSubmitting(false) }
  }

  if (!member) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50" dir="rtl">
      {/* Top bar */}
      <header className="bg-white border-b border-neutral-200 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="text-primary-600" size={24} />
            <div>
              <h1 className="text-lg font-bold text-neutral-900">مرحباً {member.name}</h1>
              <p className="text-xs text-neutral-500">{member.platformName || 'شبكة رواد'}</p>
            </div>
          </div>
          <button onClick={logout} className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-red-600">
            <LogOut size={16} /> خروج
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-5xl mx-auto flex overflow-x-auto">
          {[
            { id: 'dashboard', label: 'لوحتي', icon: TrendingUp },
            { id: 'submit', label: 'إرسال نشاط', icon: Send },
            { id: 'history', label: 'سجل الأنشطة', icon: FileText },
            { id: 'profile', label: 'حسابي', icon: Settings },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => switchTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                tab === t.id ? 'border-primary-600 text-primary-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto p-4 md:p-6">
        {/* Dashboard Tab */}
        {tab === 'dashboard' && stats && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <KpiCard icon={Star} label="مجموع النقاط" value={stats.totalPoints} color="bg-amber-100 text-amber-600" />
              <KpiCard icon={TrendingUp} label="نقاط الشهر" value={stats.monthlyPoints} color="bg-green-100 text-green-600" />
              <KpiCard icon={Medal} label="الدروع" value={stats.awardsCount} color="bg-purple-100 text-purple-600" />
              <KpiCard icon={Activity} label="الأنشطة" value={stats.activitiesCount} color="bg-teal-100 text-teal-600" />
            </div>

            {/* Level Progress */}
            <div className="card p-5 mb-4">
              <div className="flex justify-between mb-2">
                <span className="font-bold text-neutral-800">المستوى: {stats.levelName}</span>
                <span className="text-sm text-neutral-500">{stats.totalPoints} نقطة</span>
              </div>
              <div className="h-3 bg-neutral-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-teal-500 to-amber-400 rounded-full transition-all" style={{ width: `${stats.levelProgress}%` }} />
              </div>
              {stats.nextLevel && (
                <p className="text-xs text-neutral-500 mt-2">تبقى {stats.gapToNext} نقطة للوصول إلى «{stats.nextLevel}»</p>
              )}
            </div>

            {/* Streak */}
            <div className="card p-4 mb-4 bg-gradient-to-l from-amber-50 to-white border-2 border-amber-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔥</span>
                  <div>
                    <div className="font-bold text-amber-800 text-lg">{stats.streak}</div>
                    <div className="text-xs text-amber-600">يوم متواصل من النشاط</div>
                  </div>
                </div>
                {stats.streak >= 7 && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">🏆 أسبوع كامل!</span>}
                {stats.streak >= 30 && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">👑 شهر كامل!</span>}
              </div>
            </div>

            {/* Recent Activities */}
            <div className="card p-5">
              <h2 className="font-bold text-neutral-900 mb-4 flex items-center gap-2"><Clock size={18} className="text-primary-600" /> آخر الأنشطة</h2>
              {activities.length > 0 ? (
                <div className="space-y-2">
                  {activities.slice(0, 8).map(act => (
                    <div key={act.id} className="border rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-sm">{act.actionName}</div>
                        <div className="flex gap-2 mt-1 text-xs text-neutral-500">
                          <span>{act.date}</span>
                          <Badge className={act.status === 'APPROVED' ? 'bg-green-50 text-green-700' : act.status === 'REJECTED' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}>
                            {STATUS_LABELS[act.status] || act.status}
                          </Badge>
                        </div>
                        {act.rejectionReason && (
                          <p className="text-xs text-red-600 mt-1">❌ {act.rejectionReason}</p>
                        )}
                      </div>
                      <Badge className="bg-neutral-100 text-neutral-600">{QUALITY_LABELS[act.quality]}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-6 text-neutral-400">لا توجد أنشطة بعد — أرسل أول نشاط من تبويب "إرسال نشاط"</p>
              )}
            </div>
          </div>
        )}

        {/* Submit Tab */}
        {tab === 'submit' && (
          <div className="card p-6 max-w-xl mx-auto">
            <h2 className="font-bold text-neutral-900 mb-4 flex items-center gap-2"><Send size={18} className="text-primary-600" /> إرسال نشاط جديد</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">نوع النشاط</label>
                <select required value={subForm.actionId} onChange={e => setSubForm({ ...subForm, actionId: e.target.value })} className="input-field">
                  <option value="">— اختر النشاط —</option>
                  {actions.filter(a => a.isActive).map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.points} نقطة)</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">التاريخ</label>
                  <input type="date" required value={subForm.date} onChange={e => setSubForm({ ...subForm, date: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">العدد</label>
                  <input type="number" min="1" value={subForm.count} onChange={e => setSubForm({ ...subForm, count: e.target.value })} className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">رابط الدليل</label>
                <input value={subForm.link} onChange={e => setSubForm({ ...subForm, link: e.target.value })} className="input-field" placeholder="رابط التصميم، التغريدة، المقال..." />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">ملاحظات</label>
                <textarea rows={2} value={subForm.note} onChange={e => setSubForm({ ...subForm, note: e.target.value })} className="input-field" placeholder="وصف مختصر لما أنجزته..." />
              </div>

              {/* Preview */}
              {subForm.actionId && (
                <div className="rounded-xl bg-primary-50 border border-primary-100 p-3 text-sm text-primary-700">
                  📊 النقاط المتوقعة للإرسال: <b className="font-mono">{Number(subForm.count) * (actions.find(a => a.id === subForm.actionId)?.points || 0)} نقطة</b>
                  <br /><span className="text-xs text-primary-500">بعد موافقة مدير المنصة تُضاف إلى رصيدك</span>
                </div>
              )}

              <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-xs text-amber-700 flex items-start gap-2">
                <Hourglass size={14} className="mt-0.5 flex-shrink-0" />
                <span>سيُرسل نشاطك لمدير المنصة للمراجعة. ستتلقى إشعاراً عند الاعتماد أو الرفض.</span>
              </div>

              <button type="submit" disabled={submitting} className="w-full btn-primary py-3">
                {submitting ? 'جاري الإرسال...' : 'إرسال النشاط'}
              </button>
            </form>
          </div>
        )}

        {/* History Tab */}
        {tab === 'history' && (
          <div className="card p-5">
            <h2 className="font-bold text-neutral-900 mb-4 flex items-center gap-2"><FileText size={18} className="text-primary-600" /> سجل الأنشطة</h2>
            <div className="mb-4">
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field max-w-[200px]">
                <option value="">كل الحالات</option>
                <option value="APPROVED">معتمد</option>
                <option value="PENDING_REVIEW">قيد المراجعة</option>
                <option value="REJECTED">مرفوض</option>
              </select>
            </div>
            {activities.length > 0 ? (
              <div className="space-y-2">
                {activities.map(act => (
                  <div key={act.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-sm">{act.actionName}</div>
                      <Badge className={
                        act.status === 'APPROVED' ? 'bg-green-50 text-green-700' :
                        act.status === 'REJECTED' ? 'bg-red-50 text-red-700' :
                        'bg-amber-50 text-amber-700'
                      }>{STATUS_LABELS[act.status] || act.status}</Badge>
                    </div>
                    <div className="flex gap-3 mt-2 text-xs text-neutral-500">
                      <span>{act.date}</span>
                      <span>×{act.count}</span>
                      <span>{QUALITY_LABELS[act.quality]}</span>
                      <Badge className="bg-neutral-100 text-neutral-600">{CATEGORY_LABELS[act.category] || act.category}</Badge>
                    </div>
                    {act.rejectionReason && (
                      <p className="text-xs text-red-600 mt-2 bg-red-50 p-2 rounded">❌ سبب الرفض: {act.rejectionReason}</p>
                    )}
                    {act.note && <p className="text-xs text-neutral-500 mt-1">{act.note}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-neutral-400">لا توجد أنشطة مسجلة</p>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {tab === 'profile' && (
          <div className="max-w-xl mx-auto space-y-6">
            {/* Member info card */}
            <div className="card p-5">
              <h2 className="font-bold text-neutral-900 mb-4">بياناتي</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-neutral-500">الاسم</span><span className="font-semibold">{member.name}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">الكود</span><span className="font-mono">{member.code}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">البريد</span><span>{member.email || '—'}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">الصفة</span><span>{member.networkRole || '—'}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">المنصة</span><span>{member.platformName || '—'}</span></div>
              </div>
            </div>

            {/* Change password */}
            <div className="card p-5">
              <h2 className="font-bold text-neutral-900 mb-4">تغيير كلمة المرور</h2>
              {member.mustChangePassword && (
                <div className="bg-amber-50 text-amber-700 text-sm p-3 rounded-lg border border-amber-200 mb-4">
                  ⚠️ يرجى تغيير كلمة المرور المؤقتة قبل متابعة استخدام المنصة
                </div>
              )}
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">كلمة المرور الحالية</label>
                  <input type="password" required value={profileForm.currentPassword} onChange={e => setProfileForm({ ...profileForm, currentPassword: e.target.value })} className="input-field" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">كلمة المرور الجديدة</label>
                  <input type="password" required minLength={6} value={profileForm.newPassword} onChange={e => setProfileForm({ ...profileForm, newPassword: e.target.value })} className="input-field" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">تأكيد كلمة المرور الجديدة</label>
                  <input type="password" required value={profileForm.confirmPassword} onChange={e => setProfileForm({ ...profileForm, confirmPassword: e.target.value })} className="input-field" dir="ltr" />
                </div>
                <button type="submit" disabled={submitting} className="btn-primary btn-sm">{submitting ? 'جاري...' : 'تغيير كلمة المرور'}</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number | string; color: string }) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}><Icon size={18} /></div>
      <div>
        <div className="text-lg font-bold text-neutral-900">{value}</div>
        <div className="text-xs text-neutral-500">{label}</div>
      </div>
    </div>
  )
}
