'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  CalendarDays, ClipboardList, Database, Eye, FileText,
  Filter, RefreshCw, Search, ShieldCheck, User, X,
} from 'lucide-react'
import { toast } from 'sonner'

interface ActivityLog {
  id: string
  entity: string
  entityId: string
  action: string
  actor: string | null
  changes: string | null
  metadata: string | null
  createdAt: string
}

const ENTITY_LABELS: Record<string, string> = {
  report: 'تقرير', report_template: 'قالب تقرير', platform_indicator: 'مؤشر منصة',
  program_indicator: 'مؤشر برنامج', analytics_snapshot: 'لقطة تحليلية',
  evaluation: 'تقييم', knowledge: 'مادة معرفية', coordination_task: 'مهمة تنسيق',
  data_standard: 'معيار بيانات', beneficiary: 'عضو', admin_user: 'مستخدم نظام',
  document: 'سجل أرشيف', impact_log: 'نشاط أثر', platform: 'منصة',
  project: 'مشروع', ai_governance: 'قرار حوكمة ذكي', notification: 'إشعار',
}

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'إنشاء', UPDATE: 'تحديث', DELETE: 'حذف', APPROVE: 'اعتماد',
  STATUS_DRAFT: 'تحويل لمسودة', STATUS_SUBMITTED: 'رفع', STATUS_REVIEWED: 'مراجعة',
  STATUS_APPROVED: 'اعتماد', STATUS_REJECTED: 'رفض', PUBLISH: 'نشر',
  COMPLETE: 'إكمال', ARCHIVE: 'أرشفة', SEND: 'إرسال', REJECT: 'رفض',
  ACTION_INTERNAL: 'قرار داخلي', ACTION_NOTIFY_MANAGER: 'إشعار مدير منصة',
  ACTION_NOTIFY_MEMBER: 'إشعار عضو', ACTION_CREATE_TASK: 'تحويل إلى مهمة',
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-emerald-50 text-emerald-700', UPDATE: 'bg-blue-50 text-blue-700',
  DELETE: 'bg-red-50 text-red-700', ARCHIVE: 'bg-neutral-100 text-neutral-700',
  STATUS_APPROVED: 'bg-emerald-50 text-emerald-700', STATUS_REJECTED: 'bg-red-50 text-red-700',
  STATUS_REVIEWED: 'bg-amber-50 text-amber-700', ACTION_CREATE_TASK: 'bg-violet-50 text-violet-700',
}

const labelFor = (map: Record<string, string>, value: string) => map[value] || value
const dateLabel = (value: string) => new Date(value).toLocaleString('ar-SA')

