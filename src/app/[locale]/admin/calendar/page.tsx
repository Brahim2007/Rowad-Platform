'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { NativeSelect } from '@/components/ui/native-select'
import {
  Activity, Calendar as CalendarIcon, CheckSquare, ChevronLeft, ChevronRight,
  ClipboardCheck, FolderKanban, ListChecks, RotateCcw,
} from 'lucide-react'
import { toast } from 'sonner'

const MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
const WEEKDAYS = ['أحد','إثنين','ثلاثاء','أربعاء','خميس','جمعة','سبت']

interface CalendarEvent {
  id: string
  title: string
  type: string
  date: string
  endDate: string | null
  status: string
  platformName: string | null
  subtitle: string
  link: string
  priority?: string
}

interface PlatformOption { id: string; name: string }

const EVENT_CONFIG: Record<string, { label: string; color: string; dot: string; icon: React.ElementType }> = {
  ACTIVITY: { label: 'نشاط مجدول', color: 'bg-blue-50 text-blue-700 border-blue-100', dot: 'bg-blue-500', icon: Activity },
  IMPACT: { label: 'مساهمة أثر', color: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: 'bg-emerald-500', icon: CheckSquare },
  TASK: { label: 'استحقاق مهمة', color: 'bg-amber-50 text-amber-700 border-amber-100', dot: 'bg-amber-500', icon: ListChecks },
  PROJECT: { label: 'مشروع', color: 'bg-violet-50 text-violet-700 border-violet-100', dot: 'bg-violet-500', icon: FolderKanban },
  EVALUATION: { label: 'تقييم', color: 'bg-rose-50 text-rose-700 border-rose-100', dot: 'bg-rose-500', icon: ClipboardCheck },
}

