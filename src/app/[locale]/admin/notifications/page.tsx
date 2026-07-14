'use client'

import { useEffect, useState, useCallback } from 'react'
import { Bell, CheckCheck, Megaphone, Clock } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface Notification {
  id: string; type: string; title: string; body: string
  link: string | null; isRead: boolean; createdAt: string; senderName: string | null
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Broadcast form
  const [showBroadcast, setShowBroadcast] = useState(false)
  const [broadcastForm, setBroadcastForm] = useState({
    subject: '', body: '', targetType: 'ALL', targetPlatformId: '', targetRole: '', channel: 'IN_APP',
  })
  const [sending, setSending] = useState(false)

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications?type=ADMIN&limit=100')
      if (res.ok) {
        const json = await res.json()
        if (json.success) {
          setNotifications(json.data)
          setUnreadCount(json.unreadCount)
        }
      }
    } catch { /* fallback */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ readAll: true }),
      })
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
      toast.success('تم تعليم الكل كمقروء')
    } catch { toast.error('فشل') }
  }

  const markRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
      setUnreadCount(c => Math.max(0, c - 1))
    } catch { /* fallback */ }
  }

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    try {
      const res = await fetch('/api/admin/broadcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(broadcastForm),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`تم الإرسال إلى ${data.data.recipientsCount} مستلم`)
        setShowBroadcast(false)
        setBroadcastForm({ subject: '', body: '', targetType: 'ALL', targetPlatformId: '', targetRole: '', channel: 'IN_APP' })
      } else {
        toast.error(data.message || 'فشل الإرسال')
      }
    } catch { toast.error('فشل الاتصال') }
    finally { setSending(false) }
  }

  const typeIcon = (type: string) => {
    switch (type) {
      case 'ACTIVITY_APPROVED': return '✅'
      case 'ACTIVITY_REJECTED': return '❌'
      case 'NEW_SUBMISSION': return '📥'
      case 'BROADCAST': return '📢'
      default: return '🔔'
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
          <Bell size={20} className="text-primary-600" /> مركز الإشعارات
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center w-6 h-6 bg-red-500 text-white text-xs rounded-full">{unreadCount}</span>
          )}
        </h1>
        <div className="flex items-center gap-2">
          <button onClick={markAllRead} className="btn-ghost btn-sm flex items-center gap-1.5">
            <CheckCheck size={14} /> تعليم الكل كمقروء
          </button>
          <button onClick={() => setShowBroadcast(!showBroadcast)} className="btn-primary btn-sm flex items-center gap-1.5">
            <Megaphone size={14} /> رسالة جماعية
          </button>
        </div>
      </div>

      {/* Broadcast form */}
      {showBroadcast && (
        <div className="card p-5 mb-6">
          <h2 className="font-bold text-neutral-900 mb-4">إرسال رسالة جماعية</h2>
          <form onSubmit={handleBroadcast} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">الجمهور المستهدف</label>
                <select value={broadcastForm.targetType} onChange={e => setBroadcastForm({ ...broadcastForm, targetType: e.target.value })} className="input-field">
                  <option value="ALL">الجميع</option>
                  <option value="PLATFORM">منصة معينة</option>
                  <option value="ROLE">صفة معينة</option>
                  <option value="INDIVIDUAL">فرد معين</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">القناة</label>
                <select value={broadcastForm.channel} onChange={e => setBroadcastForm({ ...broadcastForm, channel: e.target.value })} className="input-field">
                  <option value="IN_APP">داخل التطبيق فقط</option>
                  <option value="EMAIL">بريد إلكتروني فقط</option>
                  <option value="BOTH">كلاهما</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1">الموضوع</label>
              <input required value={broadcastForm.subject} onChange={e => setBroadcastForm({ ...broadcastForm, subject: e.target.value })} className="input-field" placeholder="موضوع الرسالة..." />
            </div>
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1">المحتوى</label>
              <textarea required rows={4} value={broadcastForm.body} onChange={e => setBroadcastForm({ ...broadcastForm, body: e.target.value })} className="input-field" placeholder="نص الرسالة..." />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowBroadcast(false)} className="btn-ghost btn-sm">إلغاء</button>
              <button type="submit" disabled={sending} className="btn-primary btn-sm">{sending ? 'جاري الإرسال...' : 'إرسال'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Notifications list */}
      <div className="card">
        {loading ? (
          <div className="text-center py-12"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" /></div>
        ) : notifications.length > 0 ? (
          <div className="space-y-1">
            {notifications.map(n => (
              <div
                key={n.id}
                className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${n.isRead ? 'hover:bg-neutral-50' : 'bg-blue-50/50 hover:bg-blue-100/50 border border-blue-100'}`}
                onClick={() => !n.isRead && markRead(n.id)}
              >
                <span className="text-lg mt-0.5">{typeIcon(n.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${n.isRead ? 'text-neutral-700' : 'text-neutral-900'}`}>{n.title}</span>
                    {!n.isRead && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5 whitespace-pre-line">{n.body}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-neutral-400">
                    <Clock size={10} />
                    <span>{new Date(n.createdAt).toLocaleString('ar')}</span>
                    {n.senderName && <span>· {n.senderName}</span>}
                  </div>
                </div>
                {n.link && (
                  <Link href={n.link} className="text-xs text-primary-600 hover:underline flex-shrink-0">عرض</Link>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center py-12 text-neutral-400">
            <Bell size={36} className="mx-auto mb-3 text-neutral-300" />
            لا توجد إشعارات
          </p>
        )}
      </div>
    </div>
  )
}
