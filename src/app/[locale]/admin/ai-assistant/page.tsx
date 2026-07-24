'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useSession } from 'next-auth/react'
import { Activity, BarChart3, Bot, Check, Clipboard, Loader2, MessageSquareText, Send, Sparkles, Trash2, TrendingUp, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

const PROMPT_GROUPS = [
  { title: 'الأداء العام', icon: BarChart3, prompts: ['لخّص أداء الشبكة هذا الشهر بالأرقام.', 'قارن نسبة الأنشطة المعتمدة بالمعلقة.', 'ما أهم ثلاث ملاحظات إدارية الآن؟'] },
  { title: 'المنصات', icon: TrendingUp, prompts: ['رتّب المنصات حسب النشاط هذا الشهر.', 'أي منصة الأقل تفاعلاً وما المؤشرات المتاحة؟', 'ما المنصات التي لديها أنشطة معلقة؟'] },
  { title: 'الأعضاء', icon: Users, prompts: ['كم عدد الأعضاء النشطين وغير النشطين؟', 'من أكثر الأعضاء نشاطًا هذا الشهر؟', 'اقترح خطوات لرفع تفاعل الأعضاء.'] },
]

const WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: 'مرحبًا بك. أستطيع تحليل مؤشرات الشبكة والمنصات والأعضاء اعتمادًا على البيانات الحالية. اختر سؤالًا جاهزًا أو اكتب سؤالك بالتفصيل.',
  createdAt: new Date().toISOString(),
}

