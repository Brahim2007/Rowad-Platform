'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { ArrowLeft, BookOpen, CheckCircle2, Layers, Network, Users } from 'lucide-react'
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

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=2400&q=85'

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
    <section className="relative isolate min-h-[88svh] overflow-hidden bg-neutral-950 text-white">
      <Image
        src={HERO_IMAGE}
        alt="شباب يعملون معاً في بيئة تعليم رقمية"
        fill
        priority
        sizes="100vw"
        className="object-cover"
        unoptimized
      />
      <div className="absolute inset-0 bg-gradient-to-l from-neutral-950/92 via-neutral-950/72 to-neutral-950/30" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-neutral-950 to-transparent" />

      <div className="relative mx-auto flex min-h-[88svh] max-w-7xl flex-col justify-end px-4 pb-10 pt-32 sm:px-6 lg:px-8 lg:pb-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.55fr)] lg:items-end">
          <div className="max-w-3xl">
            <FadeIn delay={0.05}>
              <div className="mb-5 inline-flex items-center gap-2 border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-bold text-white backdrop-blur-md">
                <Network size={16} />
                منصة رقمية للشباب العربي
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <h1 className="max-w-3xl text-4xl font-bold leading-[1.12] text-white sm:text-5xl lg:text-7xl">
                شبكة الرواد الإلكترونية
              </h1>
            </FadeIn>

            <FadeIn delay={0.18}>
              <p className="mt-5 max-w-2xl text-lg font-semibold leading-8 text-secondary-200 md:text-2xl">
                {t('subtitle')}
              </p>
            </FadeIn>

            <FadeIn delay={0.26}>
              <p className="mt-5 max-w-2xl text-base leading-8 text-white/76 sm:text-lg">
                {t('description')} منصة موحدة تجمع التعليم، التطوع، الإعلام، والشراكات ضمن تجربة قابلة للقياس وإدارة الأثر.
              </p>
            </FadeIn>

            <FadeIn delay={0.34}>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild variant="secondary" size="lg" className="group">
                  <Link href="/platforms" className="no-underline">
                    استكشف المنصات
                    <ArrowLeft size={20} className="rtl-flip transition-transform duration-200 group-hover:-translate-x-1" />
                  </Link>
                </Button>
                <Button asChild variant="glass" size="lg">
                  <Link href="/projects" className="no-underline">المشاريع</Link>
                </Button>
              </div>
            </FadeIn>
          </div>

          <FadeIn delay={0.3} direction="right">
            <Card className="rounded-2xl border-white/15 bg-neutral-950/36 p-5 text-white shadow-2xl backdrop-blur-md">
              <div className="grid grid-cols-3 gap-2">
                {signals.map(({ icon: Icon, label }) => (
                  <div key={label} className="border border-white/10 bg-white/8 p-3 text-center">
                    <Icon className="mx-auto h-5 w-5 text-secondary-300" />
                    <p className="mt-2 text-xs font-bold text-white/80">{label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 space-y-3">
                {[
                  'بيانات موحدة للأعضاء والأنشطة',
                  'لوحات أثر ومؤشرات تشغيلية',
                  'مسارات تعلم ومشاركة قابلة للتوسع',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-white/78">
                    <CheckCircle2 size={16} className="text-primary-300" />
                    {item}
                  </div>
                ))}
              </div>
            </Card>
          </FadeIn>
        </div>

        <FadeIn delay={0.42}>
          <div className="mt-10 grid border-y border-white/12 bg-white/8 backdrop-blur-md sm:grid-cols-4">
            {heroStats.map(({ value, label }) => (
              <div key={label} className="border-b border-white/12 px-5 py-4 sm:border-b-0 sm:border-l sm:last:border-l-0">
                <div className="text-3xl font-bold text-white">
                  {statsLoading ? <Skeleton className="h-9 w-16 bg-white/15" /> : value.toLocaleString('ar-SA')}
                </div>
                <div className="mt-1 text-sm font-semibold text-white/58">{label}</div>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
