'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { ArrowLeft, BookOpen, CheckCircle2, Network, Sparkles, Users, Zap } from 'lucide-react'
import FadeIn from '@/components/motion/FadeIn'
import { useEffect, useState } from 'react'

interface Stats {
  platforms: number
  projects: number
  partners: number
  beneficiaries: number
}

const heroSignals = [
  { icon: BookOpen, label: 'تعليم وتدريب عن بعد' },
  { icon: Users, label: 'شبكات مجتمعية فاعلة' },
  { icon: Zap, label: 'مشاريع رقمية مؤثرة' },
]

const lines = [
  [210, 160, 88, 76],
  [210, 160, 322, 78],
  [210, 160, 64, 184],
  [210, 160, 348, 184],
  [210, 160, 105, 284],
  [210, 160, 310, 278],
  [88, 76, 64, 184],
  [322, 78, 348, 184],
  [105, 284, 64, 184],
  [310, 278, 348, 184],
] as const

const nodes = [
  { x: 88, y: 76, label: 'تعليم', size: 23 },
  { x: 322, y: 78, label: 'تطوع', size: 23 },
  { x: 64, y: 184, label: 'إعلام', size: 21 },
  { x: 348, y: 184, label: 'تأثير', size: 21 },
  { x: 105, y: 284, label: 'بحث', size: 22 },
  { x: 310, y: 278, label: 'شراكة', size: 24 },
] as const

