'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  ClipboardList,
  Database,
  FileText,
  Filter,
  RefreshCw,
  Search,
  ShieldCheck,
  User,
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
  report: 'تقرير',
  report_template: 'قالب تقرير',
  platform_indicator: 'مؤشر منصة',
  program_indicator: 'مؤشر برنامج',
  analytics_snapshot: 'لقطة تحليلية',
  evaluation: 'تقييم',
  knowledge: 'مكتبة معرفية',
  coordination_task: 'مهمة تنسيق',
  beneficiary: 'عضو',
  admin_user: 'مستخدم نظام',
}

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'إنشاء',
  UPDATE: 'تحديث',
  DELETE: 'حذف',
  APPROVE: 'اعتماد',
  STATUS_DRAFT: 'تحويل لمسودة',
  STATUS_SUBMITTED: 'رفع',
  STATUS_REVIEWED: 'مراجعة',
  STATUS_APPROVED: 'اعتماد',
  STATUS_REJECTED: 'رفض',
  PUBLISH: 'نشر',
  COMPLETE: 'إكمال',
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-success-50 text-success-700',
  UPDATE: 'bg-info-50 text-info-700',
  DELETE: 'bg-error-50 text-error-700',
  STATUS_APPROVED: 'bg-success-50 text-success-700',
  STATUS_REJECTED: 'bg-error-50 text-error-700',
  STATUS_REVIEWED: 'bg-warning-50 text-warning-700',
}

function dateLabel(value: string) {
  return new Date(value).toLocaleString('ar-SA')
}

function labelFor(map: Record<string, string>, value: string) {
  return map[value] || value
}

export default function AdminActivityLogPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [entity, setEntity] = useState('')
  const [action, setAction] = useState('')
  const [search, setSearch] = useState('')

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (entity) params.set('entity', entity)
      if (action) params.set('action', action)
      params.set('limit', '100')
      const res = await fetch(`/api/admin/activity-log?${params}`)
      const data = await res.json()
      if (data.success) setLogs(data.data || [])
      else toast.error(data.message || 'فشل تحميل سجل النشاط')
    } catch {
      toast.error('فشل الاتصال بالخادم')
    } finally {
      setLoading(false)
    }
  }, [entity, action])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const entityOptions = useMemo(() => Array.from(new Set(logs.map(log => log.entity))).sort(), [logs])
  const actionOptions = useMemo(() => Array.from(new Set(logs.map(log => log.action))).sort(), [logs])

  const filteredLogs = useMemo(() => {
    const q = search.trim()
    if (!q) return logs
    return logs.filter(log =>
      log.entity.includes(q) ||
      log.entityId.includes(q) ||
      log.action.includes(q) ||
      log.actor?.includes(q) ||
      log.changes?.includes(q) ||
      log.metadata?.includes(q)
    )
  }, [logs, search])

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-6 gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900 mb-2 flex items-center gap-3">
            <Activity className="text-primary-600" size={28} />
            سجل النشاط
          </h1>
          <p className="text-neutral-500 max-w-2xl text-sm">
            أرشفة تشغيلية للتغييرات المهمة داخل النظام: التقارير، المؤشرات، اللقطات التحليلية، والتقييمات.
          </p>
        </div>
        <button onClick={fetchLogs} className="btn-primary btn-sm flex items-center gap-1.5" disabled={loading}>
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          تحديث
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'إجمالي العمليات', value: logs.length, icon: Database, color: 'bg-primary-100 text-primary-700' },
          { label: 'إنشاء', value: logs.filter(log => log.action === 'CREATE').length, icon: FileText, color: 'bg-success-50 text-success-700' },
          { label: 'تحديث', value: logs.filter(log => log.action.includes('UPDATE') || log.action.includes('STATUS')).length, icon: ClipboardList, color: 'bg-info-50 text-info-700' },
          { label: 'حذف', value: logs.filter(log => log.action === 'DELETE').length, icon: ShieldCheck, color: 'bg-error-50 text-error-700' },
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
        <div className="grid md:grid-cols-[1fr_180px_180px] gap-3">
          <div className="relative">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              className="input-field pr-9"
              placeholder="بحث في السجل..."
            />
          </div>
          <select value={entity} onChange={event => setEntity(event.target.value)} className="input-field">
            <option value="">كل الكيانات</option>
            {entityOptions.map(item => (
              <option key={item} value={item}>{labelFor(ENTITY_LABELS, item)}</option>
            ))}
          </select>
          <select value={action} onChange={event => setAction(event.target.value)} className="input-field">
            <option value="">كل العمليات</option>
            {actionOptions.map(item => (
              <option key={item} value={item}>{labelFor(ACTION_LABELS, item)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="py-12 text-center text-neutral-400">
            <RefreshCw size={28} className="animate-spin mx-auto mb-3" />
            <p className="text-sm">جاري تحميل السجل...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-neutral-400">
            <Filter size={30} className="mx-auto mb-3 text-neutral-300" />
            <p className="text-sm">لا توجد عمليات مطابقة</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200">
                  <th className="text-right py-3 px-4 text-xs font-bold text-neutral-500">العملية</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-neutral-500">الكيان</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-neutral-500">المستخدم</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-neutral-500">التاريخ</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-neutral-500">المعرف</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => (
                  <tr key={log.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${ACTION_COLORS[log.action] || 'bg-neutral-100 text-neutral-600'}`}>
                        {labelFor(ACTION_LABELS, log.action)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-neutral-900 text-xs">{labelFor(ENTITY_LABELS, log.entity)}</p>
                      <p className="text-[10px] text-neutral-400 font-mono">{log.entity}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-xs text-neutral-600">
                        <User size={12} />
                        {log.actor || 'النظام'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-neutral-500">{dateLabel(log.createdAt)}</td>
                    <td className="py-3 px-4 text-[10px] text-neutral-400 font-mono max-w-[180px] truncate">{log.entityId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
