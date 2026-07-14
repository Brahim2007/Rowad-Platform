'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { ArrowLeft, Network } from 'lucide-react'
import FadeIn from '@/components/motion/FadeIn'

export default function CTASection() {
  const t = useTranslations('cta')

  return (
    <section className="section-padding relative overflow-hidden bg-primary-950">
      <div className="surface-pattern absolute inset-0 opacity-[0.06]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-primary-300/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <FadeIn>
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-lg bg-white/8 text-secondary-300 ring-1 ring-white/10 backdrop-blur-sm">
            <Network size={30} />
          </div>

          <h2 className="text-3xl md:text-5xl font-bold text-white leading-[1.15]">
            {t('title')}
          </h2>

          <p className="text-lg leading-8 text-white/70 mt-4 max-w-2xl mx-auto">
            {t('desc')}
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="group inline-flex items-center gap-2.5 rounded-lg bg-secondary-500 px-8 py-4 font-bold text-white no-underline shadow-lg shadow-secondary-900/20 transition-all duration-300 hover:bg-secondary-600 hover:shadow-xl"
            >
              {t('button')}
              <ArrowLeft size={20} className="rtl-flip transition-transform duration-200 group-hover:-translate-x-1" />
            </Link>
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-8 py-4 font-bold text-white no-underline shadow-lg shadow-black/5 transition-all duration-300 hover:border-white/50 hover:bg-white/5 hover:shadow-xl"
            >
              استعرض المشاريع
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
