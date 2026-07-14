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
    <section className="section-padding relative overflow-hidden bg-neutral-950">
      <div className="surface-pattern absolute inset-0 opacity-[0.06]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-secondary-400/50 to-transparent" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="mb-14 text-center">
            <span className="mb-4 inline-flex items-center gap-2 border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-bold text-secondary-300 backdrop-blur-sm">
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
                className="group relative overflow-hidden border border-white/10 bg-white/5 p-6 text-center backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/[0.08]"
              >
                <div className="relative mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-lg bg-white/8 text-secondary-300 ring-1 ring-white/10 transition-all duration-300 group-hover:ring-secondary-400/30">
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