export default function AiAssistantPage() {
  const { data: session, status } = useSession()
  const userRole = (session?.user as { role?: string } | undefined)?.role || ''
  const isSuperAdmin = userRole === 'SUPER_ADMIN'
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME])
  const [loading, setLoading] = useState(false)
  const [copiedId, setCopiedId] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('rowad-ai-assistant-history')
      if (stored) setMessages(JSON.parse(stored))
    } catch { /* ignore invalid local history */ }
  }, [])

  useEffect(() => {
    if (messages.length > 1) sessionStorage.setItem('rowad-ai-assistant-history', JSON.stringify(messages.slice(-30)))
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const ask = async (rawQuestion: string) => {
    const text = rawQuestion.trim()
    if (!text || loading) return
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: text, createdAt: new Date().toISOString() }
    setMessages(current => [...current, userMessage])
    setQuestion('')
    setLoading(true)
    try {
      const response = await fetch('/api/admin/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.message || 'فشل معالجة السؤال')
      setMessages(current => [...current, { id: crypto.randomUUID(), role: 'assistant', content: result.data.answer, createdAt: new Date().toISOString() }])
    } catch (error) {
      const message = error instanceof Error ? error.message : 'تعذر الاتصال بـ Gemini'
      setMessages(current => [...current, { id: crypto.randomUUID(), role: 'assistant', content: `تعذر إكمال الطلب: ${message}`, createdAt: new Date().toISOString() }])
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    ask(question)
  }

  const copyMessage = async (message: ChatMessage) => {
    await navigator.clipboard.writeText(message.content)
    setCopiedId(message.id)
    window.setTimeout(() => setCopiedId(''), 1500)
    toast.success('تم نسخ الإجابة')
  }

  const clearHistory = () => {
    setMessages([WELCOME])
    sessionStorage.removeItem('rowad-ai-assistant-history')
  }

  if (status === 'loading') return <div className="py-24 text-center"><Loader2 className="animate-spin mx-auto text-primary-600" size={36} /></div>
  if (!isSuperAdmin) {
    return <div className="p-8 text-center"><Bot size={48} className="mx-auto mb-4 text-neutral-300" /><p className="text-lg font-bold text-neutral-700">هذه الصفحة متاحة للإدارة العليا فقط</p><p className="text-sm text-neutral-500 mt-2">حماية المساعد مطبقة في الواجهة والـAPI.</p></div>
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto" dir="rtl">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-primary-900 via-primary-700 to-secondary-700 text-white p-6 md:p-8 mb-6 shadow-xl">
        <div className="absolute -left-16 -top-20 w-72 h-72 rounded-full bg-white/10" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0"><Bot size={28} /></div>
            <div><Badge className="bg-white/15 text-white border-white/20 mb-3"><Sparkles size={13} /> Gemini</Badge><h1 className="text-2xl md:text-3xl font-black">مساعد رواد الذكي</h1><p className="text-primary-100 mt-2 leading-7 max-w-2xl">حوّل بيانات الأداء الحالية إلى إجابات إدارية واضحة، مع الالتزام بالأرقام المتاحة وعدم اتخاذ قرارات تلقائية.</p></div>
          </div>
          <div className="flex gap-2 text-xs"><span className="rounded-full bg-white/10 px-3 py-1.5 flex items-center gap-1.5"><Activity size={13} /> بيانات مباشرة</span><span className="rounded-full bg-white/10 px-3 py-1.5 flex items-center gap-1.5"><Check size={13} /> للإدارة العليا</span></div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[290px_minmax(0,1fr)] gap-5 items-start">
        <aside className="space-y-4 lg:sticky lg:top-5">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2"><MessageSquareText size={17} className="text-primary-600" /> أسئلة مقترحة</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {PROMPT_GROUPS.map(group => (
                <div key={group.title}>
                  <div className="text-xs font-bold text-neutral-500 flex items-center gap-1.5 mb-2"><group.icon size={13} />{group.title}</div>
                  <div className="space-y-1.5">{group.prompts.map(prompt => <Button unstyled key={prompt} onClick={() => ask(prompt)} disabled={loading} className="w-full text-right rounded-xl border border-neutral-200 bg-neutral-50 hover:border-primary-200 hover:bg-primary-50 p-2.5 text-xs leading-5 text-neutral-700 transition-colors">{prompt}</Button>)}</div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Button variant="outline" onClick={clearHistory} disabled={messages.length <= 1 || loading} className="w-full gap-2"><Trash2 size={15} /> مسح المحادثة</Button>
        </aside>

        <Card className="overflow-hidden min-h-[650px] flex flex-col">
          <div className="px-5 py-4 border-b bg-neutral-50 flex items-center justify-between"><div><h2 className="font-bold text-neutral-900">محادثة تحليلية</h2><p className="text-xs text-neutral-500 mt-1">الإجابات مبنية على آخر بيانات متاحة للنظام.</p></div><Badge variant="success"><span className="w-1.5 h-1.5 rounded-full bg-green-500" /> متصل</Badge></div>
          <div className="p-4 md:p-6 space-y-5 flex-1 max-h-[620px] overflow-y-auto bg-gradient-to-b from-white to-neutral-50/50">
            {messages.map(message => (
              <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                {message.role === 'user' && <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0"><Users size={14} /></div>}
                <div className={`group max-w-[88%] rounded-2xl px-4 py-3 shadow-sm ${message.role === 'user' ? 'bg-neutral-900 text-white rounded-tr-sm' : 'bg-white border border-primary-100 text-neutral-800 rounded-tl-sm'}`}>
                  {message.role === 'assistant' && <div className="flex items-center justify-between gap-4 mb-2"><span className="text-[10px] font-bold text-primary-600 flex items-center gap-1"><Sparkles size={11} /> مساعد رواد</span><Button unstyled onClick={() => copyMessage(message)} className="text-neutral-400 hover:text-primary-600" title="نسخ الإجابة">{copiedId === message.id ? <Check size={14} /> : <Clipboard size={14} />}</Button></div>}
                  <p className="text-sm leading-7 whitespace-pre-line">{message.content}</p>
                  <time className={`block text-[9px] mt-2 ${message.role === 'user' ? 'text-white/50' : 'text-neutral-400'}`}>{new Date(message.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</time>
                </div>
                {message.role === 'assistant' && <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center shrink-0"><Bot size={15} /></div>}
              </div>
            ))}
            {loading && <div className="flex justify-end gap-3"><div className="rounded-2xl rounded-tl-sm border border-primary-100 bg-white px-5 py-4 flex items-center gap-2 text-sm text-neutral-500"><Loader2 size={16} className="animate-spin text-primary-600" /> جاري تحليل البيانات وصياغة الإجابة...</div><div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center"><Bot size={15} /></div></div>}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSubmit} className="border-t bg-white p-4">
            <div className="relative">
              <Textarea value={question} onChange={event => setQuestion(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); ask(question) } }} placeholder="اكتب سؤالك عن أداء الشبكة أو المنصات أو الأعضاء..." rows={3} maxLength={1000} className="resize-none pe-14 pb-7" disabled={loading} />
              <Button type="submit" size="icon" disabled={loading || !question.trim()} className="absolute left-3 bottom-3 rounded-xl" aria-label="إرسال السؤال">{loading ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}</Button>
              <span className="absolute right-3 bottom-2 text-[9px] text-neutral-400">Enter للإرسال · Shift+Enter لسطر جديد</span>
            </div>
            <p className="text-[10px] text-neutral-400 mt-2 text-center">المساعد يقدم تحليلًا إرشاديًا؛ راجع الأرقام قبل اعتماد القرارات.</p>
          </form>
        </Card>
      </div>
    </div>
  )
}