export default function AdminActivityLogPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [entity, setEntity] = useState('')
  const [action, setAction] = useState('')
  const [search, setSearch] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [summary, setSummary] = useState<{ actionCounts: Record<string, number>; entityCounts: Record<string, number> }>({ actionCounts: {}, entityCounts: {} })
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '25', page: String(page) })
      if (entity) params.set('entity', entity)
      if (action) params.set('action', action)
      if (search.trim()) params.set('search', search.trim())
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      const response = await fetch(`/api/admin/activity-log?${params}`)
      const result = await response.json()
      if (!result.success) throw new Error(result.message)
      setLogs(result.data || [])
      setTotal(result.pagination?.total || 0)
      setTotalPages(result.pagination?.totalPages || 1)
      setSummary(result.summary || { actionCounts: {}, entityCounts: {} })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'فشل تحميل سجل النشاط')
    } finally {
      setLoading(false)
    }
  }, [action, entity, from, page, search, to])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const entityOptions = useMemo(() => Object.keys(summary.entityCounts).sort(), [summary.entityCounts])
  const actionOptions = useMemo(() => Object.keys(summary.actionCounts).sort(), [summary.actionCounts])
  const actionTotal = (predicate: (key: string) => boolean) =>
    Object.entries(summary.actionCounts).reduce((sum, [key, count]) => sum + (predicate(key) ? count : 0), 0)
  const prettyPayload = (value: string | null) => {
    if (!value) return 'لا توجد بيانات إضافية'
    try { return JSON.stringify(JSON.parse(value), null, 2) } catch { return value }
  }
  const resetFilters = () => {
    setEntity(''); setAction(''); setSearch(''); setFrom(''); setTo(''); setPage(1)
  }

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
      <section className="mb-5 overflow-hidden rounded-3xl bg-gradient-to-l from-neutral-950 via-neutral-900 to-primary-900 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold">
              <ShieldCheck size={15} /> سجل التدقيق الإداري
            </div>
            <h1 className="text-2xl font-black md:text-3xl">من غيّر ماذا، ومتى؟</h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-neutral-300">
              سجل قابل للبحث للقرارات والتقارير والتقييمات والمستخدمين ومهام التنسيق، مع تفاصيل التغيير وسياقه.
            </p>
          </div>
          <Button unstyled onClick={fetchLogs} disabled={loading} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-black text-neutral-900">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> تحديث
          </Button>
        </div>
      </section>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'إجمالي العمليات', value: total, icon: Database, color: 'bg-primary-100 text-primary-700' },
          { label: 'عمليات إنشاء', value: actionTotal(key => key === 'CREATE'), icon: FileText, color: 'bg-emerald-100 text-emerald-700' },
          { label: 'تحديث وقرارات', value: actionTotal(key => key.includes('UPDATE') || key.includes('STATUS') || key.includes('ACTION')), icon: ClipboardList, color: 'bg-blue-100 text-blue-700' },
          { label: 'حذف وأرشفة', value: actionTotal(key => key === 'DELETE' || key === 'ARCHIVE'), icon: ShieldCheck, color: 'bg-red-100 text-red-700' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-4">
            <div className={`mb-3 flex size-9 items-center justify-center rounded-xl ${color}`}><Icon size={17} /></div>
            <div className="text-xl font-black text-neutral-900">{value}</div>
            <div className="mt-1 text-xs text-neutral-500">{label}</div>
          </div>
        ))}
      </div>

      <div className="card mb-5 p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_180px_180px_155px_155px_auto]">
          <div className="relative">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <Input aria-label="بحث في سجل النشاط" value={search} onChange={event => { setSearch(event.target.value); setPage(1) }} className="pr-9" placeholder="المستخدم، المعرف، العملية أو تفاصيل التغيير..." />
          </div>
          <NativeSelect aria-label="فلتر كيان سجل النشاط" value={entity} onChange={event => { setEntity(event.target.value); setPage(1) }}>
            <option value="">كل الكيانات</option>
            {entityOptions.map(item => <option key={item} value={item}>{labelFor(ENTITY_LABELS, item)}</option>)}
          </NativeSelect>
          <NativeSelect aria-label="فلتر عملية سجل النشاط" value={action} onChange={event => { setAction(event.target.value); setPage(1) }}>
            <option value="">كل العمليات</option>
            {actionOptions.map(item => <option key={item} value={item}>{labelFor(ACTION_LABELS, item)}</option>)}
          </NativeSelect>
          <div className="relative">
            <CalendarDays size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <Input aria-label="من تاريخ سجل النشاط" type="date" value={from} onChange={event => { setFrom(event.target.value); setPage(1) }} className="pr-9" />
          </div>
          <Input aria-label="إلى تاريخ سجل النشاط" type="date" value={to} onChange={event => { setTo(event.target.value); setPage(1) }} />
          <Button unstyled onClick={resetFilters} className="btn-ghost btn-sm">مسح</Button>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="py-12 text-center text-neutral-400"><RefreshCw size={28} className="mx-auto mb-3 animate-spin" /><p className="text-sm">جارٍ تحميل سجل التدقيق...</p></div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-neutral-400"><Filter size={30} className="mx-auto mb-3 text-neutral-300" /><p className="text-sm">لا توجد عمليات مطابقة</p></div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-neutral-50">
                  <TableHead className="text-right">العملية</TableHead>
                  <TableHead className="text-right">الكيان</TableHead>
                  <TableHead className="text-right">المنفذ</TableHead>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">المعرف</TableHead>
                  <TableHead className="text-center">التفاصيل</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell><span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold ${ACTION_COLORS[log.action] || 'bg-neutral-100 text-neutral-600'}`}>{labelFor(ACTION_LABELS, log.action)}</span></TableCell>
                    <TableCell><div className="text-xs font-bold text-neutral-900">{labelFor(ENTITY_LABELS, log.entity)}</div><div className="font-mono text-[10px] text-neutral-400">{log.entity}</div></TableCell>
                    <TableCell><span className="inline-flex items-center gap-1 text-xs text-neutral-600"><User size={12} />{log.actor || 'النظام'}</span></TableCell>
                    <TableCell className="text-xs text-neutral-500">{dateLabel(log.createdAt)}</TableCell>
                    <TableCell className="max-w-[190px] truncate font-mono text-[10px] text-neutral-400">{log.entityId}</TableCell>
                    <TableCell className="text-center"><Button unstyled onClick={() => setSelectedLog(log)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-primary-50 hover:text-primary-600" title="عرض تفاصيل التغيير"><Eye size={14} /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between rounded-2xl border border-neutral-200 bg-white p-3">
          <span className="text-xs text-neutral-500">صفحة {page} من {totalPages} · {total} عملية</span>
          <div className="flex gap-2">
            <Button unstyled disabled={page <= 1 || loading} onClick={() => setPage(current => current - 1)} className="btn-ghost btn-sm disabled:opacity-40">السابق</Button>
            <Button unstyled disabled={page >= totalPages || loading} onClick={() => setPage(current => current + 1)} className="btn-ghost btn-sm disabled:opacity-40">التالي</Button>
          </div>
        </div>
      )}

      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b bg-white p-5">
              <div><h2 className="font-black text-neutral-900">تفاصيل عملية {labelFor(ACTION_LABELS, selectedLog.action)}</h2><p className="mt-1 text-xs text-neutral-500">{labelFor(ENTITY_LABELS, selectedLog.entity)} · {dateLabel(selectedLog.createdAt)}</p></div>
              <Button unstyled onClick={() => setSelectedLog(null)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100"><X size={18} /></Button>
            </div>
            <div className="space-y-4 p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-neutral-50 p-3 text-xs"><span className="font-bold">المنفذ:</span> {selectedLog.actor || 'النظام'}</div>
                <div className="rounded-xl bg-neutral-50 p-3 text-xs"><span className="font-bold">المعرف:</span> <span className="font-mono">{selectedLog.entityId}</span></div>
              </div>
              <div><h3 className="mb-2 text-sm font-bold">التغييرات</h3><pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-xl bg-neutral-950 p-4 text-left text-xs leading-6 text-neutral-100" dir="ltr">{prettyPayload(selectedLog.changes)}</pre></div>
              <div><h3 className="mb-2 text-sm font-bold">بيانات السياق</h3><pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-xl bg-neutral-100 p-4 text-left text-xs leading-6 text-neutral-700" dir="ltr">{prettyPayload(selectedLog.metadata)}</pre></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
