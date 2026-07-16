'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useSession } from 'next-auth/react'
import {
  CheckCircle,
  KeyRound,
  LockKeyhole,
  Mail,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  UserCog,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'PLATFORM_MANAGER'

interface PlatformOption {
  id: string
  name: string
}

interface AdminUser {
  id: string
  email: string
  fullName: string
  role: AdminRole
  platformId: string | null
  platformName: string | null
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

interface UserFormState {
  email: string
  fullName: string
  role: AdminRole
  platformId: string
  isActive: boolean
  password: string
}

const ROLE_LABELS: Record<AdminRole, string> = {
  SUPER_ADMIN: 'مدير عام',
  ADMIN: 'مدير',
  EDITOR: 'محرر',
  PLATFORM_MANAGER: 'مدير منصة',
}

const ROLE_DESCRIPTIONS: Record<AdminRole, string> = {
  SUPER_ADMIN: 'إدارة كاملة للنظام والمستخدمين',
  ADMIN: 'إدارة المحتوى والعمليات',
  EDITOR: 'تحرير المحتوى والبيانات التشغيلية',
  PLATFORM_MANAGER: 'إدارة أعضاء وأنشطة منصة واحدة فقط',
}

const emptyForm: UserFormState = {
  email: '',
  fullName: '',
  role: 'EDITOR',
  platformId: '',
  isActive: true,
  password: '',
}

function getApiMessage(data: { message?: string; error?: string; errors?: { formErrors?: string[]; fieldErrors?: Record<string, string[]> } }) {
  if (data.message || data.error) return data.message || data.error
  const firstField = data.errors?.fieldErrors ? Object.values(data.errors.fieldErrors).flat()[0] : null
  return firstField || data.errors?.formErrors?.[0] || 'حدث خطأ'
}

function dateLabel(value: string | null) {
  if (!value) return 'لم يسجل الدخول'
  return new Date(value).toLocaleString('ar-SA')
}

function roleBadge(role: AdminRole) {
  if (role === 'SUPER_ADMIN') return 'bg-primary-100 text-primary-700'
  if (role === 'ADMIN') return 'bg-info-50 text-info-700'
  if (role === 'PLATFORM_MANAGER') return 'bg-amber-50 text-amber-700'
  return 'bg-neutral-100 text-neutral-600'
}

export default function AdminUsersPage() {
  const { data: session } = useSession()
  const currentRole = (session?.user as { role?: string } | undefined)?.role
  const [users, setUsers] = useState<AdminUser[]>([])
  const [platforms, setPlatforms] = useState<PlatformOption[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<AdminUser | null>(null)
  const [form, setForm] = useState<UserFormState>(emptyForm)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const [res, platformsRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/platforms?compact=1'),
      ])
      const [data, platformsData] = await Promise.all([res.json(), platformsRes.json()])
      if (data.success) {
        setUsers(data.data || [])
      } else {
        toast.error(getApiMessage(data))
      }
      if (platformsData.success) setPlatforms(platformsData.data?.platforms || [])
    } catch {
      toast.error('فشل الاتصال بالخادم')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return users
    return users.filter(user =>
      user.fullName.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      ROLE_LABELS[user.role].includes(q)
    )
  }, [search, users])

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(user => user.isActive).length,
    superAdmins: users.filter(user => user.role === 'SUPER_ADMIN' && user.isActive).length,
  }), [users])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  function openEdit(user: AdminUser) {
    setEditing(user)
    setForm({
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      platformId: user.platformId || '',
      isActive: user.isActive,
      password: '',
    })
    setShowModal(true)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)

    try {
      const payload = {
        ...(editing ? { id: editing.id } : {}),
        ...form,
        platformId: form.role === 'PLATFORM_MANAGER' ? form.platformId : null,
      }
      const res = await fetch('/api/admin/users', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        toast.error(getApiMessage(data))
        return
      }

      toast.success(editing ? 'تم تحديث المستخدم' : 'تم إنشاء المستخدم')
      setShowModal(false)
      await fetchUsers()
    } catch {
      toast.error('فشل حفظ المستخدم')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(user: AdminUser) {
    if (!confirm(`هل تريد حذف المستخدم "${user.fullName}"؟`)) return

    try {
      const res = await fetch(`/api/admin/users?id=${user.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(getApiMessage(data))
        return
      }
      toast.success('تم حذف المستخدم')
      await fetchUsers()
    } catch {
      toast.error('فشل حذف المستخدم')
    }
  }

  if (currentRole && currentRole !== 'SUPER_ADMIN') {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="card text-center py-12">
          <LockKeyhole size={36} className="mx-auto mb-3 text-neutral-300" />
          <h1 className="text-xl font-bold text-neutral-900 mb-2">إدارة المستخدمين</h1>
          <p className="text-sm text-neutral-500">هذه الصفحة متاحة للمدير العام فقط.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-6 gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900 mb-2 flex items-center gap-3">
            <UserCog className="text-primary-600" size={28} />
            مستخدمو النظام
          </h1>
          <p className="text-neutral-500 max-w-2xl text-sm">
            إنشاء حسابات الدخول للوحة التحكم، وتحديد الصلاحيات، وتعطيل الحسابات عند الحاجة.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button unstyled onClick={fetchUsers} className="btn-secondary btn-sm flex items-center gap-1.5" disabled={loading}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            تحديث
          </Button>
          <Button unstyled onClick={openCreate} className="btn-primary btn-sm flex items-center gap-1.5">
            <Plus size={16} />
            إضافة مستخدم
          </Button>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-primary-200 bg-primary-50 p-4">
        <h2 className="font-bold text-primary-900 mb-2 flex items-center gap-2"><Shield size={17} /> كيف تنشئ مدير منصة؟</h2>
        <ol className="grid gap-2 text-sm text-primary-900 md:grid-cols-3">
          <li><b>1.</b> اضغط «إضافة مستخدم» واختر دور «مدير منصة».</li>
          <li><b>2.</b> اختر المنصة التابعة له وحدد بيانات الدخول.</li>
          <li><b>3.</b> عند دخوله ستظهر له «منصتي» وبيانات منصته فقط.</li>
        </ol>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'إجمالي المستخدمين', value: stats.total, icon: UserCog, color: 'bg-primary-100 text-primary-700' },
          { label: 'حسابات نشطة', value: stats.active, icon: CheckCircle, color: 'bg-success-50 text-success-700' },
          { label: 'مدير عام نشط', value: stats.superAdmins, icon: Shield, color: 'bg-info-50 text-info-700' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card flex items-center gap-3 p-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
              <Icon size={18} />
            </div>
            <div>
              <div className="text-lg font-bold text-neutral-900">{value}</div>
              <div className="text-xs text-neutral-500">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card mb-6">
        <div className="relative">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            value={search}
            onChange={event => setSearch(event.target.value)}
            className="input-field pr-9"
            placeholder="بحث بالاسم أو البريد أو الصلاحية..."
          />
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="py-12 text-center text-neutral-400">
            <RefreshCw size={28} className="animate-spin mx-auto mb-3" />
            <p className="text-sm">جاري تحميل المستخدمين...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-12 text-center text-neutral-400">
            <UserCog size={30} className="mx-auto mb-3 text-neutral-300" />
            <p className="text-sm">لا توجد حسابات مطابقة</p>
            <Button unstyled onClick={openCreate} className="btn-primary btn-sm mt-3">
              <Plus size={16} />
              إضافة مستخدم
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="w-full text-sm">
              <TableHeader>
                <TableRow className="bg-neutral-50 border-b border-neutral-200">
                  <TableHead className="text-right py-3 px-4 text-xs font-bold text-neutral-500">المستخدم</TableHead>
                  <TableHead className="text-right py-3 px-4 text-xs font-bold text-neutral-500">الصلاحية</TableHead>
                  <TableHead className="text-right py-3 px-4 text-xs font-bold text-neutral-500">الحالة</TableHead>
                  <TableHead className="text-right py-3 px-4 text-xs font-bold text-neutral-500">آخر دخول</TableHead>
                  <TableHead className="text-right py-3 px-4 text-xs font-bold text-neutral-500">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map(user => (
                  <TableRow key={user.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <TableCell className="py-3 px-4">
                      <p className="font-semibold text-neutral-900">{user.fullName}</p>
                      <p className="text-xs text-neutral-500 inline-flex items-center gap-1">
                        <Mail size={12} />
                        {user.email}
                      </p>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${roleBadge(user.role)}`}>
                        {ROLE_LABELS[user.role]}
                      </span>
                      <p className="text-[11px] text-neutral-400 mt-1">
                        {user.role === 'PLATFORM_MANAGER' && user.platformName
                          ? `${ROLE_DESCRIPTIONS[user.role]} — ${user.platformName}`
                          : ROLE_DESCRIPTIONS[user.role]}
                      </p>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${user.isActive ? 'bg-success-50 text-success-700' : 'bg-neutral-100 text-neutral-500'}`}>
                        {user.isActive ? 'نشط' : 'معطل'}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-xs text-neutral-500">{dateLabel(user.lastLoginAt)}</TableCell>
                    <TableCell className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <Button unstyled onClick={() => openEdit(user)} className="p-2 text-neutral-500 hover:text-primary-600" aria-label="تعديل المستخدم">
                          <Pencil size={15} />
                        </Button>
                        <Button unstyled onClick={() => handleDelete(user)} className="p-2 text-neutral-500 hover:text-error-600" aria-label="حذف المستخدم">
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={event => event.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-neutral-100">
              <div>
                <h2 className="text-lg font-bold text-neutral-900">{editing ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}</h2>
                <p className="text-xs text-neutral-500 mt-1">هذه البيانات تستخدم لتسجيل الدخول إلى لوحة التحكم.</p>
              </div>
              <Button unstyled onClick={() => setShowModal(false)} className="p-2 text-neutral-400 hover:text-neutral-700" aria-label="إغلاق">
                <X size={20} />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">الاسم الكامل</label>
                <Input
                  value={form.fullName}
                  onChange={event => setForm({ ...form, fullName: event.target.value })}
                  className="input-field"
                  required
                  placeholder="مثال: أحمد محمد"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">البريد الإلكتروني</label>
                <Input
                  value={form.email}
                  onChange={event => setForm({ ...form, email: event.target.value })}
                  className="input-field"
                  type="email"
                  required
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">الصلاحية</label>
                <NativeSelect
                  value={form.role}
                  onChange={event => {
                    const role = event.target.value as AdminRole
                    setForm({ ...form, role, platformId: role === 'PLATFORM_MANAGER' ? form.platformId : '' })
                  }}
                  className="input-field"
                >
                  {Object.entries(ROLE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </NativeSelect>
                <p className="text-xs text-neutral-400 mt-1">{ROLE_DESCRIPTIONS[form.role]}</p>
              </div>

              {form.role === 'PLATFORM_MANAGER' && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">المنصة التابعة له</label>
                  <NativeSelect
                    value={form.platformId}
                    onChange={event => setForm({ ...form, platformId: event.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="">— اختر المنصة —</option>
                    {platforms.map(platform => (
                      <option key={platform.id} value={platform.id}>{platform.name}</option>
                    ))}
                  </NativeSelect>
                  <p className="text-xs text-neutral-400 mt-1">لن يتمكن مدير المنصة من الوصول إلى بيانات أي منصة أخرى.</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  كلمة المرور {editing ? <span className="text-neutral-400">(اتركها فارغة بدون تغيير)</span> : null}
                </label>
                <div className="relative">
                  <KeyRound size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <Input
                    value={form.password}
                    onChange={event => setForm({ ...form, password: event.target.value })}
                    className="input-field pr-9"
                    type="password"
                    required={!editing}
                    minLength={editing && !form.password ? undefined : 8}
                    placeholder={editing ? 'كلمة مرور جديدة اختيارية' : '8 أحرف على الأقل'}
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-neutral-700">
                <Input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={event => setForm({ ...form, isActive: event.target.checked })}
                  className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                />
                الحساب نشط ويمكنه تسجيل الدخول
              </label>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
                <Button unstyled type="button" onClick={() => setShowModal(false)} className="btn-secondary btn-sm" disabled={submitting}>
                  إلغاء
                </Button>
                <Button unstyled type="submit" className="btn-primary btn-sm" disabled={submitting}>
                  {submitting ? 'جار الحفظ...' : editing ? 'تحديث المستخدم' : 'إنشاء المستخدم'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
