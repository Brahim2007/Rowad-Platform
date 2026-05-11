'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { ArrowLeft, Network, Sparkles } from 'lucide-react'
import FadeIn from '@/components/motion/FadeIn'

export default function CTASection() {
  const t = useTranslations('cta')

  return (
    <section className="section-padding relative overflow-hidden">
      {/* Premium gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_#527F47_0%,_transparent_50%),radial-gradient(ellipse_at_bottom_right,_#20321E_0%,_transparent_50%)]" />

      {/* Decorative patterns */}
      <div className="surface-pattern absolute inset-0 opacity-[0.06]" />
      <div className="pointer-events-none absolute -left-20 top-1/2 h-72 w-72 rounded-full bg-primary-600/20 blur-[120px]" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-56 w-56 rounded-full bg-secondary-500/10 blur-[100px]" />

      {/* Animated grid lines */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <FadeIn>
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-white/10 to-white/5 text-secondary-300 shadow-lg shadow-black/10 ring-1 ring-white/10 backdrop-blur-sm">
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
              className="group inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-secondary-500 to-secondary-600 px-8 py-4 font-bold text-white no-underline shadow-lg shadow-secondary-900/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:from-secondary-600 hover:to-secondary-700"
            >
              <Sparkles size={20} />
              {t('button')}
              <ArrowLeft size={20} className="rtl-flip transition-transform duration-200 group-hover:-translate-x-1" />
            </Link>
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-white/20 px-8 py-4 font-bold text-white no-underline shadow-lg shadow-black/5 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/50 hover:bg-white/5 hover:shadow-xl"
            >
              استعرض المشاريع
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
