'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { NativeSelect } from '@/components/ui/native-select'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import {
  Activity, BadgeCheck, Blocks, CheckCircle, ClipboardCheck,
  FolderKanban, Pencil, Plus, Star, Target, Trash2, UserCheck, X,
  AlertTriangle, ListChecks, Search,
} from 'lucide-react'
import { toast } from 'sonner'

interface Evaluation {
  id: string
  title: string
  evaluator: string
  evaluatorRole: string | null
  type: string
  score: number | null
  maxScore: number
  feedback: string | null
  recommendations: string | null
  status: string
  evaluatedAt: string
  submittedAt?: string | null
  approvedAt?: string | null
  rejectionReason?: string | null
  evaluatorUserId?: string | null
  createdBy?: { id: string; fullName: string; email: string } | null
  evaluatorUser?: { id: string; fullName: string; email: string; role: string } | null
  approvedBy?: { id: string; fullName: string; email: string } | null
  permissions: { canEdit: boolean; canDelete: boolean; canSubmit: boolean; canReview: boolean }
  platform?: { id: string; name: string; slug: string } | null
  program?: { id: string; name: string; slug: string } | null
  activity?: { id: string; name: string; slug: string } | null
  project?: { id: string; title: string; slug: string } | null
}

interface PlatformOption {
  id: string
  name: string
  programs?: ProgramOption[]
}

interface ProgramOption {
  id: string
  name: string
  activities?: ActivityOption[]
}

interface ActivityOption {
  id: string
  name: string
}

interface ProjectOption {
  id: string
  title: string
}

interface EvaluatorOption {
  id: string
  fullName: string
  email: string
  role: string
}

interface EvaluationMeta {
  role: string
  canCreate: boolean
  canAssign: boolean
  evaluators: EvaluatorOption[]
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  PLATFORM: { label: 'منصة', icon: Blocks, color: 'bg-primary-100 text-primary-700' },
  PROGRAM: { label: 'برنامج', icon: Target, color: 'bg-secondary-100 text-secondary-700' },
  ACTIVITY: { label: 'نشاط', icon: Activity, color: 'bg-info-50 text-info-700' },
  PROJECT: { label: 'مشروع', icon: FolderKanban, color: 'bg-success-50 text-success-700' },
  SELF: { label: 'ذاتي', icon: UserCheck, color: 'bg-neutral-100 text-neutral-700' },
  PEER: { label: 'أقران', icon: BadgeCheck, color: 'bg-warning-50 text-warning-700' },
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'مسودة', color: 'bg-neutral-100 text-neutral-600' },
  FINAL: { label: 'مرسل للمراجعة', color: 'bg-info-50 text-info-700' },
  SUBMITTED: { label: 'مرسل للمراجعة', color: 'bg-info-50 text-info-700' },
  APPROVED: { label: 'معتمد', color: 'bg-success-50 text-success-700' },
  REJECTED: { label: 'مرفوض للتعديل', color: 'bg-error-50 text-error-700' },
}

const emptyForm = {
  title: '',
  evaluatorUserId: '',
  evaluatorRole: 'INTERNAL',
  type: 'PROGRAM',
  score: '',
  maxScore: '100',
  feedback: '',
  recommendations: '',
  evaluatedAt: new Date().toISOString().slice(0, 10),
  platformId: '',
  programId: '',
  activityId: '',
  projectId: '',
}

function Badge({ children, className }: { children: ReactNode; className: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {children}
    </span>
  )
}

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString('ar')
}

function scorePct(score: number | null, maxScore: number) {
  if (score === null || !maxScore) return null
  return Math.round((score / maxScore) * 100)
}

