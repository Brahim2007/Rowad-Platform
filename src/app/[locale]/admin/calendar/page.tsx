'use client'

import { useEffect, useState } from 'react'
import { ChevronRight, ChevronLeft, Activity, Users, Calendar as CalIcon } from 'lucide-react'

const MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
const WEEKDAYS = ['أحد','إثنين','ثلاثاء','أربعاء','خميس','جمعة','سبت']

interface CalendarEvent {
  id: string; title: string; type: string; date: string; platformName: string | null
  beneficiaryName: string | null; status: string
}

export default function CalendarPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/impact/logs?page=1&pageSize=50&compact=1`).then(r => r.json()).then(json => {
      if (json.success) {
        const cal: CalendarEvent[] = (json.data || []).map((l: any) => ({
          id: l.id,
          title: l.action?.name || 'نشاط',
          type: l.action?.category || 'OTHER',
          date: l.date ? String(l.date).slice(0, 10) : '',
          platformName: l.platform?.name || null,
          beneficiaryName: l.beneficiary ? `${l.beneficiary.firstName} ${l.beneficiary.lastName}` : null,
          status: l.status,
        }))
        setEvents(cal)
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [year, month])

  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay() // 0=Sun
  const prevMonth = () => { if (month === 1) { setYear(y => y - 1); setMonth(12) } else setMonth(m => m - 1) }
  const nextMonth = () => { if (month === 12) { setYear(y => y + 1); setMonth(1) } else setMonth(m => m + 1) }

  const eventsByDate = new Map<string, CalendarEvent[]>()
  for (const e of events) {
    if (!e.date) continue
    const d = new Date(e.date)
    if (d.getFullYear() !== year || d.getMonth() + 1 !== month) continue
    const key = String(d.getDate())
    if (!eventsByDate.has(key)) eventsByDate.set(key, [])
    eventsByDate.get(key)!.push(e)
  }

  const totalEvents = Array.from(eventsByDate.values()).reduce((s, a) => s + a.length, 0)

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
          <CalIcon size={22} className="text-primary-600" /> تقويم الأنشطة
        </h1>
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-neutral-100"><ChevronRight size={18} /></button>
          <span className="text-lg font-bold text-neutral-800">{MONTHS[month - 1]} {year}</span>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-neutral-100"><ChevronLeft size={18} /></button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card p-3 text-center">
          <div className="text-lg font-bold text-primary-700">{totalEvents}</div>
          <div className="text-xs text-neutral-500">الأنشطة هذا الشهر</div>
        </div>
        <div className="card p-3 text-center">
          <div className="text-lg font-bold text-green-700">{eventsByDate.size}</div>
          <div className="text-xs text-neutral-500">أيام النشاط</div>
        </div>
        <div className="card p-3 text-center">
          <div className="text-lg font-bold text-amber-700">{events.filter(e => e.status === 'PENDING_REVIEW').length}</div>
          <div className="text-xs text-neutral-500">معلقة</div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="card overflow-hidden">
        {loading && <div className="text-center py-4"><div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" /></div>}

        <div className="grid grid-cols-7 border-b border-neutral-200">
          {WEEKDAYS.map(d => (
            <div key={d} className="p-2 text-center text-xs font-semibold text-neutral-500 bg-neutral-50 border-l border-neutral-200 last:border-l-0">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {/* Empty cells before first day */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[80px] p-1 border-l border-b border-neutral-100 bg-neutral-50/50" />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dayEvents = eventsByDate.get(String(day)) || []
            const hasPending = dayEvents.some(e => e.status === 'PENDING_REVIEW')
            const hasApproved = dayEvents.some(e => e.status === 'APPROVED')
            const hasRejected = dayEvents.some(e => e.status === 'REJECTED') && !hasApproved && !hasPending

            return (
              <div key={day} className={`min-h-[80px] p-1 border-l border-b border-neutral-100 ${dayEvents.length > 0 ? 'bg-primary-50/30' : ''}`}>
                <div className="text-xs font-semibold text-neutral-600 mb-0.5">{day}</div>
                {dayEvents.slice(0, 3).map(e => (
                  <div key={e.id}
                    className={`text-[10px] px-1 py-0.5 rounded mb-0.5 truncate ${
                      hasPending ? 'bg-amber-100 text-amber-700' :
                      hasApproved ? 'bg-green-100 text-green-700' :
                      'bg-neutral-100 text-neutral-600'
                    }`}
                    title={e.title + (e.beneficiaryName ? ` - ${e.beneficiaryName}` : '')}
                  >
                    {e.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-[10px] text-neutral-400">+{dayEvents.length - 3} أكثر</div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
