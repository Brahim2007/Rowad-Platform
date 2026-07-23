'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { ArrowLeft, BookOpen, CheckCircle2, Layers, Users, Sparkles, Zap, Globe, TrendingUp, Award } from 'lucide-react'
import FadeIn from '@/components/motion/FadeIn'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface Stats {
  platforms: number
  projects: number
  partners: number
  beneficiaries: number
}

const signals = [
  { icon: BookOpen, label: 'تعليم رقمي' },
  { icon: Users, label: 'مجتمع شبابي' },
  { icon: Layers, label: 'منصات متخصصة' },
]

export default function Hero() {
  const t = useTranslations('hero')
  const [stats, setStats] = useState<Stats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stats')
      .then((response) => response.json())
      .then((data) => {
        if (data.success) setStats(data.data)
      })
      .catch(() => {})
      .finally(() => setStatsLoading(false))
  }, [])

  const heroStats = [
    { value: stats?.platforms ?? 0, label: 'منصات' },
    { value: stats?.projects ?? 0, label: 'مشاريع' },
    { value: stats?.beneficiaries ?? 0, label: 'مستفيدون' },
    { value: stats?.partners ?? 0, label: 'شركاء' },
  ]

  return (
    <section className="relative isolate min-h-[88svh] overflow-hidden bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/20 text-neutral-900">
      {/* خلفية متدرجة فاتحة مع أنماط */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-transparent to-primary-50/20" />
        <div className="absolute inset-0 opacity-[0.25]">
          <svg className="h-full w-full" viewBox="0 0 1440 900" preserveAspectRatio="none">
            <defs>
              <pattern id="hero-light-grid" x="0" y="0" width="64" height="64" patternUnits="userSpaceOnUse">
                <path d="M 64 0 L 0 0 0 64" fill="none" stroke="hsl(var(--primary-200))" strokeWidth="0.5" />
              </pattern>
              <radialGradient id="hero-light-glow" cx="40%" cy="50%" r="60%">
                <stop offset="0%" stopColor="hsl(var(--primary-200))" stopOpacity="0.25" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-light-glow)" />
            <rect width="100%" height="100%" fill="url(#hero-light-grid)" />
          </svg>
        </div>

        {/* كرات ضبابية فاتحة */}
        <div className="absolute -left-20 top-1/4 h-72 w-72 rounded-full bg-primary-200/20 blur-3xl" />
        <div className="absolute -right-20 bottom-1/4 h-64 w-64 rounded-full bg-secondary-200/20 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-48 w-48 rounded-full bg-primary-100/20 blur-3xl" />

        {/* أشكال موجية زخرفية في الأسفل */}
        <div className="absolute bottom-0 left-0 right-0 h-32 opacity-[0.06]">
          <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="h-full w-full">
            <path d="M0,40 C240,100 480,0 720,40 C960,100 1200,0 1440,40 L1440,120 L0,120 Z" fill="hsl(var(--primary-600))" />
          </svg>
        </div>
      </div>

      <div className="relative mx-auto flex min-h-[88svh] max-w-7xl flex-col justify-end px-4 pb-12 pt-32 sm:px-6 lg:px-8 lg:pb-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.5fr)] lg:items-center">
          {/* النص */}
          <div className="max-w-3xl">
            <FadeIn delay={0.05}>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white px-4 py-1.5 text-sm font-bold text-primary-700 shadow-sm backdrop-blur-md">
                <Sparkles size={15} className="text-secondary-600" />
                منصة رقمية متكاملة للشباب العربي
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <h1 className="max-w-4xl text-4xl font-bold leading-[1.12] sm:text-5xl lg:text-6xl xl:text-7xl text-neutral-900">
                شبكة{' '}
                <span className="bg-gradient-to-l from-primary-600 via-primary-700 to-secondary-600 bg-clip-text text-transparent">
                  الرواد
                </span>
                {' '}الإلكترونية
              </h1>
            </FadeIn>

            <FadeIn delay={0.18}>
              <p className="mt-5 max-w-2xl text-lg font-semibold leading-8 text-primary-800 md:text-2xl">
                {t('subtitle')}
              </p>
            </FadeIn>

            <FadeIn delay={0.26}>
              <p className="mt-4 max-w-2xl text-base leading-8 text-neutral-600 sm:text-lg">
                {t('description')} منصة موحدة تجمع التعليم، التطوع، الإعلام، والشراكات ضمن تجربة قابلة للقياس وإدارة الأثر.
              </p>
            </FadeIn>

            <FadeIn delay={0.34}>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button unstyled asChild className="group relative overflow-hidden rounded-2xl bg-gradient-to-l from-primary-600 to-primary-700 px-7 py-3.5 text-base font-bold text-white shadow-lg shadow-primary-600/20 transition-all duration-300 hover:shadow-xl hover:shadow-primary-600/30 hover:-translate-y-0.5">
                  <Link href="/platforms" className="no-underline">
                    <span className="relative z-10 flex items-center gap-2">
                      استكشف المنصات
                      <ArrowLeft size={20} className="rtl-flip transition-transform duration-200 group-hover:-translate-x-1" />
                    </span>
                  </Link>
                </Button>
                <Button unstyled asChild className="rounded-2xl border-2 border-primary-200 bg-white px-7 py-3.5 text-base font-bold text-primary-700 shadow-sm transition-all duration-300 hover:bg-primary-50 hover:border-primary-300 hover:-translate-y-0.5 hover:shadow-md">
                  <Link href="/projects" className="no-underline">المشاريع والمبادرات</Link>
                </Button>
              </div>
            </FadeIn>
          </div>

          {/* البطاقة الجانبية */}
          <FadeIn delay={0.3} direction="right">
            <Card className="overflow-hidden rounded-3xl border border-primary-100/60 bg-white p-6 shadow-xl shadow-primary-200/20">
              <div className="mb-5 flex items-center gap-2">
                <div className="flex h-2.5 w-2.5 rounded-full bg-primary-500" />
                <div className="flex h-2.5 w-2.5 rounded-full bg-secondary-400" />
                <div className="flex h-2.5 w-2.5 rounded-full bg-primary-300" />
                <span className="mr-auto text-[10px] font-bold uppercase tracking-widest text-neutral-400">مميزات المنصة</span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {signals.map(({ icon: Icon, label }) => (
                  <div key={label} className="group rounded-2xl border border-primary-100/50 bg-primary-50/30 p-3.5 text-center transition-all duration-300 hover:bg-primary-100/50 hover:border-primary-200 hover:-translate-y-0.5 hover:shadow-sm">
                    <div className="mx-auto mb-2.5 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 group-hover:from-primary-200 group-hover:to-primary-100 transition-all">
                      <Icon className="h-5 w-5 text-primary-600" />
                    </div>
                    <p className="text-xs font-bold text-neutral-700">{label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 space-y-3">
                {[
                  { icon: CheckCircle2, text: 'بيانات موحدة للأعضاء والأنشطة', color: 'text-primary-600' },
                  { icon: TrendingUp, text: 'لوحات أثر ومؤشرات تشغيلية', color: 'text-secondary-600' },
                  { icon: Award, text: 'مسارات تعلم ومشاركة قابلة للتوسع', color: 'text-primary-600' },
                ].map(({ icon: Icon, text, color }) => (
                  <div key={text} className="flex items-center gap-3 text-sm text-neutral-700">
                    <Icon size={18} className={`shrink-0 ${color}`} />
                    {text}
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center gap-3 rounded-2xl bg-primary-50/50 border border-primary-100/50 px-4 py-3 text-xs text-neutral-500">
                <Globe size={14} className="text-primary-500" />
                <span>انضم إلى أكثر من <strong className="text-primary-700">١٠٠٠</strong> مستفيد</span>
                <div className="mr-auto flex -space-x-1.5 rtl:space-x-reverse">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-6 w-6 rounded-full border-2 border-white bg-gradient-to-br from-primary-300 to-primary-500 shadow-sm" />
                  ))}
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-primary-100 text-[9px] font-bold text-primary-700 shadow-sm">+</div>
                </div>
              </div>
            </Card>
          </FadeIn>
        </div>

        {/* شريط الإحصائيات */}
        <FadeIn delay={0.42}>
          <div className="mt-12 grid divide-x-0 divide-y divide-primary-100 overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-sm sm:grid-cols-4 sm:divide-x sm:divide-y-0 rtl:divide-x-reverse">
            {heroStats.map(({ value, label }) => (
              <div key={label} className="px-6 py-5 text-center transition-colors hover:bg-primary-50/50">
                <div className="text-3xl font-bold text-primary-700">
                  {statsLoading ? <Skeleton className="mx-auto h-9 w-16 bg-primary-100" /> : value.toLocaleString('ar-SA')}
                </div>
                <div className="mt-1.5 text-sm font-semibold text-neutral-500">{label}</div>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
