import { Loader2 } from 'lucide-react'

export default function AdminLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <Loader2 size={32} className="animate-spin text-primary-600 mx-auto" />
        <p className="mt-4 text-sm text-neutral-500">جارٍ التحميل...</p>
      </div>
    </div>
  )
}
