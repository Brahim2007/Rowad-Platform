import { Link } from '@/i18n/routing'
import { ArrowLeft, Lock, Shield } from 'lucide-react'

export default function AdminLoginBanner() {
  return (
    <section className="relative border-t border-neutral-200 bg-gradient-to-r from-neutral-50 via-white to-neutral-50 py-10" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 rounded-2xl border border-primary-100/60 bg-white/80 px-6 py-6 shadow-soft backdrop-blur-sm md:flex-row md:px-8">
          <div className="flex items-center gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-100 to-primary-50 shadow-sm">
              <Shield className="h-7 w-7 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-800">هل أنت من فريق الإدارة؟</h3>
              <p className="mt-1 text-sm text-neutral-500">ادخل إلى لوحة التحكم لإدارة محتوى المنصة وبياناتها</p>
            </div>
          </div>
          <Link
            href="/admin/login"
            className="group inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-3.5 text-sm font-bold text-white no-underline shadow-md shadow-primary-900/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:from-primary-700 hover:to-primary-800"
          >
            <Lock size={16} />
            تسجيل الدخول للوحة التحكم
            <ArrowLeft size={16} className="rtl-flip transition-transform duration-200 group-hover:-translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  )
}
