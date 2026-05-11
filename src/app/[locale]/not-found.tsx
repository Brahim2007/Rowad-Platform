import Link from 'next/link'
import { Home } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="text-6xl font-bold text-primary-600 mb-4">404</div>
        <h2 className="text-xl font-bold text-neutral-900 mb-2">الصفحة غير موجودة</h2>
        <p className="text-sm text-neutral-500 mb-6">عذراً، الصفحة التي تبحث عنها غير متوفرة</p>
        <Link href="/" className="btn-primary btn-sm inline-flex items-center gap-2 no-underline">
          <Home size={16} />
          العودة للرئيسية
        </Link>
      </div>
    </div>
  )
}
