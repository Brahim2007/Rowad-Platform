'use client'

import React, { useEffect, useState, useCallback } from 'react'
import {
  Plus, Pencil, Trash2, X, CalendarCheck, CheckCircle2, Clock,
  AlertCircle, User, ChevronDown, ShieldCheck, ListChecks,
  Flag, Filter, Calendar, Hash, Briefcase, AlertTriangle,
  ArrowUpCircle, XCircle,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ───

interface Task {
  id: string
  title: string
  description: string | null
  assignee: string | null
  assigneeRole: string | null
  status: string
  priority: string
  dueDate: string | null
  completedAt: string | null
  notes: string | null
  createdAt: string
  platform?: { name: string; slug: string } | null
  program?: { name: string; slug: string } | null
}

interface DataStandard {
  id: string
  name: string
  slug: string
  description: string | null
  scope: string
  requiredFields: string
  validationRules: string | null
  isActive: boolean
  createdAt: string
}

// ─── Constants ───

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PENDING: { label: 'قيد الانتظار', color: 'bg-neutral-100 text-neutral-600', icon: Clock },
  IN_PROGRESS: { label: 'قيد التنفيذ', color: 'bg-primary-100 text-primary-600', icon: ArrowUpCircle },
  COMPLETED: { label: 'مكتمل', color: 'bg-success-50 text-success-600', icon: CheckCircle2 },
  CANCELLED: { label: 'ملغى', color: 'bg-error-50 text-error-500', icon: XCircle },
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  LOW: { label: 'منخفض', color: 'bg-neutral-100 text-neutral-500' },
  MEDIUM: { label: 'متوسط', color: 'bg-info-50 text-info-600' },
  HIGH: { label: 'عالي', color: 'bg-warning-50 text-warning-600' },
  URGENT: { label: 'عاجل', color: 'bg-error-50 text-error-600' },
}

const SCOPE_LABELS: Record<string, string> = {
  beneficiary: 'المستفيدين', enrollment: 'التسجيل', activity: 'الأنشطة',
  program: 'البرامج', platform: 'المنصات', report: 'التقارير', other: 'أخرى',
}

const emptyTask = {
  title: '', description: '', assignee: '', assigneeRole: '',
  status: 'PENDING', priority: 'MEDIUM', dueDate: '', notes: '',
  platformId: '', programId: '',
}

