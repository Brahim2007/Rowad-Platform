import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { ArrowLeft, Clock3, Construction, Sparkles } from 'lucide-react'

interface ComingSoonPageProps {
  title: string
  description: string
  icon: LucideIcon
}

export function ComingSoonPage({ title, description, icon: Icon }: ComingSoonPageProps) {
  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-neutral-950 via-primary-900 to-primary-700 p-6 text-white shadow-lg md:p-8">
        <div className="absolute -start-20 -top-24 size-56 rounded-full bg-white/10" />
        <div className="absolute -bottom-24 end-1/4 size-48 rounded-full bg-secondary-400/10 blur-2xl" />
        <div className="relative">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold">
            <Sparkles size={15} />
            ضمن خارطة تطوير المنصة
          </div>
          <h1 className="flex items-center gap-3 text-2xl font-black md:text-3xl">
            <Icon size={28} className="text-secondary-300" />
            {title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-primary-50">{description}</p>
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-sm md:p-12">
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary-50 text-primary-700 ring-1 ring-primary-100">
          <Construction size={30} />
        </div>
        <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full bg-secondary-50 px-4 py-2 text-xs font-bold text-secondary-700">
          <Clock3 size={15} />
          قيد التخطيط
        </div>
        <h2 className="mt-5 text-2xl font-black text-neutral-900">سوف تُطوّر في مراحل قادمة</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-neutral-500">
          تم حجز هذه المساحة ضمن بنية لوحة الإدارة، وسيُضاف إليها المحتوى والأدوات التشغيلية في إحدى مراحل التطوير القادمة.
        </p>
        <Link
          href="/admin/impact"
          className="mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 text-sm font-bold text-white no-underline shadow-sm transition hover:bg-primary-700"
        >
          العودة إلى لوحة الإدارة
          <ArrowLeft size={16} />
        </Link>
      </section>
    </div>
  )
}
