'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { useState, type FormEvent } from 'react'
import { useSession } from 'next-auth/react'
import { Bot, Send, Sparkles, RefreshCw } from 'lucide-react'

const QUICK_PROMPTS = [
  'ما المنصات التي لديها أنشطة متأخرة؟',
  'من أكثر 5 أعضاء نشاطاً هذا الشهر على مستوى الشبكة؟',
  'أي منصة الأقل تفاعلاً؟',
  'كم نسبة الأنشطة المعتمدة مقابل المعلقة هذا الشهر؟',
  'هل هناك أعضاء على وشك الخمول؟',
]

export default function AiAssistantPage() {
  const { data: session } = useSession()
  const userRole = (session?.user as any)?.role || ''
  const isSuperAdmin = userRole === 'SUPER_ADMIN'

  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<Array<{ q: string; a: string }>>([])

  const handleAsk = async (e?: FormEvent) => {
    e?.preventDefault()
    if (!question.trim() || loading) return

    setLoading(true)
    const q = question.trim()
    setQuestion('')
    try {
      const res = await fetch('/api/admin/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      })
      const data = await res.json()
      if (data.success) {
        const a = data.data.answer
        setAnswer(a)
        setHistory(prev => [{ q, a }, ...prev].slice(0, 20))
      } else {
        setAnswer('❌ ' + (data.message || 'فشل المعالجة'))
      }
    } catch {
      setAnswer('❌ فشل الاتصال بـ DeepSeek — تأكد من ضبط المفتاح')
    } finally {
      setLoading(false)
    }
  }

  if (!isSuperAdmin) {
    return (
      <div className="p-8 text-center text-neutral-400">
        <Bot size={48} className="mx-auto mb-4 text-neutral-300" />
        <p className="text-lg font-bold text-neutral-600">هذه الصفحة متاحة للإدارة العليا فقط</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto" dir="rtl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-600 to-teal-500 flex items-center justify-center">
          <Bot className="text-white" size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-neutral-900">مساعد رواد الذكي</h1>
          <p className="text-sm text-neutral-500">استعلامات بلغة طبيعية عن أداء الشبكة</p>
        </div>
      </div>

      {/* Quick prompts */}
      <div className="flex flex-wrap gap-2 mb-6">
        {QUICK_PROMPTS.map(p => (
          <Button unstyled
            key={p}
            onClick={() => setQuestion(p)}
            className="px-3 py-1.5 rounded-full text-xs bg-neutral-100 text-neutral-600 hover:bg-primary-50 hover:text-primary-700 transition-colors"
          >
            {p}
          </Button>
        ))}
      </div>

      {/* Current Answer */}
      {answer && (
        <div className="card p-5 mb-4 border-2 border-primary-200 bg-gradient-to-l from-primary-50/30 to-white">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={14} className="text-primary-500" />
            <span className="text-[10px] bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full">مساعد ذكي</span>
            <Button unstyled onClick={() => setAnswer('')} className="text-xs text-neutral-400 hover:text-red-500 ml-auto">إخفاء</Button>
          </div>
          <p className="text-neutral-800 text-sm leading-relaxed whitespace-pre-line">{answer}</p>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleAsk} className="flex gap-2 mb-6">
        <Input
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder="اسأل عن أداء الشبكة، المنصات، الأعضاء..."
          className="input-field flex-1"
          dir="rtl"
        />
        <Button unstyled type="submit" disabled={loading || !question.trim()} className="btn-primary flex items-center gap-1.5 px-4">
          {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={16} />}
        </Button>
      </form>

      {/* History */}
      {history.length > 0 && (
        <div className="card p-5">
          <h2 className="font-bold text-neutral-900 mb-3 flex items-center gap-2">
            <RefreshCw size={16} className="text-neutral-400" /> سجل الأسئلة
          </h2>
          <div className="space-y-3">
            {history.map((h, i) => (
              <div key={i} className="border rounded-lg p-3">
                <p className="text-sm font-semibold text-primary-700 mb-1">س: {h.q}</p>
                <p className="text-sm text-neutral-600 whitespace-pre-line">{h.a}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
