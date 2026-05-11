'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { FolderKanban, Handshake, Layers, Users } from 'lucide-react'
import Counter from '@/components/motion/Counter'
import FadeIn from '@/components/motion/FadeIn'

interface Stats {
  platforms: number
  projects: number
  partners: number
  beneficiaries: number
}

export default function StatsCounter() {
  const t = useTranslations('stats')
  const [stats, setStats] = useState<Stats>({ platforms: 0, projects: 0, partners: 0, beneficiaries: 0 })
  const [loading, setLoading] = useState(true)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setStats(data.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const statItems = [
    { key: 'platforms', value: stats.platforms, suffix: '', icon: Layers },
    { key: 'projects', value: stats.projects, suffix: '+', icon: FolderKanban },
    { key: 'beneficiaries', value: stats.beneficiaries, suffix: '+', icon: Users },
    { key: 'partners', value: stats.partners, suffix: '+', icon: Handshake },
  ]

  return (
    <section className="section-padding relative overflow-hidden">
      {/* Premium dark gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#3A5E33_0%,_transparent_60%),radial-gradient(ellipse_at_bottom,_#1A2E16_0%,_transparent_60%)]" />
      <div className="surface-pattern absolute inset-0 opacity-[0.08]" />

      {/* Decorative elements */}
      <div className="pointer-events-none absolute left-1/4 top-0 h-64 w-64 rounded-full bg-primary-600/20 blur-[100px]" />
      <div className="pointer-events-none absolute right-1/4 bottom-0 h-48 w-48 rounded-full bg-secondary-500/10 blur-[100px]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="mb-14 text-center">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-bold text-secondary-300 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-secondary-400" />
              أرقام من واقع المنصة
            </span>
            <h2 className="text-3xl font-bold text-white md:text-4xl lg:text-5xl">الأثر في لمحة واحدة</h2>
            <p className="mt-4 text-base leading-8 text-white/60">حجم ما أنجزناه وما زلنا نعمل عليه</p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {statItems.map(({ key, value, suffix, icon: Icon }, i) => (
            <FadeIn key={key} delay={i * 0.1}>
              <div
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-sm transition-all duration-500 hover:border-white/20 hover:bg-white/[0.08] hover:-translate-y-1"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Hover glow */}
                <div
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 transition-opacity duration-500 ${hoveredIndex === i ? 'opacity-100' : ''}`}
                />

                <div className="relative mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-white/10 to-white/5 text-secondary-300 shadow-lg shadow-black/10 ring-1 ring-white/10 transition-all duration-300 group-hover:scale-110 group-hover:ring-secondary-400/30 group-hover:shadow-secondary-500/10">
                  <Icon size={24} />
                </div>

                <div className="relative text-4xl font-bold text-secondary-300 md:text-5xl">
                  {loading ? (
                    <span className="animate-pulse">--</span>
                  ) : (
                    <Counter end={value} suffix={suffix} />
                  )}
                </div>

                <div className="relative mt-3 text-sm font-semibold text-white/60 transition-colors duration-300 group-hover:text-white/80">
                  {t(key)}
                </div>

                {/* Bottom shimmer */}
                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
