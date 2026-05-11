'use client'

import { useEffect, useState } from 'react'
import { Link } from '@/i18n/routing'
import { ArrowLeft, Blocks, Activity, BookOpen } from 'lucide-react'
import FadeIn from '@/components/motion/FadeIn'

interface Platform {
  id: string
  name: string
  slug: string
  description: string
  logo: string | null
  coverImage: string | null
  color: string | null
  programs: { id: string; activities?: { id: string }[] }[]
}

function PlatformSkeleton() {
  return (
    <div className="card h-full animate-pulse overflow-hidden p-0">
      <div className="aspect-square bg-neutral-200" />
      <div className="p-6">
        <div className="mb-3 h-4 w-20 rounded bg-neutral-200" />
        <div className="mb-3 h-5 w-3/4 rounded bg-neutral-200" />
        <div className="space-y-2">
          <div className="h-3 rounded bg-neutral-200" />
          <div className="h-3 w-5/6 rounded bg-neutral-200" />
        </div>
      </div>
    </div>
  )
}

export default function FeaturedPlatforms() {
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
    <section className="section-padding relative overflow-hidden bg-gradient-to-b from-neutral-50 to-white">
      <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 translate-x-1/3 -translate-y-1/4 rounded-full bg-secondary-50/60 blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <FadeIn>
            <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-secondary-50 px-4 py-1.5 text-sm font-bold text-secondary-700">
              <span className="h-1.5 w-1.5 rounded-full bg-secondary-500" />
              منظومة العمل
            </span>
            <h2 className="section-title">منصاتنا</h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-neutral-600 sm:text-lg">
              منصات متخصصة تعمل تحت مظلة شبكة الرواد لتحويل الأفكار إلى برامج وأنشطة قابلة للتنفيذ والمتابعة.
            </p>
          </FadeIn>

          <FadeIn delay={0.12}>
            <Link href="/platforms" className="btn-outline btn-md no-underline group">
              استكشف المنصات
              <ArrowLeft size={18} className="rtl-flip transition-transform duration-200 group-hover:-translate-x-1" />
            </Link>
          </FadeIn>
        </div>

        {loading ? (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <PlatformSkeleton key={i} />
            ))}
          </div>
        ) : platforms.length === 0 ? (
          <div className="mt-12 rounded-xl border border-dashed border-neutral-300 bg-white py-16 text-center text-neutral-500">
            لا توجد منصات متاحة حالياً
          </div>
        ) : (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {platforms.map(({ name, slug, description, logo, coverImage, color, programs }, i) => {
              const brandColor = color || '#527F47'
              const image = coverImage || logo
              const activitiesCount = programs.reduce((sum, program) => sum + (program.activities?.length || 0), 0)
              return (
                <FadeIn key={slug} delay={i * 0.1}>
                  <Link
                    href={`/platforms/${slug}`}
                    className="group card-hover block h-full overflow-hidden rounded-xl border border-neutral-200/80 bg-white no-underline transition-all duration-300 hover:border-neutral-300 hover:shadow-xl"
                  >
                    {/* Color accent bar */}
                    <div className="relative h-2 w-full overflow-hidden" style={{ backgroundColor: brandColor }}>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    </div>

                    <div className="relative aspect-square overflow-hidden bg-neutral-50">
                      {image ? (
                        <img
                          src={image}
                          alt={name}
                          className="h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-[1.03]"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: `${brandColor}12` }}>
                          <div
                            className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-110"
                            style={{ backgroundColor: `${brandColor}15` }}
                          >
                            <Blocks className="h-12 w-12" style={{ color: brandColor }} />
                          </div>
                        </div>
                      )}
                      <div className="absolute right-4 top-4">
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold shadow-sm backdrop-blur-sm"
                          style={{ backgroundColor: `${brandColor}18`, color: brandColor }}
                        >
                          <BookOpen size={12} />
                          {programs.length} برامج
                        </span>
                      </div>
                    </div>

                    <div className="p-6">
                      <h3 className="mb-3 text-lg font-bold text-neutral-900 group-hover:text-primary-700 transition-colors duration-200">{name}</h3>
                      <p className="line-clamp-3 min-h-[4.2rem] text-sm leading-7 text-neutral-600">{description}</p>

                      <div className="mt-6 flex items-center justify-between border-t border-neutral-100 pt-4">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-neutral-400">
                          <Activity size={14} />
                          {activitiesCount} نشاط
                        </span>
                        <span className="inline-flex items-center gap-1 text-sm font-bold text-primary-700 transition-all duration-200 group-hover:gap-2">
                          عرض المنصة
                          <ArrowLeft size={14} className="rtl-flip" />
                        </span>
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
  )
}
