'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import {
  Activity, Award, BadgeCheck, Blocks, CheckCircle, ClipboardCheck,
  FolderKanban, Pencil, Plus, Star, Target, Trash2, UserCheck, X,
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
  FINAL: { label: 'نهائي', color: 'bg-info-50 text-info-700' },
  APPROVED: { label: 'معتمد', color: 'bg-success-50 text-success-700' },
}

const emptyForm = {
  title: '',
  evaluator: '',
  evaluatorRole: 'INTERNAL',
  type: 'PROGRAM',
  score: '',
  maxScore: '100',
  feedback: '',
  recommendations: '',
  status: 'DRAFT',
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
      const [evalRes, platformsRes, projectsRes] = await Promise.all([
        fetch('/api/admin/evaluations').then(r => r.json()),
        fetch('/api/admin/platforms').then(r => r.json()),
        fetch('/api/admin/projects?limit=100').then(r => r.json()),
      ])
      if (evalRes.success) setEvaluations(evalRes.data || [])
      if (platformsRes.success) setPlatforms(platformsRes.data?.platforms || [])
      if (projectsRes.success) setProjects(projectsRes.data?.projects || [])
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
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (evaluation: Evaluation) => {
    setEditing(evaluation)
    setForm({
      title: evaluation.title,
      evaluator: evaluation.evaluator,
      evaluatorRole: evaluation.evaluatorRole || 'INTERNAL',
      type: evaluation.type,
      score: evaluation.score === null ? '' : String(evaluation.score),
      maxScore: String(evaluation.maxScore),
      feedback: evaluation.feedback || '',
      recommendations: evaluation.recommendations || '',
      status: evaluation.status,
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
        platformId: form.type === 'PLATFORM' ? form.platformId : '',
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
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-6 gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900 mb-2 flex items-center gap-3">
            <ClipboardCheck className="text-primary-600" size={28} />
            التقييم وضمان الجودة
          </h1>
          <p className="text-neutral-500 max-w-2xl text-sm">
            تقييم مستقل للمنصات والبرامج والأنشطة والمشاريع لدعم تحسين الجودة واتخاذ القرار.
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary btn-sm flex items-center gap-1.5">
          <Plus size={15} />
          تقييم جديد
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'إجمالي التقييمات', value: evaluations.length, icon: ClipboardCheck, color: 'bg-primary-100 text-primary-600' },
          { label: 'المعتمدة', value: evaluations.filter(item => item.status === 'APPROVED').length, icon: CheckCircle, color: 'bg-success-50 text-success-600' },
          { label: 'متوسط الجودة', value: `${averageScore}%`, icon: Star, color: 'bg-secondary-100 text-secondary-700' },
          { label: 'طرف ثالث/خارجي', value: evaluations.filter(item => item.evaluatorRole === 'EXTERNAL').length, icon: UserCheck, color: 'bg-info-50 text-info-700' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card flex items-center gap-3 p-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}><Icon size={18} /></div>
            <div><div className="text-lg font-bold text-neutral-900">{value}</div><div className="text-xs text-neutral-500">{label}</div></div>
          </div>
        ))}
      </div>

      {evaluations.length === 0 ? (
        <div className="card text-center py-12 text-neutral-400">
          <ClipboardCheck size={36} className="mx-auto mb-3 text-neutral-300" />
          <p>لا توجد تقييمات بعد</p>
          <button onClick={openCreate} className="btn-primary btn-sm mt-4">إضافة تقييم</button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {evaluations.map(evaluation => {
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
                    <button onClick={() => openEdit(evaluation)} className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg" title="تعديل">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => deleteEvaluation(evaluation.id)} className="p-1.5 text-neutral-400 hover:text-error-600 hover:bg-error-50 rounded-lg" title="حذف">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 mb-4">
                  <div>
                    <p className="text-[11px] text-neutral-400">المقيم</p>
                    <p className="text-sm font-semibold text-neutral-800">{evaluation.evaluator}</p>
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
                {evaluation.recommendations && (
                  <div className="rounded-xl bg-secondary-50 border border-secondary-100 p-3 text-xs text-secondary-900">
                    <span className="font-bold">توصيات:</span> {evaluation.recommendations}
                  </div>
                )}
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
              <button onClick={() => setShowModal(false)} className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">عنوان التقييم</label>
                <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input-field" />
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">النوع</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="input-field">
                    {Object.entries(TYPE_CONFIG).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">الحالة</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input-field">
                    {Object.entries(STATUS_CONFIG).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">تاريخ التقييم</label>
                  <input type="date" value={form.evaluatedAt} onChange={e => setForm({ ...form, evaluatedAt: e.target.value })} className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">العنصر المرتبط</label>
                {form.type === 'PLATFORM' && (
                  <select value={form.platformId} onChange={e => setForm({ ...form, platformId: e.target.value })} className="input-field">
                    <option value="">اختر منصة...</option>
                    {platforms.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                )}
                {form.type === 'PROGRAM' && (
                  <select value={form.programId} onChange={e => setForm({ ...form, programId: e.target.value })} className="input-field">
                    <option value="">اختر برنامج...</option>
                    {programs.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                )}
                {form.type === 'ACTIVITY' && (
                  <select value={form.activityId} onChange={e => setForm({ ...form, activityId: e.target.value })} className="input-field">
                    <option value="">اختر نشاط...</option>
                    {activities.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                )}
                {form.type === 'PROJECT' && (
                  <select value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })} className="input-field">
                    <option value="">اختر مشروع...</option>
                    {projects.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
                  </select>
                )}
                {(form.type === 'SELF' || form.type === 'PEER') && (
                  <p className="rounded-xl bg-neutral-50 border border-neutral-100 p-3 text-xs text-neutral-500">هذا النوع لا يحتاج ربطه بعنصر محدد.</p>
                )}
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">المقيم</label>
                  <input required value={form.evaluator} onChange={e => setForm({ ...form, evaluator: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">دور المقيم</label>
                  <select value={form.evaluatorRole} onChange={e => setForm({ ...form, evaluatorRole: e.target.value })} className="input-field">
                    <option value="INTERNAL">داخلي</option>
                    <option value="EXTERNAL">طرف ثالث/خارجي</option>
                    <option value="PEER">أقران</option>
                  </select>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">النتيجة</label>
                  <input type="number" step="0.01" value={form.score} onChange={e => setForm({ ...form, score: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">الدرجة القصوى</label>
                  <input type="number" step="0.01" value={form.maxScore} onChange={e => setForm({ ...form, maxScore: e.target.value })} className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">الملاحظات</label>
                <textarea rows={3} value={form.feedback} onChange={e => setForm({ ...form, feedback: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">التوصيات</label>
                <textarea rows={3} value={form.recommendations} onChange={e => setForm({ ...form, recommendations: e.target.value })} className="input-field" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
                <button type="button" onClick={() => setShowModal(false)} className="btn-ghost btn-sm">إلغاء</button>
                <button type="submit" disabled={submitting} className="btn-primary btn-sm">{submitting ? 'جاري الحفظ...' : 'حفظ'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