export default function CalendarPage() {
  const current = useMemo(() => new Date(), [])
  const [year, setYear] = useState(current.getFullYear())
  const [month, setMonth] = useState(current.getMonth() + 1)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [stats, setStats] = useState({ total: 0, activities: 0, deadlines: 0, evaluations: 0 })
  const [platforms, setPlatforms] = useState<PlatformOption[]>([])
  const [platformId, setPlatformId] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [selectedDay, setSelectedDay] = useState(current.getDate())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/platforms?compact=1')
      .then(response => response.json())
      .then(result => { if (result.success) setPlatforms(result.data?.platforms || []) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const params = new URLSearchParams({ year: String(year), month: String(month) })
    if (platformId) params.set('platformId', platformId)
    setLoading(true)
    fetch(`/api/admin/calendar?${params}`, { signal: controller.signal })
      .then(response => response.json())
      .then(result => {
        if (!result.success) throw new Error(result.message)
        setEvents(result.data?.events || [])
        setStats(result.data?.stats || { total: 0, activities: 0, deadlines: 0, evaluations: 0 })
      })
      .catch(error => {
        if (error instanceof Error && error.name !== 'AbortError') toast.error(error.message || 'فشل تحميل التقويم')
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [month, platformId, year])

  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay()
  const visibleEvents = typeFilter ? events.filter(event => event.type === typeFilter) : events
  const eventsByDay = new Map<number, CalendarEvent[]>()
  visibleEvents.forEach(event => {
    const date = new Date(event.date)
    if (date.getFullYear() !== year || date.getMonth() + 1 !== month) return
    const day = date.getDate()
    eventsByDay.set(day, [...(eventsByDay.get(day) || []), event])
  })
  const selectedEvents = eventsByDay.get(selectedDay) || []

  const moveMonth = (direction: number) => {
    const next = new Date(year, month - 1 + direction, 1)
    setYear(next.getFullYear())
    setMonth(next.getMonth() + 1)
    setSelectedDay(1)
  }

  const resetCurrentMonth = () => {
    setYear(current.getFullYear())
    setMonth(current.getMonth() + 1)
    setSelectedDay(current.getDate())
  }

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
      <section className="mb-5 overflow-hidden rounded-3xl bg-gradient-to-l from-primary-800 to-primary-600 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold">
              <CalendarIcon size={15} /> التقويم التشغيلي الموحد
            </div>
            <h1 className="text-2xl font-black md:text-3xl">مواعيد المنصات واستحقاقاتها في مكان واحد</h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-primary-50">
              يجمع الأنشطة والمشاريع ومساهمات الأثر ومواعيد التقييم والمهام المستحقة بدل عرض سجل نشاط واحد فقط.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-white/10 p-2">
            <Button unstyled onClick={() => moveMonth(-1)} className="rounded-xl p-2 hover:bg-white/10" aria-label="الشهر السابق"><ChevronRight size={19} /></Button>
            <span className="min-w-36 text-center font-black">{MONTHS[month - 1]} {year}</span>
            <Button unstyled onClick={() => moveMonth(1)} className="rounded-xl p-2 hover:bg-white/10" aria-label="الشهر التالي"><ChevronLeft size={19} /></Button>
          </div>
        </div>
      </section>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'كل أحداث الشهر', value: stats.total, icon: CalendarIcon, color: 'bg-primary-100 text-primary-700' },
          { label: 'أنشطة ومساهمات', value: stats.activities, icon: Activity, color: 'bg-emerald-100 text-emerald-700' },
          { label: 'مهام مستحقة', value: stats.deadlines, icon: ListChecks, color: 'bg-amber-100 text-amber-700' },
          { label: 'تقييمات', value: stats.evaluations, icon: ClipboardCheck, color: 'bg-rose-100 text-rose-700' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-4">
            <div className={`mb-3 flex size-9 items-center justify-center rounded-xl ${color}`}><Icon size={17} /></div>
            <div className="text-xl font-black text-neutral-900">{value}</div>
            <div className="mt-1 text-xs text-neutral-500">{label}</div>
          </div>
        ))}
      </div>

      <div className="card mb-5 flex flex-wrap items-center gap-3 p-4">
        <NativeSelect aria-label="فلتر منصة التقويم" value={platformId} onChange={event => setPlatformId(event.target.value)} className="max-w-[240px]">
          <option value="">كل المنصات</option>
          {platforms.map(platform => <option key={platform.id} value={platform.id}>{platform.name}</option>)}
        </NativeSelect>
        <NativeSelect aria-label="فلتر نوع حدث التقويم" value={typeFilter} onChange={event => setTypeFilter(event.target.value)} className="max-w-[200px]">
          <option value="">كل أنواع الأحداث</option>
          {Object.entries(EVENT_CONFIG).map(([type, config]) => <option key={type} value={type}>{config.label}</option>)}
        </NativeSelect>
        <Button unstyled onClick={resetCurrentMonth} className="btn-ghost btn-sm flex items-center gap-1.5"><RotateCcw size={14} /> الشهر الحالي</Button>
        {loading && <span className="text-xs text-primary-600">جارٍ تحديث التقويم...</span>}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <div className="card overflow-hidden p-0">
          <div className="grid grid-cols-7 border-b border-neutral-200 bg-neutral-50">
            {WEEKDAYS.map(day => <div key={day} className="border-l border-neutral-200 p-2 text-center text-xs font-bold text-neutral-500 last:border-l-0">{day}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDayOfWeek }).map((_, index) => <div key={`empty-${index}`} className="min-h-24 border-b border-l border-neutral-100 bg-neutral-50/50" />)}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1
              const dayEvents = eventsByDay.get(day) || []
              const isToday = year === current.getFullYear() && month === current.getMonth() + 1 && day === current.getDate()
              const isSelected = day === selectedDay
              return (
                <button key={day} type="button" onClick={() => setSelectedDay(day)} className={`min-h-24 border-b border-l border-neutral-100 p-1.5 text-right transition hover:bg-primary-50 ${isSelected ? 'bg-primary-50 ring-1 ring-inset ring-primary-300' : ''}`}>
                  <span className={`mb-1 inline-flex size-6 items-center justify-center rounded-full text-xs font-bold ${isToday ? 'bg-primary-600 text-white' : 'text-neutral-600'}`}>{day}</span>
                  <span className="block space-y-1">
                    {dayEvents.slice(0, 3).map(event => {
                      const config = EVENT_CONFIG[event.type] || EVENT_CONFIG.IMPACT
                      return <span key={event.id} className={`block truncate rounded-md px-1.5 py-1 text-[10px] ${config.color}`}>{event.title}</span>
                    })}
                    {dayEvents.length > 3 && <span className="block text-[10px] font-bold text-primary-600">+{dayEvents.length - 3} أحداث</span>}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <aside className="card h-fit">
          <div className="mb-4">
            <h2 className="font-black text-neutral-900">{selectedDay} {MONTHS[month - 1]}</h2>
            <p className="mt-1 text-xs text-neutral-500">{selectedEvents.length} حدث في اليوم المحدد</p>
          </div>
          {selectedEvents.length ? (
            <div className="space-y-2.5">
              {selectedEvents.map(event => {
                const config = EVENT_CONFIG[event.type] || EVENT_CONFIG.IMPACT
                const Icon = config.icon
                return (
                  <Link key={event.id} href={`/ar${event.link}`} className={`block rounded-2xl border p-3 transition hover:shadow-sm ${config.color}`}>
                    <div className="flex items-start gap-3">
                      <Icon size={17} className="mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-black">{event.title}</div>
                        <div className="mt-1 text-[11px] opacity-75">{event.subtitle}</div>
                        {event.platformName && <div className="mt-1 truncate text-[10px] opacity-60">{event.platformName}</div>}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="py-10 text-center text-neutral-400">
              <CalendarIcon size={30} className="mx-auto mb-3 text-neutral-300" />
              <p className="text-sm">لا توجد أحداث في هذا اليوم</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
