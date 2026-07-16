'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

/**
 * لوحة مدير المنصة — Platform Manager Dashboard
 * تبويبات: الرئيسية | الأعضاء | الأنشطة
 */

import { useSession } from 'next-auth/react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, useCallback, type FormEvent } from 'react'
import { toast } from 'sonner'
import {
  Shield, Users, Activity, TrendingUp, Clock, CheckCircle,
  Search, UserCheck, Plus,
  Hourglass, Eye, Copy, KeyRound
} from 'lucide-react'

// ═══════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════

interface Kpis {
  memberCount: number
  activeNow: number
  pendingReviews: number
  totalApproved: number
  monthlyApproved: number
}

interface PendingActivity {
  id: string
  beneficiaryName: string
  beneficiaryCode: string
  actionName: string
  count: number
  quality: string
  date: string
  note: string | null
}

interface MemberItem {
  id: string
  code: string
  firstName: string
  lastName: string
  name: string
  networkRole: string | null
  status: string
  joinDate: string | null
  email: string | null
  phone: string | null
}

interface ActivityItem {
  id: string
  beneficiaryName: string
  beneficiaryCode: string
  actionName: string
  category: string
  quality: string
  status: string
  date: string
  count: number
  note: string | null
  rejectionReason: string | null
}

interface SessionUserWithPlatform {
  platformName?: string | null
  platformId?: string | null
}

interface CreatedCredentials {
  email: string
  temporaryPassword: string
  loginUrl: string
  welcomeEmailSent: boolean
}

const QUALITY_LABELS: Record<string, string> = { WEAK: 'ضعيف', ACCEPTABLE: 'مقبول', GOOD: 'جيد', EXCELLENT: 'ممتاز', EXCEPTIONAL: 'استثنائي' }
const STATUS_LABELS: Record<string, string> = { APPROVED: 'معتمد', PENDING_REVIEW: 'قيد المراجعة', REJECTED: 'مرفوض' }
const NETWORK_ROLES = ['باحث ومفكر', 'مؤثر رقمي', 'متطوع', 'مشرف', 'رئيس منصة']

function Badge({ children, className }: { children: React.ReactNode; className: string }) {
  return <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>{children}</span>
}

function today() { return new Date().toISOString().slice(0, 10) }

