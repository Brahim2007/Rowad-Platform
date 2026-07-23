'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle, BrainCircuit, CheckCircle2, Database, RefreshCw,
  ShieldCheck, Sparkles, UserCog, XCircle, Activity,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface Recommendation {
  id: string
  category: 'DATA_QUALITY' | 'PLATFORM' | 'MANAGER' | 'ACTIVITY'
  severity: 'CRITICAL' | 'WARNING' | 'INFO'
  title: string
  summary: string
  evidence: string
  proposedAction: string
  platformId: string | null
  subjectName: string | null
  status: 'DRAFT' | 'APPROVED' | 'REJECTED'
  aiEnhanced: boolean
  generatedBy: string
  reviewedBy: string | null
  reviewedAt: string | null
  reviewNote: string | null
  actionType: string | null
  actionTargetId: string | null
  actionTargetName: string | null
  actionedBy: string | null
  actionedAt: string | null
  createdAt: string
}

interface ActionTargets {
  members: Array<{ id: string; name: string; code: string }>
  managers: Array<{ id: string; fullName: string; email: string }>
}

const CATEGORY_LABELS = {
  DATA_QUALITY: 'جودة البيانات',
  PLATFORM: 'تقييم المنصات',
  MANAGER: 'تقييم الإدارة',
  ACTIVITY: 'تدقيق الأنشطة',
}

const CATEGORY_ICONS = {
  DATA_QUALITY: Database,
  PLATFORM: ShieldCheck,
  MANAGER: UserCog,
  ACTIVITY: Activity,
}

