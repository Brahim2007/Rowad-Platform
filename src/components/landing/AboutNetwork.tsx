'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import FadeIn from '@/components/motion/FadeIn'
import { Blocks, BookOpen, Eye, Flag, Lightbulb, Radio, Target, Users } from 'lucide-react'

interface Platform {
  id: string
  name: string
  slug: string
  description: string
  vision: string | null
  color: string | null
  programs: { id: string; activities?: { id: string }[] }[]
}

interface ContentPage {
  title: string
  content: string
  metaDesc: string | null
}

const platformIcons = [Eye, Flag, Lightbulb, Users, BookOpen, Radio, Target, Blocks]

function htmlToText(html: string) {
  if (typeof window === 'undefined') return html
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return doc.body.textContent?.replace(/\s+/g, ' ').trim() || ''
}

export default function AboutNetwork() {
  const t = useTranslations('about')
  const [content, setContent] = useState<ContentPage | null>(null)
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/content/about-us').then((response) => response.json()).catch(() => null),
      fetch('/api/platforms').then((response) => response.json()).catch(() => null),
    ])
      .then(([contentData, platformsData]) => {
        if (contentData?.success) setContent(contentData.data)
        if (platformsData?.success) setPlatforms(platformsData.data.platforms)
      })
      .finally(() => setLoading(false))
  }, [])

  const featuredPlatforms = platforms.slice(0, 5)
  const aboutText = content ? htmlToText(content.content) : ''

  return (
    <section className="section-padding relative overflow-hidden bg-white">
      <div className="pointer-events-none absolute left-0 top-0 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-50/50 blur-3xl" />
      <div className="pointer-events-none absolute right-0 bottom-0 h-80 w-80 translate-x-1/3 translate-y-1/3 rounded-full bg-secondary-50/50 blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <FadeIn>
            <span className="mb-3 inline-flex rounded-full bg-primary-50 px-4 py-1.5 text-sm font-bold text-primary-700">
              من نحن
            </span>
            <h2 className="section-title">{content?.title || t('title')}</h2>

            {loading ? (
              <div className="mt-5 space-y-3">
                <div className="h-4 w-full animate-pulse rounded bg-neutral-100" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-neutral-100" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-100" />
              </div>
            ) : aboutText ? (
              <p className="mt-5 max-w-xl text-base leading-8 text-neutral-600 sm:text-lg">
                {aboutText}
              </p>
            ) : null}

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {featuredPlatforms.slice(0, 2).map((platform, index) => {
                const Icon = platformIcons[index % platformIcons.length]
                const color = platform.color || '#527F47'

                return (
                  <FadeIn key={platform.id} delay={index * 0.1}>
                    <div className="group rounded-xl border border-primary-100 bg-gradient-to-br from-white to-primary-50/50 px-5 py-5 shadow-soft transition-all duration-300 hover:shadow-md hover:border-primary-200">
                      <div className="mb-3 flex items-center gap-2.5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg text-white shadow-sm transition-transform duration-300 group-hover:scale-110" style={{ backgroundColor: color }}>
                          <Icon size={20} />
                        </div>
                        <h3 className="text-base font-bold text-neutral-900">{platform.name}</h3>
                      </div>
                      <p className="line-clamp-3 text-sm leading-7 text-neutral-600">{platform.vision || platform.description}</p>
                    </div>
                  </FadeIn>
                )
              })}
            </div>
          </FadeIn>

          <div>
            <FadeIn delay={0.12}>
              <p className="mb-5 text-sm font-bold text-secondary-700">منصات من قاعدة البيانات</p>
            </FadeIn>
            {loading ? (
              <div className="grid gap-5 md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-44 animate-pulse rounded-xl border border-neutral-100 bg-neutral-100" />
                ))}
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {featuredPlatforms.slice(2, 5).map((platform, index) => {
                  const Icon = platformIcons[(index + 2) % platformIcons.length]
                  const color = platform.color || '#527F47'
                  const programsCount = platform.programs.length
                  const activitiesCount = platform.programs.reduce((sum, program) => sum + (program.activities?.length || 0), 0)

                  return (
                    <FadeIn key={platform.id} delay={index * 0.12}>
                      <div className="group card card-hover h-full border-primary-100/60 transition-all duration-300 hover:border-primary-200">
                        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:shadow-md" style={{ backgroundColor: `${color}18`, color }}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <h3 className="mb-3 text-xl font-bold text-neutral-900">{platform.name}</h3>
                        <p className="line-clamp-3 text-sm leading-7 text-neutral-600">{platform.vision || platform.description}</p>
                        <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-bold text-neutral-500">
                          <span className="rounded-full bg-primary-50 px-2.5 py-1">{programsCount} برامج</span>
                          <span className="rounded-full bg-secondary-50 px-2.5 py-1">{activitiesCount} أنشطة</span>
                        </div>
                      </div>
                    </FadeIn>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {!loading && featuredPlatforms.length > 0 && (
          <FadeIn delay={0.25}>
            <div className="mt-16 grid gap-4 rounded-2xl border border-primary-100 bg-gradient-to-r from-primary-50/60 via-white to-primary-50/60 px-6 py-6 sm:grid-cols-4">
              {featuredPlatforms.slice(0, 4).map((platform, index) => {
                const Icon = platformIcons[index % platformIcons.length]
                const color = platform.color || '#527F47'

                return (
                  <div key={platform.id} className="flex items-center justify-center gap-3 rounded-xl px-4 py-3 text-center transition-all duration-300 hover:bg-white/80">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}18`, color }}>
                      <Icon size={18} />
                    </div>
                    <span className="text-sm font-bold text-neutral-700">{platform.name}</span>
                  </div>
                )
              })}
            </div>
          </FadeIn>
        )}
      </div>
    </section>
  )
}