export default function MyPlatformDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') || 'dashboard'

  const sessionUser = session?.user as SessionUserWithPlatform | undefined
  const platformName = sessionUser?.platformName || 'المنصة'
  const platformId = sessionUser?.platformId

  const [kpis, setKpis] = useState<Kpis>({ memberCount: 0, activeNow: 0, pendingReviews: 0, totalApproved: 0, monthlyApproved: 0 })
  const [pendingActivities, setPendingActivities] = useState<PendingActivity[]>([])
  const [members, setMembers] = useState<MemberItem[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])

  // Members form state
  const [memberSearch, setMemberSearch] = useState('')
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [createdCredentials, setCreatedCredentials] = useState<CreatedCredentials | null>(null)
  const [memberForm, setMemberForm] = useState({
    firstName: '', lastName: '', code: '', email: '', phone: '',
    networkRole: '', joinDate: today(),
  })
  const [submitting, setSubmitting] = useState(false)

  // Activity filters
  const [actSearch, setActSearch] = useState('')
  const [actStatusFilter, setActStatusFilter] = useState('')

  const switchTab = (t: string) => {
    router.push(`/ar/admin/my-platform${t === 'dashboard' ? '' : `?tab=${t}`}`, { scroll: false })
  }

  const fetchData = useCallback(async () => {
    if (!platformId) return
    try {
      const res = await fetch(`/api/admin/my-platform/stats?platformId=${platformId}&tab=${tab === 'dashboard' ? 'dashboard' : tab}&search=${memberSearch || actSearch}&status=${actStatusFilter}`)
      if (res.ok) {
        const json = await res.json()
        if (json.success) {
          if (tab === 'dashboard') {
            setKpis(json.data.kpis)
            setPendingActivities(json.data.pendingActivities || [])
          } else if (tab === 'members') {
            setMembers(json.data || [])
          } else if (tab === 'activities') {
            setActivities(json.data || [])
          }
        }
      }
    } catch { /* fallback */ }
  }, [platformId, tab, memberSearch, actSearch, actStatusFilter])

  useEffect(() => { fetchData() }, [fetchData])

  // Approval / Rejection
  const handleApprove = async (logId: string) => {
    try {
      const res = await fetch('/api/admin/impact/logs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: logId, status: 'APPROVED' }),
      })
      if ((await res.json()).success) { toast.success('تم الاعتماد'); fetchData() }
      else toast.error('فشل الاعتماد')
    } catch { toast.error('فشل') }
  }

  const handleReject = async (logId: string) => {
    const reason = prompt('سبب الرفض (إلزامي):')
    if (!reason) return
    try {
      const res = await fetch('/api/admin/impact/logs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: logId, status: 'REJECTED', rejectionReason: reason }),
      })
      if ((await res.json()).success) { toast.success('تم الرفض'); fetchData() }
      else toast.error('فشل الرفض')
    } catch { toast.error('فشل') }
  }

  // Create member
  const handleCreateMember = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...memberForm,
          status: 'ACTIVE',
          type: 'BENEFICIARY',
          platformId,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('تم إضافة العضو بنجاح')
        setShowMemberModal(false)
        setCreatedCredentials(data.data?.credentials || null)
        setMemberForm({ firstName: '', lastName: '', code: `R-${String(members.length + 2).padStart(3, '0')}`, email: '', phone: '', networkRole: '', joinDate: today() })
        fetchData()
      } else {
        toast.error(data.message || 'فشل الحفظ')
      }
    } catch { toast.error('فشل') }
    finally { setSubmitting(false) }
  }

  if (!platformId) {
    return <div className="p-8 text-center text-neutral-400">لا توجد منصة مرتبطة بحسابك</div>
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className="text-primary-600" size={28} />
          <div>
            <h1 className="text-xl font-bold text-neutral-900">لوحة المنصة — {platformName}</h1>
            <p className="text-sm text-neutral-500">مرحباً بك — أنت مدير هذه المنصة</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Button unstyled onClick={() => switchTab('dashboard')} className={`px-4 py-2 rounded-lg font-semibold transition-colors ${tab === 'dashboard' ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}>
            الرئيسية
          </Button>
          <Button unstyled onClick={() => switchTab('members')} className={`px-4 py-2 rounded-lg font-semibold transition-colors ${tab === 'members' ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}>
            الأعضاء
          </Button>
          <Button unstyled onClick={() => switchTab('activities')} className={`px-4 py-2 rounded-lg font-semibold transition-colors ${tab === 'activities' ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}>
            الأنشطة
          </Button>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-primary-200 bg-primary-50 p-4">
        <h2 className="font-bold text-primary-900 mb-2 flex items-center gap-2"><UserCheck size={17} /> إرشادات إدارة الأعضاء</h2>
        <ol className="grid gap-2 text-sm text-primary-900 md:grid-cols-3">
          <li><b>1.</b> من «الأعضاء» أضف الاسم والبريد والصفة؛ البريد مطلوب لإنشاء حساب الدخول.</li>
          <li><b>2.</b> يولد النظام كلمة مرور مؤقتة ويرسلها من البريد الرسمي الموحد.</li>
          <li><b>3.</b> إذا تعذر البريد ستظهر البيانات مرة واحدة لنسخها وتسليمها للعضو بأمان.</li>
        </ol>
      </div>

      {/* Dashboard Tab */}
      {tab === 'dashboard' && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
            <KpiCard icon={Users} label="الأعضاء" value={kpis.memberCount} color="bg-primary-100 text-primary-600" />
            <KpiCard icon={TrendingUp} label="النشطون هذا الشهر" value={kpis.activeNow} color="bg-green-100 text-green-600" />
            <KpiCard icon={Clock} label="بانتظار الاعتماد" value={kpis.pendingReviews} color="bg-amber-100 text-amber-600" />
            <KpiCard icon={CheckCircle} label="المعتمدة هذا الشهر" value={kpis.monthlyApproved} color="bg-teal-100 text-teal-600" />
            <KpiCard icon={CheckCircle} label="إجمالي المعتمدة" value={kpis.totalApproved} color="bg-blue-100 text-blue-600" />
          </div>

          {/* Pending Activities */}
          <div className="card">
            <h2 className="font-bold text-neutral-900 mb-4 flex items-center gap-2">
              <Hourglass size={18} className="text-amber-600" />
              أنشطة بانتظار موافقتي
              {kpis.pendingReviews > 0 && (
                <Badge className="bg-amber-100 text-amber-700">{kpis.pendingReviews}</Badge>
              )}
            </h2>

            {pendingActivities.length > 0 ? (
              <div className="overflow-x-auto">
                <Table className="w-full text-sm">
                  <TableHeader>
                    <TableRow className="border-b border-neutral-200">
                      <TableHead className="text-right p-3 text-neutral-500">العضو</TableHead>
                      <TableHead className="text-right p-3 text-neutral-500">النشاط</TableHead>
                      <TableHead className="text-center p-3 text-neutral-500">العدد</TableHead>
                      <TableHead className="text-right p-3 text-neutral-500">التاريخ</TableHead>
                      <TableHead className="text-center p-3 text-neutral-500">الجودة</TableHead>
                      <TableHead className="text-center p-3 text-neutral-500">إجراء</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingActivities.map(act => (
                      <TableRow key={act.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                        <TableCell className="p-3 font-semibold">{act.beneficiaryName} <span className="text-xs text-neutral-400 font-mono">{act.beneficiaryCode}</span></TableCell>
                        <TableCell className="p-3">{act.actionName}</TableCell>
                        <TableCell className="p-3 text-center font-mono">{act.count}</TableCell>
                        <TableCell className="p-3 text-xs">{act.date}</TableCell>
                        <TableCell className="p-3 text-center text-xs">{QUALITY_LABELS[act.quality] || act.quality}</TableCell>
                        <TableCell className="p-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button unstyled onClick={() => handleApprove(act.id)} className="px-3 py-1 rounded-md text-xs bg-green-50 text-green-700 hover:bg-green-100 font-semibold">
                              ✓ اعتماد
                            </Button>
                            <Button unstyled onClick={() => handleReject(act.id)} className="px-3 py-1 rounded-md text-xs bg-red-50 text-red-700 hover:bg-red-100 font-semibold">
                              ✕ رفض
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center py-8 text-neutral-400">
                <CheckCircle size={36} className="mx-auto mb-3 text-green-300" />
                لا توجد أنشطة معلقة — كل شيء معتمد
              </p>
            )}
          </div>
        </>
      )}

      {/* Members Tab */}
      {tab === 'members' && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-neutral-900 flex items-center gap-2"><Users size={18} className="text-primary-600" /> أعضاء المنصة</h2>
            <Button unstyled onClick={() => setShowMemberModal(true)} className="btn-primary btn-sm flex items-center gap-1.5">
              <Plus size={14} /> إضافة عضو
            </Button>
          </div>

          <div className="mb-4">
            <div className="relative max-w-xs">
              <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <Input
                placeholder="بحث بالاسم أو الكود"
                value={memberSearch}
                onChange={e => setMemberSearch(e.target.value)}
                className="input-field pr-9"
              />
            </div>
          </div>

          {members.length > 0 ? (
            <div className="overflow-x-auto">
              <Table className="w-full text-sm">
                <TableHeader>
                  <TableRow className="border-b border-neutral-200">
                    <TableHead className="text-right p-3 text-neutral-500">الكود</TableHead>
                    <TableHead className="text-right p-3 text-neutral-500">الاسم</TableHead>
                    <TableHead className="text-right p-3 text-neutral-500">الصفة</TableHead>
                    <TableHead className="text-right p-3 text-neutral-500">البريد</TableHead>
                    <TableHead className="text-right p-3 text-neutral-500">تاريخ الانضمام</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map(m => (
                    <TableRow key={m.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                      <TableCell className="p-3 font-mono text-xs">{m.code}</TableCell>
                      <TableCell className="p-3 font-semibold">{m.name}</TableCell>
                      <TableCell className="p-3"><Badge className="bg-neutral-100 text-neutral-600">{m.networkRole || '—'}</Badge></TableCell>
                      <TableCell className="p-3 text-xs text-neutral-500">{m.email || '—'}</TableCell>
                      <TableCell className="p-3 text-xs">{m.joinDate ? new Date(m.joinDate).toLocaleDateString('ar') : '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center py-8 text-neutral-400">لا يوجد أعضاء بعد</p>
          )}
        </div>
      )}

      {/* Activities Tab */}
      {tab === 'activities' && (
        <div className="card">
          <h2 className="font-bold text-neutral-900 mb-4 flex items-center gap-2"><Activity size={18} className="text-primary-600" /> سجل الأنشطة</h2>

          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="relative max-w-[220px]">
              <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <Input placeholder="بحث بالاسم" value={actSearch} onChange={e => setActSearch(e.target.value)} className="input-field pr-9" />
            </div>
            <NativeSelect value={actStatusFilter} onChange={e => setActStatusFilter(e.target.value)} className="input-field max-w-[160px]">
              <option value="">كل الحالات</option>
              <option value="APPROVED">معتمد</option>
              <option value="PENDING_REVIEW">قيد المراجعة</option>
              <option value="REJECTED">مرفوض</option>
            </NativeSelect>
          </div>

          {activities.length > 0 ? (
            <div className="overflow-x-auto">
              <Table className="w-full text-sm">
                <TableHeader>
                  <TableRow className="border-b border-neutral-200">
                    <TableHead className="text-right p-3">العضو</TableHead>
                    <TableHead className="text-right p-3">النشاط</TableHead>
                    <TableHead className="text-center p-3">العدد</TableHead>
                    <TableHead className="text-right p-3">التاريخ</TableHead>
                    <TableHead className="text-center p-3">الجودة</TableHead>
                    <TableHead className="text-center p-3">الحالة</TableHead>
                    <TableHead className="text-right p-3">ملاحظات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map(act => (
                    <TableRow key={act.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                      <TableCell className="p-3 font-semibold">{act.beneficiaryName}</TableCell>
                      <TableCell className="p-3">{act.actionName}</TableCell>
                      <TableCell className="p-3 text-center font-mono">{act.count}</TableCell>
                      <TableCell className="p-3 text-xs">{act.date}</TableCell>
                      <TableCell className="p-3 text-center text-xs">{QUALITY_LABELS[act.quality] || act.quality}</TableCell>
                      <TableCell className="p-3 text-center">
                        <Badge className={
                          act.status === 'APPROVED' ? 'bg-green-50 text-green-700' :
                          act.status === 'REJECTED' ? 'bg-red-50 text-red-700' :
                          'bg-amber-50 text-amber-700'
                        }>{STATUS_LABELS[act.status] || act.status}</Badge>
                      </TableCell>
                      <TableCell className="p-3 text-xs text-neutral-500 max-w-[200px] truncate">
                        {act.rejectionReason ? <span className="text-red-600">رفض: {act.rejectionReason}</span> : act.note || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center py-8 text-neutral-400">لا توجد أنشطة مسجلة</p>
          )}
        </div>
      )}

      {/* Member Creation Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-bold text-neutral-900 flex items-center gap-2"><UserCheck size={20} className="text-primary-600" /> إضافة عضو جديد</h2>
              <Button unstyled onClick={() => setShowMemberModal(false)} className="p-1.5 text-neutral-400 hover:text-neutral-600">
                <span className="text-xl">✕</span>
              </Button>
            </div>
            <form onSubmit={handleCreateMember} className="p-5 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">الاسم الأول *</label>
                  <Input required value={memberForm.firstName} onChange={e => setMemberForm({ ...memberForm, firstName: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">اسم العائلة *</label>
                  <Input required value={memberForm.lastName} onChange={e => setMemberForm({ ...memberForm, lastName: e.target.value })} className="input-field" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">رمز العضو</label>
                  <Input value={memberForm.code} onChange={e => setMemberForm({ ...memberForm, code: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">تاريخ الانضمام</label>
                  <Input type="date" value={memberForm.joinDate} onChange={e => setMemberForm({ ...memberForm, joinDate: e.target.value })} className="input-field" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">البريد الإلكتروني *</label>
                  <Input required type="email" value={memberForm.email} onChange={e => setMemberForm({ ...memberForm, email: e.target.value })} className="input-field" placeholder="email@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">رقم الهاتف</label>
                  <Input type="tel" value={memberForm.phone} onChange={e => setMemberForm({ ...memberForm, phone: e.target.value })} className="input-field" placeholder="+965..." />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">الصفة في الشبكة</label>
                <NativeSelect value={memberForm.networkRole} onChange={e => setMemberForm({ ...memberForm, networkRole: e.target.value })} className="input-field">
                  <option value="">— اختر الصفة —</option>
                  {NETWORK_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </NativeSelect>
              </div>

              <div className="rounded-xl bg-primary-50 border border-primary-100 p-3 text-xs text-primary-700 flex items-start gap-2">
                <Eye size={14} className="mt-0.5 flex-shrink-0" />
                <span>سيُنشأ حساب دخول للعضو وتُولّد له كلمة مرور مؤقتة، وسيُطلب منه تغييرها عند أول دخول.</span>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button unstyled type="button" onClick={() => setShowMemberModal(false)} className="btn-ghost btn-sm">إلغاء</Button>
                <Button unstyled type="submit" disabled={submitting} className="btn-primary btn-sm">{submitting ? 'جاري...' : 'إضافة العضو'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {createdCredentials && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-100 text-green-700 flex items-center justify-center">
                <KeyRound size={20} />
              </div>
              <div>
                <h2 className="font-bold text-neutral-900">تم إنشاء حساب العضو</h2>
                <p className="text-xs text-neutral-500">
                  {createdCredentials.welcomeEmailSent
                    ? 'تم إرسال بيانات الدخول بالبريد، ويمكنك نسخها أيضًا.'
                    : 'تعذر إرسال البريد؛ انسخ البيانات وسلّمها للعضو بأمان.'}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-3 text-sm" dir="ltr">
              <div><span className="text-neutral-500">Email:</span> <b>{createdCredentials.email}</b></div>
              <div><span className="text-neutral-500">Temporary password:</span> <b className="font-mono">{createdCredentials.temporaryPassword}</b></div>
              <div className="break-all"><span className="text-neutral-500">Login:</span> <b>{createdCredentials.loginUrl}</b></div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <Button unstyled
                type="button"
                className="btn-secondary btn-sm flex items-center gap-1.5"
                onClick={async () => {
                  await navigator.clipboard.writeText(
                    `Email: ${createdCredentials.email}\nTemporary password: ${createdCredentials.temporaryPassword}\nLogin: ${createdCredentials.loginUrl}`,
                  )
                  toast.success('تم نسخ بيانات الدخول')
                }}
              >
                <Copy size={14} /> نسخ البيانات
              </Button>
              <Button unstyled type="button" className="btn-primary btn-sm" onClick={() => setCreatedCredentials(null)}>تم</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number | string; color: string }) {
  return (
    <div className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}><Icon size={18} /></div>
      <div>
        <div className="text-lg font-bold text-neutral-900">{value}</div>
        <div className="text-xs text-neutral-500">{label}</div>
      </div>
    </div>
  )
}
