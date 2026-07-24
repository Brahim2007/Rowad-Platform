'use client'

import { useState } from 'react'
import { CircleHelp, Lightbulb, LoaderCircle, X } from 'lucide-react'
import type { FieldHelpKey, FieldHelpResponse } from '@/lib/ai/field-help'

type FieldHelpProps = {
  fieldKey: FieldHelpKey
  label: string
}

export function FieldHelp({ fieldKey, label }: FieldHelpProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [help, setHelp] = useState<FieldHelpResponse | null>(null)
  const [error, setError] = useState('')

  const toggleHelp = async () => {
    if (open) {
      setOpen(false)
      return
    }
    setOpen(true)
    if (help || loading) return

    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/ai/field-help', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fieldKey }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.message || 'تعذر تحميل المساعدة')
      setHelp(result.data)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'تعذر تحميل المساعدة')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={toggleHelp}
        className="inline-flex size-6 items-center justify-center rounded-full text-primary-600 transition hover:bg-primary-50 hover:text-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-300"
        aria-label={`دليل حقل ${label}`}
        aria-expanded={open}
        title={`دليل ${label}`}
      >
        <CircleHelp size={16} />
      </button>

      {open && (
        <div className="absolute start-0 top-8 z-40 w-[min(21rem,calc(100vw-3rem))] rounded-2xl border border-primary-100 bg-white p-4 text-start shadow-xl">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-bold text-neutral-900">
              <span className="inline-flex size-7 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
                <Lightbulb size={15} />
              </span>
              مساعدة: {label}
            </div>
            <button type="button" onClick={() => setOpen(false)} className="text-neutral-400 hover:text-neutral-700" aria-label="إغلاق المساعدة">
              <X size={16} />
            </button>
          </div>

          {loading && (
            <div className="flex items-center gap-2 py-3 text-sm text-neutral-500">
              <LoaderCircle size={16} className="animate-spin text-primary-600" />
              جاري تحميل دليل الحقل...
            </div>
          )}

          {error && <p className="rounded-lg bg-red-50 p-2 text-xs text-red-700">{error}</p>}

          {help && (
            <div className="space-y-3 text-xs leading-6 text-neutral-700">
              <p>{help.explanation}</p>
              <div className="rounded-xl bg-primary-50 p-3 text-primary-900">
                <span className="font-bold">مثال: </span>{help.example}
              </div>
              <ul className="space-y-1">
                {help.tips.map((tip, index) => <li key={index}>• {tip}</li>)}
              </ul>
              <p className="border-t border-neutral-100 pt-2 text-[10px] text-neutral-400">
                دليل جاهز وموحّد لجميع مستخدمي المنصة.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