export default function AdminEvaluationsPage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [platforms, setPlatforms] = useState<PlatformOption[]>([])
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Evaluation | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [platformFilter, setPlatformFilter] = useState('')
  const [creatingTaskId, setCreatingTaskId] = useState<string | null>(null)
  const [actingId, setActingId] = useState<string | null>(null)
  const [meta, setMeta] = useState<EvaluationMeta>({ role: '', canCreate: false, canAssign: false, evaluators: [] })

  const programs = useMemo(
    () => platforms.flatMap(platform => (platform.programs || []).map(program => ({ ...program, platformId: platform.id }))),
    [platforms]
  )

  const activities = useMemo(
    () => programs.flatMap(program => (program.activities || []).map(activity => ({ ...activity, programId: program.id }))),
    [programs]
  )

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const evalRes = await fetch('/api/admin/evaluations').then(r => r.json())
      if (!evalRes.success) throw new Error(evalRes.message || 'فشل تحميل التقييمات')
      setEvaluations(evalRes.data || [])
      setMeta(evalRes.meta || { role: '', canCreate: false, canAssign: false, evaluators: [] })
      if (evalRes.meta?.canAssign) {
        const [platformsRes, projectsRes] = await Promise.all([
          fetch('/api/admin/platforms').then(r => r.json()),
          fetch('/api/admin/projects?limit=100').then(r => r.json()),
        ])
        if (platformsRes.success) setPlatforms(platformsRes.data?.platforms || [])
        if (projectsRes.success) setProjects(projectsRes.data?.projects || [])
      }
    } catch {
      toast.error('فشل تحميل التقييمات')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const openCreate = () => {
    setEditing(null)
    setForm({
      ...emptyForm,
      type: meta.role === 'PLATFORM_MANAGER' ? 'SELF' : 'PROGRAM',
      evaluatorUserId: meta.canAssign ? meta.evaluators[0]?.id || '' : '',
    })
    setShowModal(true)
  }

  const openEdit = (evaluation: Evaluation) => {
    setEditing(evaluation)
    setForm({
      title: evaluation.title,
      evaluatorUserId: evaluation.evaluatorUserId || '',
      evaluatorRole: evaluation.evaluatorRole || 'INTERNAL',
      type: evaluation.type,
      score: evaluation.score === null ? '' : String(evaluation.score),
      maxScore: String(evaluation.maxScore),
      feedback: evaluation.feedback || '',
      recommendations: evaluation.recommendations || '',
      evaluatedAt: new Date(evaluation.evaluatedAt).toISOString().slice(0, 10),
      platformId: evaluation.platform?.id || '',
      programId: evaluation.program?.id || '',
      activityId: evaluation.activity?.id || '',
      projectId: evaluation.project?.id || '',
    })
    setShowModal(true)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      const body = {
        id: editing?.id,
        ...form,
        score: form.score,
        maxScore: form.maxScore,
        action: 'save',
        platformId: ['PLATFORM', 'SELF', 'PEER'].includes(form.type) ? form.platformId : '',
        programId: form.type === 'PROGRAM' ? form.programId : '',
        activityId: form.type === 'ACTIVITY' ? form.activityId : '',
        projectId: form.type === 'PROJECT' ? form.projectId : '',
      }
      const res = await fetch('/api/admin/evaluations', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(editing ? 'تم تحديث التقييم' : 'تم إنشاء التقييم')
        setShowModal(false)
        await fetchData()
      } else {
        toast.error(data.message || 'فشل الحفظ')
      }
    } catch {
      toast.error('فشل الحفظ')
    } finally {
      setSubmitting(false)
    }
  }

  const performAction = async (evaluation: Evaluation, action: 'submit' | 'approve' | 'reject') => {
    let rejectionReason = ''
    if (action === 'reject') {
      rejectionReason = prompt('اكتب سبب الرفض المطلوب من المقيم معالجته:')?.trim() || ''
      if (!rejectionReason) return
    }
    setActingId(evaluation.id)
    try {
      const res = await fetch('/api/admin/evaluations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: evaluation.id,
          action,
          score: evaluation.score,
          maxScore: evaluation.maxScore,
          feedback: evaluation.feedback,
          recommendations: evaluation.recommendations,
          rejectionReason,
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.message)
      toast.success(action === 'submit' ? 'تم إرسال التقييم للمراجعة' : action === 'approve' ? 'تم اعتماد التقييم' : 'تم رفض التقييم وإعادته للتعديل')
      await fetchData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'تعذر تنفيذ الإجراء')
    } finally {
      setActingId(null)
    }
  }

  const deleteEvaluation = async (id: string) => {
    if (!confirm('هل تريد حذف هذا التقييم؟')) return
    try {
      const res = await fetch(`/api/admin/evaluations?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('تم حذف التقييم')
        await fetchData()
      } else {
        toast.error(data.message || 'فشل الحذف')
      }
    } catch {
      toast.error('فشل الحذف')
    }
  }

  const averageScore = evaluations.length > 0
    ? Math.round(
        evaluations.reduce((sum, item) => sum + (scorePct(item.score, item.maxScore) || 0), 0) /
        Math.max(evaluations.filter(item => item.score !== null).length, 1)
      )
    : 0
  const weakCount = evaluations.filter(item => {
    const pct = scorePct(item.score, item.maxScore)
    return pct !== null && pct < 70
  }).length
  const coveredPlatforms = new Set(evaluations.map(item => item.platform?.id).filter(Boolean)).size
  const filteredEvaluations = evaluations.filter(item => {
    const query = search.trim().toLowerCase()
    const target = item.platform?.name || item.program?.name || item.activity?.name || item.project?.title || ''
    return (!query || [item.title, item.evaluator, target, item.feedback, item.recommendations].some(value => value?.toLowerCase().includes(query)))
      && (!typeFilter || item.type === typeFilter)
      && (!statusFilter || item.status === statusFilter)
      && (!platformFilter || item.platform?.id === platformFilter)
  })

  const createFollowUpTask = async (evaluation: Evaluation) => {
    if (!evaluation.recommendations) return
    setCreatingTaskId(evaluation.id)
    const pct = scorePct(evaluation.score, evaluation.maxScore) || 0
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 14)
    try {
      const response = await fetch('/api/admin/coordination/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `متابعة توصية: ${evaluation.title}`,
          description: evaluation.recommendations,
          platformId: evaluation.platform?.id || null,
          assigneeRole: 'مدير المنصة',
          priority: pct < 50 ? 'URGENT' : pct < 70 ? 'HIGH' : 'MEDIUM',
          dueDate: dueDate.toISOString().slice(0, 10),
          notes: `مهمة منشأة من التقييم ${evaluation.id}`,
        }),
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.message)
      toast.success('تم تحويل التوصية إلى مهمة متابعة')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'تعذر إنشاء مهمة المتابعة')
    } finally {
      setCreatingTaskId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
          <p className="mt-3 text-sm text-neutral-400">جاري تحميل التقييمات...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
      <section className="mb-5 overflow-hidden rounded-3xl bg-gradient-to-l from-primary-800 to-primary-600 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold">
              <ClipboardCheck size={15} /> التقييم وضمان الجودة
            </div>
            <h1 className="text-2xl font-black md:text-3xl">مركز ضمان الجودة والتحسين</h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-primary-50">
            قياس جودة المنصات والبرامج، توثيق التوصيات، وتحويل جوانب القصور إلى مهام قابلة للمتابعة.
            </p>
          </div>
          {meta.canCreate && (
            <Button unstyled onClick={openCreate} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-white px-4 text-sm font-black text-primary-800 shadow-sm">
              <Plus size={15} /> {meta.role === 'PLATFORM_MANAGER' ? 'تقييم ذاتي جديد' : 'تكليف تقييم جديد'}
            </Button>
          )}
        </div>
      </section>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'إجمالي التقييمات', value: evaluations.length, icon: ClipboardCheck, color: 'bg-primary-100 text-primary-600' },
          { label: 'المعتمدة', value: evaluations.filter(item => item.status === 'APPROVED').length, icon: CheckCircle, color: 'bg-success-50 text-success-600' },
          { label: 'متوسط الجودة', value: `${averageScore}%`, icon: Star, color: 'bg-secondary-100 text-secondary-700' },
          { label: 'تحتاج تحسينًا', value: weakCount, icon: AlertTriangle, color: 'bg-warning-50 text-warning-700' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card flex items-center gap-3 p-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}><Icon size={18} /></div>
            <div><div className="text-lg font-bold text-neutral-900">{value}</div><div className="text-xs text-neutral-500">{label}</div></div>
          </div>
        ))}
      </div>

      <div className="card mb-6 grid gap-3 p-4 md:grid-cols-4">
        <div className="relative md:col-span-2">
          <Search size={16} className="absolute end-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input value={search} onChange={event => setSearch(event.target.value)} className="input-field pe-10" placeholder="ابحث في التقييم أو الجهة أو التوصيات..." />
        </div>
        <NativeSelect value={typeFilter} onChange={event => setTypeFilter(event.target.value)} className="input-field">
          <option value="">كل أنواع التقييم</option>
          {Object.entries(TYPE_CONFIG).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
        </NativeSelect>
        <NativeSelect value={statusFilter} onChange={event => setStatusFilter(event.target.value)} className="input-field">
          <option value="">كل الحالات</option>
          {Object.entries(STATUS_CONFIG).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
        </NativeSelect>
        <NativeSelect value={platformFilter} onChange={event => setPlatformFilter(event.target.value)} className="input-field md:col-span-2">
          <option value="">كل المنصات ({coveredPlatforms} مغطاة)</option>
          {platforms.map(platform => <option key={platform.id} value={platform.id}>{platform.name}</option>)}
        </NativeSelect>
        <div className="rounded-xl bg-primary-50 px-4 py-2 text-xs text-primary-800 md:col-span-2">
          التوصية لا تبقى نصًا فقط: حوّلها إلى مهمة لمسؤول وموعد نهائي من بطاقة التقييم.
        </div>
      </div>

      {filteredEvaluations.length === 0 ? (
        <div className="card text-center py-12 text-neutral-400">
          <ClipboardCheck size={36} className="mx-auto mb-3 text-neutral-300" />
          <p>{evaluations.length ? 'لا توجد نتائج مطابقة لعوامل التصفية' : 'لا توجد تقييمات بعد'}</p>
          {meta.canCreate && <Button unstyled onClick={openCreate} className="btn-primary btn-sm mt-4">إضافة تقييم</Button>}
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {filteredEvaluations.map(evaluation => {
            const typeCfg = TYPE_CONFIG[evaluation.type] || TYPE_CONFIG.PROGRAM
            const statusCfg = STATUS_CONFIG[evaluation.status] || STATUS_CONFIG.DRAFT
            const TypeIcon = typeCfg.icon
            const pct = scorePct(evaluation.score, evaluation.maxScore)
            const targetName = evaluation.platform?.name || evaluation.program?.name || evaluation.activity?.name || evaluation.project?.title || 'تقييم عام'

            return (
              <div key={evaluation.id} className="card">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge className={typeCfg.color}><TypeIcon size={12} />{typeCfg.label}</Badge>
                      <Badge className={statusCfg.color}>{statusCfg.label}</Badge>
                    </div>
                    <h2 className="font-bold text-neutral-900">{evaluation.title}</h2>
                    <p className="text-xs text-neutral-500 mt-1">{targetName}</p>
                  </div>
                  <div className="flex gap-1">
                    {evaluation.permissions.canEdit && <Button unstyled onClick={() => openEdit(evaluation)} className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg" title="تعديل">
                      <Pencil size={14} />
                    </Button>}
                    {evaluation.permissions.canDelete && <Button unstyled onClick={() => deleteEvaluation(evaluation.id)} className="p-1.5 text-neutral-400 hover:text-error-600 hover:bg-error-50 rounded-lg" title="حذف">
                      <Trash2 size={14} />
                    </Button>}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 mb-4">
                  <div>
                    <p className="text-[11px] text-neutral-400">المقيم</p>
                    <p className="text-sm font-semibold text-neutral-800">{evaluation.evaluatorUser?.fullName || evaluation.evaluator}</p>
                    {evaluation.evaluatorUser?.email && <p className="text-[10px] text-neutral-400">{evaluation.evaluatorUser.email}</p>}
                    {evaluation.evaluatorRole && <p className="text-[10px] text-neutral-400">{evaluation.evaluatorRole}</p>}
                  </div>
                  <div className="text-left">
                    <p className="text-[11px] text-neutral-400">النتيجة</p>
                    <p className="text-xl font-bold text-neutral-900">{evaluation.score ?? '-'} / {evaluation.maxScore}</p>
                  </div>
                </div>

                {pct !== null && (
                  <div className="mb-4">
                    <div className="flex justify-between text-[10px] text-neutral-500 mb-1">
                      <span>نسبة الجودة</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${pct >= 85 ? 'bg-success-500' : pct >= 70 ? 'bg-primary-500' : pct >= 50 ? 'bg-warning-500' : 'bg-error-500'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )}

                {evaluation.feedback && <p className="text-xs text-neutral-600 leading-relaxed mb-3">{evaluation.feedback}</p>}
                {evaluation.rejectionReason && (
                  <div className="mb-3 rounded-xl border border-error-100 bg-error-50 p-3 text-xs text-error-800">
                    <span className="font-bold">سبب الإعادة للتعديل:</span> {evaluation.rejectionReason}
                  </div>
                )}
                {evaluation.recommendations && (
                  <div className="rounded-xl bg-secondary-50 border border-secondary-100 p-3 text-xs text-secondary-900">
                    <div><span className="font-bold">توصيات:</span> {evaluation.recommendations}</div>
                    {evaluation.status === 'APPROVED' && <Button
                      unstyled
                      onClick={() => createFollowUpTask(evaluation)}
                      disabled={creatingTaskId === evaluation.id}
                      className="btn-ghost btn-xs mt-3 inline-flex items-center gap-1"
                    >
                      <ListChecks size={13} />
                      {creatingTaskId === evaluation.id ? 'جارٍ إنشاء المهمة...' : 'تحويل إلى مهمة متابعة'}
                    </Button>}
                  </div>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-3">
                  {evaluation.permissions.canSubmit && (
                    <Button unstyled onClick={() => performAction(evaluation, 'submit')} disabled={actingId === evaluation.id} className="btn-primary btn-xs">
                      إرسال للمراجعة
                    </Button>
                  )}
                  {evaluation.permissions.canReview && (
                    <>
                      <Button unstyled onClick={() => performAction(evaluation, 'approve')} disabled={actingId === evaluation.id} className="btn-primary btn-xs">اعتماد</Button>
                      <Button unstyled onClick={() => performAction(evaluation, 'reject')} disabled={actingId === evaluation.id} className="btn-ghost btn-xs text-error-700">رفض وإعادة</Button>
                    </>
                  )}
                  {evaluation.createdBy && <span className="text-[10px] text-neutral-400">أنشأه: {evaluation.createdBy.fullName}</span>}
                  {evaluation.approvedBy && <span className="text-[10px] text-success-700">اعتمده: {evaluation.approvedBy.fullName}</span>}
                </div>
                <p className="text-[10px] text-neutral-400 mt-3">تاريخ التقييم: {dateLabel(evaluation.evaluatedAt)}</p>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-neutral-200">
              <h2 className="text-lg font-bold text-neutral-900">{editing ? 'تعديل تقييم' : 'تقييم جديد'}</h2>
              <Button unstyled onClick={() => setShowModal(false)} className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100">
                <X size={18} />
              </Button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">عنوان التقييم</label>
                <Input required disabled={meta.role === 'EVALUATOR'} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input-field" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">النوع</label>
                  <NativeSelect disabled={!meta.canAssign} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="input-field">
                    {Object.entries(TYPE_CONFIG).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
                  </NativeSelect>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">تاريخ التقييم</label>
                  <Input type="date" value={form.evaluatedAt} onChange={e => setForm({ ...form, evaluatedAt: e.target.value })} className="input-field" />
                </div>
              </div>
              {meta.canAssign ? <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">العنصر المرتبط</label>
                {form.type === 'PLATFORM' && (
                  <NativeSelect value={form.platformId} onChange={e => setForm({ ...form, platformId: e.target.value })} className="input-field">
                    <option value="">اختر منصة...</option>
                    {platforms.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </NativeSelect>
                )}
                {form.type === 'PROGRAM' && (
                  <NativeSelect value={form.programId} onChange={e => setForm({ ...form, programId: e.target.value })} className="input-field">
                    <option value="">اختر برنامج...</option>
                    {programs.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </NativeSelect>
                )}
                {form.type === 'ACTIVITY' && (
                  <NativeSelect value={form.activityId} onChange={e => setForm({ ...form, activityId: e.target.value })} className="input-field">
                    <option value="">اختر نشاط...</option>
                    {activities.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </NativeSelect>
                )}
                {form.type === 'PROJECT' && (
                  <NativeSelect value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })} className="input-field">
                    <option value="">اختر مشروع...</option>
                    {projects.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
                  </NativeSelect>
                )}
                {(form.type === 'SELF' || form.type === 'PEER') && (
                  <NativeSelect value={form.platformId} onChange={e => setForm({ ...form, platformId: e.target.value })} className="input-field">
                    <option value="">اختر منصة...</option>
                    {platforms.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </NativeSelect>
                )}
              </div> : (
                <div className="rounded-xl border border-primary-100 bg-primary-50 p-3 text-xs text-primary-800">
                  {meta.role === 'PLATFORM_MANAGER' ? 'سيُربط التقييم ذاتيًا بمنصتك تلقائيًا.' : 'يمكنك تعبئة نتيجة التقييم المسند إليك فقط؛ الجهة والمقيم محددان من الإدارة.'}
                </div>
              )}
              {meta.canAssign && <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">حساب المقيم الموثق</label>
                  <NativeSelect required value={form.evaluatorUserId} onChange={e => setForm({ ...form, evaluatorUserId: e.target.value })} className="input-field">
                    <option value="">اختر المقيم...</option>
                    {meta.evaluators.map(item => <option key={item.id} value={item.id}>{item.fullName} — {item.email}</option>)}
                  </NativeSelect>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">دور المقيم</label>
                  <NativeSelect value={form.evaluatorRole} onChange={e => setForm({ ...form, evaluatorRole: e.target.value })} className="input-field">
                    <option value="INTERNAL">داخلي</option>
                    <option value="EXTERNAL">طرف ثالث/خارجي</option>
                    <option value="PEER">أقران</option>
                  </NativeSelect>
                </div>
              </div>}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">النتيجة</label>
                  <Input type="number" step="0.01" value={form.score} onChange={e => setForm({ ...form, score: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">الدرجة القصوى</label>
                  <Input type="number" step="0.01" value={form.maxScore} onChange={e => setForm({ ...form, maxScore: e.target.value })} className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">الملاحظات</label>
                <Textarea rows={3} value={form.feedback} onChange={e => setForm({ ...form, feedback: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">التوصيات</label>
                <Textarea rows={3} value={form.recommendations} onChange={e => setForm({ ...form, recommendations: e.target.value })} className="input-field" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
                <Button unstyled type="button" onClick={() => setShowModal(false)} className="btn-ghost btn-sm">إلغاء</Button>
                <Button unstyled type="submit" disabled={submitting} className="btn-primary btn-sm">{submitting ? 'جاري الحفظ...' : 'حفظ'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