function NetworkIllustration() {
  return (
    <svg viewBox="0 0 420 340" className="h-auto w-full" role="img" aria-label="رسم شبكي يوضح مجالات شبكة الرواد">
      <defs>
        <linearGradient id="heroNode" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#527F47" />
          <stop offset="100%" stopColor="#20321E" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {lines.map(([x1, y1, x2, y2], i) => (
        <line
          key={`${x1}-${y1}-${x2}-${y2}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="#95B98C"
          strokeWidth="1.5"
          strokeDasharray="220"
          strokeDashoffset="220"
          style={{ animation: `drawLine 1.2s ease forwards ${i * 0.06}s` }}
        />
      ))}

      {nodes.map(({ x, y, label, size }, i) => (
        <g key={label} style={{ animation: `floatNode 3.2s ease-in-out ${i * 0.25}s infinite` }}>
          <circle cx={x} cy={y} r={size + 8} fill="#F2F7F1" stroke="#BFD5BA" strokeWidth="1" />
          <circle cx={x} cy={y} r={size} fill="#DEEADC" />
          <text
            x={x}
            y={y + 1}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#324E2C"
            fontSize="10"
            fontWeight="700"
          >
            {label}
          </text>
        </g>
      ))}

      <circle cx="210" cy="160" r="64" fill="#F2F7F1" stroke="#95B98C" strokeWidth="1.5" />
      <circle cx="210" cy="160" r="46" fill="url(#heroNode)" />
      <Network x="190" y="140" width="40" height="40" color="white" strokeWidth={1.8} />
    </svg>
  )
}

function FloatingOrb({ className, delay = 0 }: { className: string; delay?: number }) {
  return (
    <div
      className={`absolute rounded-full opacity-20 blur-3xl ${className}`}
      style={{
        animation: `floatOrb 8s ease-in-out ${delay}s infinite`,
      }}
    />
  )
}

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
    { value: stats?.platforms ?? 0, label: 'منصات نشطة' },
    { value: stats?.projects ?? 0, label: 'مشاريع نشطة' },
    { value: stats?.beneficiaries ?? 0, label: 'مستفيدون' },
    { value: stats?.partners ?? 0, label: 'شركاء' },
  ]

  return (
    <section className="relative min-h-screen overflow-hidden pt-20">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50/80 via-white to-secondary-50/60" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_#DEEADC_0%,_transparent_50%),radial-gradient(ellipse_at_bottom_right,_#F5EDE0_0%,_transparent_50%)]" />

      {/* Floating orbs */}
      <FloatingOrb className="-left-20 top-1/4 h-72 w-72 bg-primary-400" delay={0} />
      <FloatingOrb className="-right-20 top-1/3 h-96 w-96 bg-secondary-400" delay={2} />
      <FloatingOrb className="left-1/3 -bottom-20 h-64 w-64 bg-primary-300" delay={4} />

      <div className="surface-pattern absolute inset-0 opacity-40" />

      <div className="relative mx-auto grid min-h-[calc(100vh-80px)] w-full max-w-7xl grid-cols-1 items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
        <div>
          <FadeIn delay={0.05}>
            <div className="group mb-6 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white/80 px-4 py-2 text-sm font-semibold text-primary-700 shadow-soft backdrop-blur transition-all duration-300 hover:shadow-md hover:border-primary-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-500" />
              </span>
              منصة رقمية للشباب العربي
            </div>
          </FadeIn>

          <div className="max-w-2xl">
            <FadeIn delay={0.1}>
              <h1 className="text-4xl font-bold leading-[1.15] text-neutral-900 sm:text-5xl lg:text-6xl">
                شبكة{' '}
                <span className="bg-gradient-to-l from-primary-600 to-primary-800 bg-clip-text text-transparent">
                  الرواد
                </span>{' '}
                الإلكترونية
              </h1>
            </FadeIn>

            <FadeIn delay={0.2}>
              <p className="mt-5 text-xl font-semibold text-primary-700 md:text-2xl">
                {t('subtitle')}
              </p>
            </FadeIn>

            <FadeIn delay={0.3}>
              <p className="mt-5 max-w-xl text-base leading-8 text-neutral-600 sm:text-lg">
                {t('description')} نطوّر بيئة رقمية تجمع التعليم، التطوع، الإعلام، والشراكات في مسار واحد قابل للقياس والنمو.
              </p>
            </FadeIn>

            <FadeIn delay={0.4}>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/about" className="btn-primary btn-lg no-underline group">
                  {t('cta')}
                  <ArrowLeft size={20} className="rtl-flip transition-transform duration-200 group-hover:-translate-x-1" />
                </Link>
                <Link href="/projects" className="btn-outline btn-lg no-underline">
                  مشاريعنا
                </Link>
              </div>
            </FadeIn>

            <FadeIn delay={0.5}>
              <div className="mt-10 grid max-w-2xl grid-cols-2 divide-x divide-y divide-x-reverse divide-primary-100 border-y border-primary-100 bg-white/60 backdrop-blur-sm rounded-lg px-2 py-5 shadow-soft sm:grid-cols-4 sm:divide-y-0">
                {heroStats.map(({ value, label }) => (
                  <div key={label} className="px-3 text-center first:pr-0 last:pl-0">
                    <div className="text-2xl font-bold text-primary-700">
                      {statsLoading ? '--' : value.toLocaleString('ar-SA')}
                    </div>
                    <div className="mt-1 text-xs font-medium text-neutral-500 sm:text-sm">{label}</div>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </div>

        <FadeIn delay={0.25} direction="right">
          <div className="relative mx-auto w-full max-w-[560px]">
            {/* Decorative blobs */}
            <div className="absolute -left-4 -top-4 h-24 w-24 rounded-full bg-primary-100/60 blur-xl" />
            <div className="absolute -bottom-4 -right-4 h-32 w-32 rounded-full bg-secondary-100/60 blur-xl" />

            <div className="relative overflow-hidden rounded-2xl border border-primary-100/60 bg-white/70 shadow-2xl shadow-primary-900/10 backdrop-blur-xl transition-all duration-500 hover:shadow-primary-900/20">
              <div className="flex items-center justify-between gap-4 border-b border-primary-100/60 bg-white/50 px-5 py-4">
                <div>
                  <p className="text-xs font-semibold text-neutral-500">مركز الشبكة</p>
                  <p className="mt-1 text-base font-bold text-neutral-900">تنسيق، تمكين، وقياس أثر</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 text-white shadow-md">
                  <Network size={20} />
                </div>
              </div>
              <div className="px-3 py-4 sm:px-6">
                <NetworkIllustration />
              </div>
              <div className="grid gap-px bg-primary-100/60 sm:grid-cols-3">
                {heroSignals.map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2.5 bg-white/80 px-4 py-3.5 backdrop-blur-sm transition-colors hover:bg-white">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary-600" />
                    <Icon className="h-4 w-4 shrink-0 text-secondary-600" />
                    <span className="text-xs font-semibold text-neutral-600">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
