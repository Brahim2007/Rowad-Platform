'use client'

import { AlertTriangle } from 'lucide-react'

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-error-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={32} className="text-error-500" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900 mb-2">حدث خطأ غير متوقع</h2>
        <p className="text-sm text-neutral-500 mb-6">يرجى المحاولة مرة أخرى</p>
        <button onClick={reset} className="btn-primary btn-sm">
          إعادة المحاولة
        </button>
      </div>
    </div>
  )
}