const emptyStandard = {
  name: '', slug: '', description: '', scope: 'beneficiary',
  requiredFields: '', validationRules: '',
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
    secondary: 'bg-secondary-100 text-secondary-700',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant] || variants.primary} ${className}`}>
      {children}
    </span>
  )
}

// ─── Main Page ───

export default function AdminCoordinationPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [standards, setStandards] = useState<DataStandard[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedTask, setExpandedTask] = useState<string | null>(null)

  // Task CRUD
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [taskForm, setTaskForm] = useState(emptyTask)
  const [taskSubmitting, setTaskSubmitting] = useState(false)

  // Standard CRUD
  const [showStdModal, setShowStdModal] = useState(false)
  const [editingStd, setEditingStd] = useState<DataStandard | null>(null)
  const [stdForm, setStdForm] = useState(emptyStandard)
  const [stdSubmitting, setStdSubmitting] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [tRes, sRes] = await Promise.all([
        fetch('/api/admin/coordination/tasks').then(r => r.json()),
        fetch('/api/admin/coordination/standards').then(r => r.json()),
      ])
      if (tRes.success) setTasks(tRes.data || [])
      if (sRes.success) setStandards(sRes.data || [])
    } catch { toast.error('فشل تحميل البيانات') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const pendingCount = tasks.filter(t => t.status === 'PENDING').length
  const inProgressCount = tasks.filter(t => t.status === 'IN_PROGRESS').length
  const completedCount = tasks.filter(t => t.status === 'COMPLETED').length
  const urgentCount = tasks.filter(t => t.priority === 'URGENT' && t.status !== 'COMPLETED').length

  // ─── Task CRUD ───
  const openCreateTask = () => { setEditingTask(null); setTaskForm(emptyTask); setShowTaskModal(true) }
  const openEditTask = (t: Task) => {
    setEditingTask(t)
    setTaskForm({
      title: t.title, description: t.description || '', assignee: t.assignee || '',
      assigneeRole: t.assigneeRole || '', status: t.status, priority: t.priority,
      dueDate: t.dueDate ? t.dueDate.slice(0, 10) : '', notes: t.notes || '',
      platformId: '', programId: '',
    })
    setShowTaskModal(true)
  }

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTaskSubmitting(true)
    try {
      const method = editingTask ? 'PUT' : 'POST'
      const body = editingTask ? { id: editingTask.id, ...taskForm } : taskForm
      const res = await fetch('/api/admin/coordination/tasks', {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(editingTask ? 'تم تحديث المهمة' : 'تم إنشاء المهمة')
        setShowTaskModal(false); setExpandedTask(null)
        fetchData()
      } else { toast.error(data.message || 'خطأ') }
    } catch { toast.error('فشل الحفظ') }
    finally { setTaskSubmitting(false) }
  }

  const handleDeleteTask = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه المهمة؟')) return
    try {
      const res = await fetch(`/api/admin/coordination/tasks?id=${id}`, { method: 'DELETE' })
      if ((await res.json()).success) { toast.success('تم الحذف'); fetchData() }
    } catch { toast.error('فشل الحذف') }
  }

  const updateTaskStatus = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/admin/coordination/tasks', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      if ((await res.json()).success) { toast.success('تم تحديث الحالة'); fetchData() }
    } catch { toast.error('فشل التحديث') }
  }

  // ─── Standard CRUD ───
  const openCreateStd = () => { setEditingStd(null); setStdForm(emptyStandard); setShowStdModal(true) }
  const openEditStd = (s: DataStandard) => {
    setEditingStd(s)
    setStdForm({
      name: s.name, slug: s.slug, description: s.description || '',
      scope: s.scope, requiredFields: s.requiredFields,
      validationRules: s.validationRules || '',
    })
    setShowStdModal(true)
  }

  const handleStdSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStdSubmitting(true)
    try {
      const method = editingStd ? 'PUT' : 'POST'
      const body = editingStd ? { id: editingStd.id, ...stdForm } : stdForm
      const res = await fetch('/api/admin/coordination/standards', {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(editingStd ? 'تم تحديث المعيار' : 'تم إنشاء المعيار')
        setShowStdModal(false); fetchData()
      } else { toast.error(data.message || 'خطأ') }
    } catch { toast.error('فشل الحفظ') }
    finally { setStdSubmitting(false) }
  }

  const handleDeleteStd = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المعيار؟')) return
    try {
      const res = await fetch(`/api/admin/coordination/standards?id=${id}`, { method: 'DELETE' })
      if ((await res.json()).success) { toast.success('تم الحذف'); fetchData() }
    } catch { toast.error('فشل الحذف') }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
        <p className="mt-3 text-sm text-neutral-400">جاري تحميل التنسيق المؤسسي...</p>
      </div>
    </div>
  )

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* ─── Header ─── */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-6 gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900 mb-2 flex items-center gap-3">
            <CalendarCheck className="text-primary-600" size={28} />
            التنسيق المؤسسي
          </h1>
          <p className="text-neutral-500 max-w-2xl text-sm">
            إدارة مهام التنسيق ومعايير البيانات بين المنصات والبرامج.
          </p>
        </div>
      </div>

      {/* ─── Stats ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'مهام معلقة', value: pendingCount, icon: Clock, color: 'bg-neutral-100 text-neutral-500' },
          { label: 'قيد التنفيذ', value: inProgressCount, icon: AlertCircle, color: 'bg-primary-100 text-primary-600' },
          { label: 'مهام مكتملة', value: completedCount, icon: CheckCircle2, color: 'bg-success-50 text-success-500' },
          { label: 'مهام عاجلة', value: urgentCount, icon: AlertTriangle, color: 'bg-error-50 text-error-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card flex items-center gap-3 p-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}><Icon size={18} /></div>
            <div><div className="text-lg font-bold text-neutral-900">{value}</div><div className="text-xs text-neutral-500">{label}</div></div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* ─── Tasks Panel ─── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
              <ListChecks size={20} className="text-primary-600" />
              مهام التنسيق
            </h2>
            <button onClick={openCreateTask} className="btn-primary btn-xs flex items-center gap-1">
              <Plus size={14} /> مهمة
            </button>
          </div>

          <div className="space-y-3">
            {tasks.length === 0 ? (
              <div className="card text-center py-8 text-neutral-400">
                <ListChecks size={28} className="mx-auto mb-2 text-neutral-300" />
                <p className="text-sm">لا توجد مهام</p>
                <button onClick={openCreateTask} className="btn-primary btn-xs mt-3">إضافة مهمة</button>
              </div>
            ) : (
              tasks.map(task => {
                const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.PENDING
                const prioCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MEDIUM
                const StatusIcon = statusCfg.icon
                const isExpanded = expandedTask === task.id

                return (
                  <div key={task.id} className={`card transition-all ${isExpanded ? 'shadow-md ring-1 ring-primary-200' : ''}`}>
                    <div className="flex items-start gap-3">
                      {/* Quick status buttons */}
                      <div className="flex flex-col gap-0.5">
                        {['PENDING', 'IN_PROGRESS', 'COMPLETED'].map(st => {
                          const sc = STATUS_CONFIG[st]
                          return (
                            <button
                              key={st}
                              onClick={() => updateTaskStatus(task.id, st)}
                              className={`p-0.5 rounded transition-colors ${
                                task.status === st
                                  ? sc.color
                                  : 'text-neutral-300 hover:text-neutral-500'
                              }`}
                              title={sc.label}
                            >
                              {React.createElement(sc.icon, { size: 12 })}
                            </button>
                          )
                        })}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${prioCfg.color}`}>{prioCfg.label}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded inline-flex items-center gap-0.5 ${statusCfg.color}`}>
                            <StatusIcon size={10} /> {statusCfg.label}
                          </span>
                          {task.dueDate && (
                            <span className="text-[10px] text-neutral-400 flex items-center gap-0.5">
                              <Calendar size={10} /> {new Date(task.dueDate).toLocaleDateString('ar')}
                            </span>
                          )}
                        </div>
                        <h3
                          className="font-semibold text-neutral-900 text-sm cursor-pointer"
                          onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                        >
                          {task.title}
                        </h3>
                        {task.assignee && (
                          <p className="text-xs text-neutral-500 mt-0.5 flex items-center gap-1">
                            <User size={11} /> {task.assignee}
                            {task.assigneeRole && <span className="text-neutral-400">({task.assigneeRole})</span>}
                          </p>
                        )}

                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-neutral-200">
                            {task.description && <p className="text-xs text-neutral-600 mb-3">{task.description}</p>}
                            {(task.platform || task.program) && (
                              <div className="flex gap-2 mb-2 text-[10px] text-neutral-400">
                                {task.platform && <span>منصة: {task.platform.name}</span>}
                                {task.program && <span>برنامج: {task.program.name}</span>}
                              </div>
                            )}
                            {task.notes && (
                              <div className="p-2.5 bg-warning-50 rounded-lg text-xs text-neutral-700 mb-2">
                                <span className="font-semibold">ملاحظات:</span> {task.notes}
                              </div>
                            )}
                            <div className="flex items-center justify-between mt-2">
                              <div className="text-[10px] text-neutral-400">
                                أنشئت: {new Date(task.createdAt).toLocaleDateString('ar')}
                                {task.completedAt && <span className="mr-2">اكتملت: {new Date(task.completedAt).toLocaleDateString('ar')}</span>}
                              </div>
                              <div className="flex gap-1">
                                <button onClick={() => openEditTask(task)} className="p-1 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg" title="تعديل">
                                  <Pencil size={13} />
                                </button>
                                <button onClick={() => handleDeleteTask(task.id)} className="p-1 text-neutral-400 hover:text-error-600 hover:bg-error-50 rounded-lg" title="حذف">
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <ChevronDown
                        size={14}
                        className={`text-neutral-400 mt-1 shrink-0 transition-transform cursor-pointer ${isExpanded ? 'rotate-180' : ''}`}
                        onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* ─── Standards Panel ─── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
              <ShieldCheck size={20} className="text-secondary-600" />
              معايير البيانات
            </h2>
            <button onClick={openCreateStd} className="btn-primary btn-xs flex items-center gap-1">
              <Plus size={14} /> معيار
            </button>
          </div>

          <div className="space-y-3">
            {standards.length === 0 ? (
              <div className="card text-center py-8 text-neutral-400">
                <ShieldCheck size={28} className="mx-auto mb-2 text-neutral-300" />
                <p className="text-sm">لا توجد معايير</p>
                <button onClick={openCreateStd} className="btn-primary btn-xs mt-3">إضافة معيار</button>
              </div>
            ) : (
              standards.map(standard => (
                <div key={standard.id} className="card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <ShieldCheck size={16} className="text-secondary-500 shrink-0" />
                        <h3 className="font-semibold text-neutral-900 text-sm">{standard.name}</h3>
                      </div>
                      {standard.description && <p className="text-xs text-neutral-500 mt-1">{standard.description}</p>}
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
                      standard.isActive ? 'bg-success-50 text-success-600' : 'bg-neutral-100 text-neutral-400'
                    }`}>
                      {standard.isActive ? 'نشط' : 'غير نشط'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full">
                        {SCOPE_LABELS[standard.scope] || standard.scope}
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        {standard.requiredFields ? (standard.requiredFields.split(',').length) : 0} حقل
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openEditStd(standard)} className="p-1 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg" title="تعديل">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleDeleteStd(standard.id)} className="p-1 text-neutral-400 hover:text-error-600 hover:bg-error-50 rounded-lg" title="حذف">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ─── Task Modal ─── */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowTaskModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-neutral-200 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                <ListChecks size={20} className="text-primary-600" />
                {editingTask ? 'تعديل المهمة' : 'مهمة جديدة'}
              </h2>
              <button onClick={() => setShowTaskModal(false)} className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleTaskSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">العنوان <span className="text-error-500">*</span></label>
                <input required value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} className="input-field" placeholder="عنوان المهمة" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">الحالة</label>
                  <select value={taskForm.status} onChange={e => setTaskForm({ ...taskForm, status: e.target.value })} className="input-field">
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">الأولوية</label>
                  <select value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })} className="input-field">
                    {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">الوصف</label>
                <textarea rows={2} value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">المسؤول</label>
                  <input value={taskForm.assignee} onChange={e => setTaskForm({ ...taskForm, assignee: e.target.value })} className="input-field" placeholder="اسم المسؤول" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">دور المسؤول</label>
                  <input value={taskForm.assigneeRole} onChange={e => setTaskForm({ ...taskForm, assigneeRole: e.target.value })} className="input-field" placeholder="مدير, منسق, ..." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">تاريخ الاستحقاق</label>
                  <input type="date" value={taskForm.dueDate} onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })} className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">ملاحظات</label>
                <textarea rows={2} value={taskForm.notes} onChange={e => setTaskForm({ ...taskForm, notes: e.target.value })} className="input-field" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
                <button type="button" onClick={() => setShowTaskModal(false)} className="btn-ghost btn-sm">إلغاء</button>
                <button type="submit" disabled={taskSubmitting} className="btn-primary btn-sm">
                  {taskSubmitting ? 'جاري الحفظ...' : editingTask ? 'تحديث' : 'إنشاء'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Standard Modal ─── */}
      {showStdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowStdModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-neutral-200 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                <ShieldCheck size={20} className="text-secondary-600" />
                {editingStd ? 'تعديل المعيار' : 'معيار جديد'}
              </h2>
              <button onClick={() => setShowStdModal(false)} className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleStdSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">الاسم <span className="text-error-500">*</span></label>
                  <input required value={stdForm.name} onChange={e => setStdForm({ ...stdForm, name: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">الرابط <span className="text-error-500">*</span></label>
                  <input required dir="ltr" value={stdForm.slug} onChange={e => setStdForm({ ...stdForm, slug: e.target.value })} className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">الوصف</label>
                <textarea rows={2} value={stdForm.description} onChange={e => setStdForm({ ...stdForm, description: e.target.value })} className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">النطاق <span className="text-error-500">*</span></label>
                  <select required value={stdForm.scope} onChange={e => setStdForm({ ...stdForm, scope: e.target.value })} className="input-field">
                    {Object.entries(SCOPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">الحقول المطلوبة <span className="text-error-500">*</span></label>
                  <input required value={stdForm.requiredFields} onChange={e => setStdForm({ ...stdForm, requiredFields: e.target.value })} className="input-field" placeholder="field1,field2" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">قواعد التحقق (JSON)</label>
                <textarea rows={3} value={stdForm.validationRules} onChange={e => setStdForm({ ...stdForm, validationRules: e.target.value })} className="input-field" placeholder='{"field1": {"min": 1}}' />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
                <button type="button" onClick={() => setShowStdModal(false)} className="btn-ghost btn-sm">إلغاء</button>
                <button type="submit" disabled={stdSubmitting} className="btn-primary btn-sm">
                  {stdSubmitting ? 'جاري الحفظ...' : editingStd ? 'تحديث' : 'إنشاء'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
