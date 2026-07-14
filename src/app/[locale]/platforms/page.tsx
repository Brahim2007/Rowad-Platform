'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Activity, ArrowLeft, Blocks, BookOpen } from 'lucide-react'
import { Link } from '@/i18n/routing'
import FadeIn from '@/components/motion/FadeIn'
import PageLayout from '@/components/shared/PageLayout'
import LoadingSpinner from '@/components/shared/LoadingSpinner'

interface Platform {
  id: string
  name: string
  slug: string
  description: string
  color: string | null
  logo: string | null
  coverImage: string | null
  programs: { id: string; activities?: { id: string }[] }[]
}

export default function PlatformsPage() {
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/platforms')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setPlatforms(data.data.platforms)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <PageLayout>
      <div className="min-h-screen">
        {/* ===== HEADER ===== */}
        <section className="relative overflow-hidden pt-28">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary-50/60 via-white to-primary-50/60" />
          <div className="pointer-events-none absolute -right-20 top-0 h-80 w-80 rounded-full bg-secondary-100/30 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-primary-100/30 blur-3xl" />
          <div className="surface-pattern absolute inset-0 opacity-30" />

          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center">
            <FadeIn>
              <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-secondary-50 px-4 py-1.5 text-sm font-bold text-secondary-700">
                <span className="h-1.5 w-1.5 rounded-full bg-secondary-500" />
                منظومة العمل
              </span>
              <h1 className="section-title">منصاتنا</h1>
              <p className="section-subtitle">
                منصات متخصصة تعمل تحت مظلة شبكة الرواد، كل منها يقدم برامج وأنشطة نوعية
              </p>
            </FadeIn>
          </div>
        </section>

        {/* ===== PLATFORMS GRID ===== */}
        <section className="section-padding relative overflow-hidden bg-white">
          <div className="pointer-events-none absolute left-0 top-1/3 h-72 w-72 -translate-x-1/3 rounded-full bg-primary-50/40 blur-3xl" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {loading ? (
              <div className="flex justify-center py-20">
                <LoadingSpinner size="lg" />
              </div>
            ) : platforms.length === 0 ? (
              <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 py-20 text-center text-neutral-400">
                لا توجد منصات متاحة حالياً
              </div>
            ) : (
              <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
                {platforms.map((platform, i) => {
                  const color = platform.color || '#527F47'
                  const image = platform.coverImage || platform.logo
                  const activitiesCount = platform.programs.reduce(
                    (sum, program) => sum + (program.activities?.length || 0),
                    0
                  )

                  return (
                    <FadeIn key={platform.slug} delay={i * 0.08}>
                      <Link
                        href={`/platforms/${platform.slug}`}
                        className="group card-hover block h-full overflow-hidden rounded-xl border border-neutral-200/80 bg-white p-0 no-underline shadow-sm transition-all duration-300 hover:shadow-xl hover:border-neutral-300"
                      >
                        {/* Image area */}
                        <div className="relative min-h-[240px] overflow-hidden bg-gradient-to-br from-primary-100 to-secondary-50 sm:min-h-[270px]">
                          {image ? (
                            <>
                              <Image
                                src={image}
                                alt={platform.name}
                                fill
                                sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
                                className="absolute inset-0 h-full w-full object-contain bg-neutral-50 p-4 transition-all duration-500 group-hover:scale-105"
                                unoptimized
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                            </>
                          ) : (
                            <div className="surface-pattern absolute inset-0 flex items-center justify-center">
                              <div
                                className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white/85 shadow-lg shadow-primary-900/10 transition-all duration-300 group-hover:scale-110"
                                style={{ color }}
                              >
                                <Blocks className="h-12 w-12" />
                              </div>
                            </div>
                          )}

                          {/* Gradient overlay */}
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/50 to-transparent p-6">
                            <div className="mb-3 flex flex-wrap gap-2">
                              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/90 px-3 py-1 text-xs font-bold text-neutral-900 backdrop-blur-sm">
                                <BookOpen size={13} />
                                {platform.programs.length} برامج
                              </span>
                              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/20 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
                                <Activity size={13} />
                                {activitiesCount} نشاط
                              </span>
                            </div>
                            <h3 className="text-xl font-bold leading-8 text-white">{platform.name}</h3>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                          <div className="mb-4 h-1.5 w-20 rounded-full" style={{ backgroundColor: color }} />
                          <p className="line-clamp-3 min-h-[5.25rem] text-sm leading-7 text-neutral-600">
                            {platform.description}
                          </p>
                          <div className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary-700 transition-all duration-200 group-hover:gap-3">
                            استكشف المنصة
                            <ArrowLeft size={16} className="rtl-flip" />
                          </div>
                        </div>
                      </Link>
                    </FadeIn>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </PageLayout>
  )
}
