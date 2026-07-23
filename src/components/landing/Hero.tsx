'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { ArrowLeft, BookOpen, CheckCircle2, Layers, Users, Sparkles, Zap, Globe } from 'lucide-react'
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
    <section className="relative isolate min-h-[90svh] overflow-hidden bg-neutral-950 text-white">
      {/* خلفية متدرجة ديناميكية - بدون صورة */}
      <div className="absolute inset-0">
        {/* طبقات التدرج الأساسية */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-950 via-neutral-950 to-primary-950" />

        {/* أنماط هندسية */}
        <div className="absolute inset-0 opacity-20">
          <svg className="h-full w-full" viewBox="0 0 1440 900" preserveAspectRatio="none">
            <defs>
              <pattern id="hero-grid" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              </pattern>
              <radialGradient id="glow-center" cx="50%" cy="40%" r="60%">
                <stop offset="0%" stopColor="hsl(var(--primary-500))" stopOpacity="0.15" />
                <stop offset="50%" stopColor="hsl(var(--secondary-500))" stopOpacity="0.05" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
              <radialGradient id="glow-right" cx="80%" cy="50%" r="50%">
                <stop offset="0%" stopColor="hsl(var(--secondary-500))" stopOpacity="0.1" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#glow-center)" />
            <rect width="100%" height="100%" fill="url(#glow-right)" />
            <rect width="100%" height="100%" fill="url(#hero-grid)" />
          </svg>
        </div>

        {/* كرات ضبابية متحركة */}
        <div className="absolute left-1/4 top-1/3 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-500/10 blur-3xl animate-pulse-glow" />
        <div className="absolute right-1/4 bottom-1/3 h-96 w-96 rounded-full bg-secondary-500/8 blur-3xl animate-pulse-glow" style={{ animationDelay: '2s' }} />
        <div className="absolute left-1/3 bottom-1/4 h-48 w-48 rounded-full bg-emerald-500/6 blur-3xl animate-pulse-glow" style={{ animationDelay: '4s' }} />

        {/* خط مموج زخرفي في الأسفل */}
        <div className="absolute bottom-0 left-0 right-0 h-40 opacity-[0.04]">
          <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="h-full w-full">
            <path d="M0,60 C240,120 480,0 720,60 C960,120 1200,0 1440,60 L1440,120 L0,120 Z" fill="white" />
          </svg>
        </div>
      </div>

      {/* طبقة تعتيم إضافية للتباين */}
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/60 via-transparent to-neutral-950/20" />

      <div className="relative mx-auto flex min-h-[90svh] max-w-7xl flex-col justify-end px-4 pb-14 pt-32 sm:px-6 lg:px-8 lg:pb-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.55fr)] lg:items-center">
          <div className="max-w-3xl">
            <FadeIn delay={0.05}>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-400/20 bg-primary-400/8 px-4 py-2 text-sm font-bold text-primary-300 shadow-sm backdrop-blur-md">
                <Sparkles size={16} className="text-secondary-400" />
                منصة رقمية متكاملة للشباب العربي
                <Zap size={14} className="text-secondary-400" />
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <h1 className="max-w-4xl text-4xl font-bold leading-[1.08] text-white sm:text-5xl lg:text-6xl xl:text-7xl">
                شبكة{' '}
                <span className="bg-gradient-to-l from-secondary-300 via-secondary-400 to-primary-300 bg-clip-text text-transparent">
                  الرواد
                </span>
                {' '}الإلكترونية
              </h1>
            </FadeIn>

            <FadeIn delay={0.18}>
              <p className="mt-6 max-w-2xl text-lg font-semibold leading-8 text-secondary-200 md:text-2xl">
                {t('subtitle')}
              </p>
            </FadeIn>

            <FadeIn delay={0.26}>
              <p className="mt-4 max-w-2xl text-base leading-8 text-white/70 sm:text-lg">
                {t('description')} منصة موحدة تجمع التعليم، التطوع، الإعلام، والشراكات ضمن تجربة قابلة للقياس وإدارة الأثر.
              </p>
            </FadeIn>

            <FadeIn delay={0.34}>
              <div className="mt-10 flex flex-wrap gap-4">
                <Button unstyled asChild size="lg" className="group relative overflow-hidden rounded-2xl bg-gradient-to-l from-secondary-500 to-secondary-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-secondary-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-secondary-500/30 hover:-translate-y-0.5">
                  <Link href="/platforms" className="no-underline">
                    <span className="relative z-10 flex items-center gap-2">
                      استكشف المنصات
                      <ArrowLeft size={20} className="rtl-flip transition-transform duration-200 group-hover:-translate-x-1" />
                    </span>
                  </Link>
                </Button>
                <Button unstyled asChild size="lg" className="rounded-2xl border border-white/20 bg-white/8 px-8 py-4 text-base font-bold text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/15 hover:border-white/30 hover:-translate-y-0.5">
                  <Link href="/projects" className="no-underline">المشاريع والمبادرات</Link>
                </Button>
              </div>
            </FadeIn>
          </div>

          <FadeIn delay={0.3} direction="right">
            <Card className="overflow-hidden rounded-3xl border border-white/10 bg-neutral-900/50 p-6 shadow-2xl backdrop-blur-xl">
              {/* شريط زخرفي علوي */}
              <div className="mb-6 flex items-center gap-2">
                <div className="flex h-2 w-2 rounded-full bg-secondary-400" />
                <div className="flex h-2 w-2 rounded-full bg-primary-400" />
                <div className="flex h-2 w-2 rounded-full bg-white/30" />
                <span className="mr-2 text-[10px] font-bold uppercase tracking-widest text-white/40">مميزات المنصة</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {signals.map(({ icon: Icon, label }) => (
                  <div key={label} className="group rounded-2xl border border-white/8 bg-white/5 p-4 text-center transition-all duration-300 hover:bg-white/10 hover:border-primary-400/30 hover:-translate-y-1">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500/20 to-secondary-500/20 group-hover:from-primary-500/30 group-hover:to-secondary-500/30 transition-all">
                      <Icon className="h-6 w-6 text-secondary-300" />
                    </div>
                    <p className="text-xs font-bold text-white/70 group-hover:text-white transition-colors">{label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 space-y-4">
                {[
                  { icon: CheckCircle2, text: 'بيانات موحدة للأعضاء والأنشطة', color: 'text-primary-300' },
                  { icon: CheckCircle2, text: 'لوحات أثر ومؤشرات تشغيلية', color: 'text-secondary-300' },
                  { icon: CheckCircle2, text: 'مسارات تعلم ومشاركة قابلة للتوسع', color: 'text-primary-300' },
                ].map(({ icon: Icon, text, color }) => (
                  <div key={text} className="flex items-center gap-3 text-sm text-white/80">
                    <Icon size={18} className={`shrink-0 ${color}`} />
                    {text}
                  </div>
                ))}
              </div>

              {/* خط زخرفي سفلي */}
              <div className="mt-6 flex items-center gap-3 text-xs text-white/30">
                <Globe size={14} className="text-secondary-400/60" />
                <span>انضم إلى أكثر من ١٠٠٠ مستفيد</span>
                <div className="mr-auto flex -space-x-2 rtl:space-x-reverse">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-6 w-6 rounded-full border-2 border-neutral-800 bg-gradient-to-br from-primary-400 to-secondary-400" />
                  ))}
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-neutral-800 bg-neutral-700 text-[9px] font-bold text-white">+</div>
                </div>
              </div>
            </Card>
          </FadeIn>
        </div>

        <FadeIn delay={0.42}>
          <div className="mt-14 grid divide-y divide-white/8 overflow-hidden rounded-2xl border border-white/8 bg-white/5 backdrop-blur-md sm:grid-cols-4 sm:divide-x sm:divide-y-0 rtl:divide-x-reverse">
            {heroStats.map(({ value, label }) => (
              <div key={label} className="px-6 py-5 text-center transition-colors hover:bg-white/5">
                <div className="text-3xl font-bold text-white">
                  {statsLoading ? <Skeleton className="mx-auto h-9 w-16 bg-white/10" /> : value.toLocaleString('ar-SA')}
                </div>
                <div className="mt-1.5 text-sm font-semibold text-white/50">{label}</div>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