export default function AiGovernanceCenterPage() {
  const [items, setItems] = useState<Recommendation[]>([])
  const [summary, setSummary] = useState<Record<string, number>>({})
  const [status, setStatus] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [workingId, setWorkingId] = useState<string | null>(null)
  const [actionItem, setActionItem] = useState<Recommendation | null>(null)
  const [targets, setTargets] = useState<ActionTargets>({ members: [], managers: [] })
  const [actionForm, setActionForm] = useState({
    actionType: 'INTERNAL',
    targetMemberId: '',
    assignee: '',
    assigneeRole: '',
    priority: 'HIGH',
    dueDate: '',
    note: '',
  })
  const [executing, setExecuting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/ai-governance?status=${status}&category=${category}`, { cache: 'no-store' })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.message || 'تعذر تحميل التوصيات')
      setItems(result.data || [])
      setSummary(result.summary || {})
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'تعذر تحميل التوصيات')
    } finally {
      setLoading(false)
    }
  }, [category, status])

  useEffect(() => { load() }, [load])

  const generate = async () => {
    setGenerating(true)
    try {
      const response = await fetch('/api/admin/ai-governance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'GENERATE' }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.message || 'تعذر إجراء التحليل')
      toast.success(`اكتمل التحليل: ${result.data.created} جديد، ${result.data.refreshed} محدث${result.data.aiEnhanced ? ' — تمت مراجعة الصياغة بالذكاء الاصطناعي' : ''}`)
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'تعذر إجراء التحليل')
    } finally {
      setGenerating(false)
    }
  }

  const review = async (id: string, action: 'APPROVE' | 'REJECT') => {
    const note = action === 'REJECT' ? window.prompt('سبب رفض التوصية (اختياري):') : ''
    if (action === 'REJECT' && note === null) return
    setWorkingId(id)
    try {
      const response = await fetch('/api/admin/ai-governance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, note }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.message || 'تعذر حفظ القرار')
      toast.success(action === 'APPROVE' ? 'تم اعتماد التوصية' : 'تم رفض التوصية')
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'تعذر حفظ القرار')
    } finally {
      setWorkingId(null)
    }
  }

  const openAction = async (item: Recommendation) => {
    setActionItem(item)
    setActionForm({
      actionType: item.platformId ? 'NOTIFY_MANAGER' : 'INTERNAL',
      targetMemberId: '',
      assignee: '',
      assigneeRole: '',
      priority: 'HIGH',
      dueDate: '',
      note: '',
    })
    try {
      const response = await fetch(`/api/admin/ai-governance?targetsFor=${item.id}`, { cache: 'no-store' })
      const result = await response.json()
      if (response.ok && result.success) setTargets(result.data)
    } catch {
      setTargets({ members: [], managers: [] })
    }
  }

  const executeAction = async () => {
    if (!actionItem) return
    setExecuting(true)
    try {
      const response = await fetch('/api/admin/ai-governance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'EXECUTE', id: actionItem.id, ...actionForm }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.message || 'تعذر تنفيذ الإجراء')
      const labels: Record<string, string> = {
        NOTIFY_MANAGER: 'تم إرسال الإشعار لمدير المنصة',
        NOTIFY_MEMBER: 'تم إرسال الإشعار للعضو',
        CREATE_TASK: 'تم إنشاء المهمة',
        INTERNAL: 'تم حفظ القرار داخليًا',
      }
      toast.success(labels[actionForm.actionType] || 'تم تنفيذ الإجراء')
      setActionItem(null)
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'تعذر تنفيذ الإجراء')
    } finally {
      setExecuting(false)
    }
  }

  const counts = useMemo(() => ({
    all: Object.values(summary).reduce((sum, value) => sum + value, 0),
    draft: summary.DRAFT || 0,
    approved: summary.APPROVED || 0,
    rejected: summary.REJECTED || 0,
  }), [summary])
  const summaryCards: Array<{ label: string; value: number; Icon: LucideIcon; tone: string }> = [
    { label: 'جميع التوصيات', value: counts.all, Icon: BrainCircuit, tone: 'text-primary-700 bg-primary-50' },
    { label: 'بانتظار القرار', value: counts.draft, Icon: AlertTriangle, tone: 'text-amber-700 bg-amber-50' },
    { label: 'المعتمدة', value: counts.approved, Icon: CheckCircle2, tone: 'text-emerald-700 bg-emerald-50' },
    { label: 'المرفوضة', value: counts.rejected, Icon: XCircle, tone: 'text-red-700 bg-red-50' },
  ]

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6 lg:p-8">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-l from-slate-950 via-primary-900 to-indigo-800 p-6 text-white md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-white/75"><BrainCircuit size={14} /> لمدير النظام فقط</div>
            <h1 className="text-2xl font-black md:text-3xl">مركز التقييم والتقويم الذكي</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/70">يجمع مشكلات جودة البيانات وأداء المنصات والمديرين والأنشطة، ويربط كل توصية بدليل واضح قبل اعتمادها بشريًا.</p>
          </div>
          <Button unstyled onClick={generate} disabled={generating} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-primary-900 shadow-lg hover:bg-primary-50">
            <Sparkles size={17} className={generating ? 'animate-pulse' : ''} />
            {generating ? 'جارٍ تحليل النظام...' : 'تشغيل التقييم الذكي'}
          </Button>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {summaryCards.map(({ label, value, Icon, tone }) => (
          <div key={label} className="rounded-2xl border border-neutral-200 bg-white p-4">
            <div className={`mb-3 flex size-9 items-center justify-center rounded-xl ${tone}`}><Icon size={17} /></div>
            <div className="text-2xl font-black text-neutral-900">{value.toLocaleString('ar-SA')}</div>
            <div className="text-xs font-semibold text-neutral-500">{label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="space-y-1">
            <span className="text-xs font-semibold text-neutral-600">حالة القرار</span>
            <NativeSelect value={status} onChange={event => setStatus(event.target.value)} wrapperClassName="w-44">
              <option value="">كل الحالات</option>
              <option value="DRAFT">بانتظار القرار</option>
              <option value="APPROVED">معتمدة</option>
              <option value="REJECTED">مرفوضة</option>
            </NativeSelect>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold text-neutral-600">القسم</span>
            <NativeSelect value={category} onChange={event => setCategory(event.target.value)} wrapperClassName="w-48">
              <option value="">كل الأقسام</option>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </NativeSelect>
          </label>
          <Button unstyled onClick={load} disabled={loading} className="btn-ghost inline-flex h-10 items-center gap-2"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> تحديث</Button>
        </div>
      </div>

      <div className="space-y-4">
        {loading && !items.length ? (
          <div className="py-20 text-center text-sm text-neutral-400">جارٍ تحميل مركز القرارات...</div>
        ) : items.length ? items.map(item => {
          const Icon = CATEGORY_ICONS[item.category]
          const severityTone = item.severity === 'CRITICAL' ? 'border-red-200 bg-red-50 text-red-800' : item.severity === 'WARNING' ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-blue-200 bg-blue-50 text-blue-800'
          return (
            <article key={item.id} className="rounded-2xl border border-neutral-200 bg-white p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-bold text-neutral-700"><Icon size={12} /> {CATEGORY_LABELS[item.category]}</span>
                    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${severityTone}`}>{item.severity === 'CRITICAL' ? 'عالية' : item.severity === 'WARNING' ? 'متوسطة' : 'معلومة'}</span>
                    {item.aiEnhanced && <span className="rounded-full bg-purple-50 px-2.5 py-1 text-[10px] font-bold text-purple-700">صياغة ذكية</span>}
                    {item.subjectName && <span className="text-[10px] text-neutral-400">{item.subjectName}</span>}
                  </div>
                  <h2 className="mt-3 text-lg font-black text-neutral-900">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">{item.summary}</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl bg-neutral-50 p-3"><div className="text-[10px] font-bold text-neutral-500">الدليل المحسوب</div><p className="mt-1 text-xs leading-5 text-neutral-700">{item.evidence}</p></div>
                    <div className="rounded-xl bg-primary-50 p-3"><div className="text-[10px] font-bold text-primary-600">الإجراء المقترح</div><p className="mt-1 text-xs leading-5 text-primary-900">{item.proposedAction}</p></div>
                  </div>
                  {item.reviewedBy && <div className="mt-3 text-[10px] text-neutral-400">راجعه {item.reviewedBy}{item.reviewNote ? ` — ${item.reviewNote}` : ''}</div>}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {item.status === 'DRAFT' ? (
                    <>
                      <Button unstyled onClick={() => review(item.id, 'APPROVE')} disabled={workingId === item.id} className="btn-primary btn-sm inline-flex items-center gap-1.5"><CheckCircle2 size={14} /> اعتماد</Button>
                      <Button unstyled onClick={() => review(item.id, 'REJECT')} disabled={workingId === item.id} className="btn-ghost btn-sm inline-flex items-center gap-1.5 text-red-700"><XCircle size={14} /> رفض</Button>
                    </>
                  ) : item.status === 'APPROVED' && !item.actionType ? (
                    <Button unstyled onClick={() => openAction(item)} className="btn-primary btn-sm">تحديد الإجراء</Button>
                  ) : item.status === 'APPROVED' ? (
                    <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                      {item.actionType === 'NOTIFY_MANAGER' ? 'أُرسل لمدير المنصة' : item.actionType === 'NOTIFY_MEMBER' ? 'أُرسل للعضو' : item.actionType === 'CREATE_TASK' ? 'تحولت إلى مهمة' : 'قرار داخلي'}
                      {item.actionTargetName ? ` — ${item.actionTargetName}` : ''}
                    </span>
                  ) : (
                    <span className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700">مرفوضة</span>
                  )}
                  {item.platformId && <Link href={`/ar/admin/platforms-overview`} className="btn-ghost btn-sm no-underline">المنصات</Link>}
                </div>
              </div>
            </article>
          )
        }) : <div className="rounded-2xl border border-dashed border-neutral-300 bg-white py-20 text-center"><BrainCircuit className="mx-auto text-neutral-300" /><p className="mt-3 text-sm text-neutral-500">لا توجد توصيات ضمن المرشحات. شغّل التقييم الذكي لإنشاء المسودات.</p></div>}
      </div>

      {actionItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-950/45 p-4" onMouseDown={event => { if (event.target === event.currentTarget) setActionItem(null) }}>
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
            <div>
              <h2 className="text-lg font-black text-neutral-900">تحديد إجراء التوصية المعتمدة</h2>
              <p className="mt-1 text-xs text-neutral-500">{actionItem.title}</p>
            </div>
            <div className="mt-5 space-y-4">
              <label className="space-y-1">
                <span className="text-xs font-bold text-neutral-600">الإجراء</span>
                <NativeSelect value={actionForm.actionType} onChange={event => setActionForm(current => ({ ...current, actionType: event.target.value }))}>
                  <option value="INTERNAL">حفظ كقرار داخلي دون إرسال</option>
                  <option value="NOTIFY_MANAGER" disabled={!actionItem.platformId}>إرسال إشعار لمدير المنصة</option>
                  <option value="NOTIFY_MEMBER">إرسال إشعار لعضو محدد</option>
                  <option value="CREATE_TASK">تحويل إلى مهمة</option>
                </NativeSelect>
              </label>

              {actionForm.actionType === 'NOTIFY_MANAGER' && (
                <div className="rounded-xl border border-primary-200 bg-primary-50 p-3 text-xs text-primary-900">
                  {targets.managers.length
                    ? `سيصل الإشعار إلى المدير الأساسي: ${targets.managers.map(manager => manager.fullName).join('، ')}`
                    : 'لا يوجد مدير أساسي نشط؛ لن يتم الإرسال حتى يتم تعيين مدير.'}
                </div>
              )}

              {actionForm.actionType === 'NOTIFY_MEMBER' && (
                <label className="space-y-1">
                  <span className="text-xs font-bold text-neutral-600">العضو المستلم</span>
                  <NativeSelect value={actionForm.targetMemberId} onChange={event => setActionForm(current => ({ ...current, targetMemberId: event.target.value }))}>
                    <option value="">— اختر العضو —</option>
                    {targets.members.map(member => <option key={member.id} value={member.id}>{member.name} — {member.code}</option>)}
                  </NativeSelect>
                </label>
              )}

              {actionForm.actionType === 'CREATE_TASK' && (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1"><span className="text-xs font-bold text-neutral-600">المسؤول *</span><Input value={actionForm.assignee} onChange={event => setActionForm(current => ({ ...current, assignee: event.target.value }))} placeholder="اسم المسؤول" /></label>
                    <label className="space-y-1"><span className="text-xs font-bold text-neutral-600">صفته</span><Input value={actionForm.assigneeRole} onChange={event => setActionForm(current => ({ ...current, assigneeRole: event.target.value }))} placeholder="مدير المنصة، مسؤول الجودة..." /></label>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1"><span className="text-xs font-bold text-neutral-600">الأولوية</span><NativeSelect value={actionForm.priority} onChange={event => setActionForm(current => ({ ...current, priority: event.target.value }))}><option value="URGENT">عاجلة</option><option value="HIGH">عالية</option><option value="MEDIUM">متوسطة</option><option value="LOW">منخفضة</option></NativeSelect></label>
                    <label className="space-y-1"><span className="text-xs font-bold text-neutral-600">الموعد النهائي</span><Input type="date" value={actionForm.dueDate} onChange={event => setActionForm(current => ({ ...current, dueDate: event.target.value }))} /></label>
                  </div>
                </>
              )}

              {actionForm.actionType === 'INTERNAL' && (
                <label className="space-y-1"><span className="text-xs font-bold text-neutral-600">ملاحظة القرار</span><Textarea rows={3} value={actionForm.note} onChange={event => setActionForm(current => ({ ...current, note: event.target.value }))} placeholder="سبب الاحتفاظ داخليًا أو المراجعة اللاحقة..." /></label>
              )}

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                بعد التنفيذ يُقفل الإجراء على هذه التوصية لمنع الإرسال أو إنشاء المهمة مرتين.
              </div>
              <div className="flex justify-end gap-2">
                <Button unstyled onClick={() => setActionItem(null)} disabled={executing} className="btn-ghost">إلغاء</Button>
                <Button
                  unstyled
                  onClick={executeAction}
                  disabled={executing || (actionForm.actionType === 'NOTIFY_MEMBER' && !actionForm.targetMemberId) || (actionForm.actionType === 'NOTIFY_MANAGER' && !targets.managers.length) || (actionForm.actionType === 'CREATE_TASK' && !actionForm.assignee.trim())}
                  className="btn-primary"
                >
                  {executing ? 'جارٍ التنفيذ...' : 'تأكيد الإجراء'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
