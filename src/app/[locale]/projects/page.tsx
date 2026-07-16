'use client'

import { Button } from '@/components/ui/button'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { Link } from '@/i18n/routing'
import { ArrowLeft, BookOpen, Filter, Handshake, Rocket, Sparkles } from 'lucide-react'
import FadeIn from '@/components/motion/FadeIn'
import PageLayout from '@/components/shared/PageLayout'
import LoadingSpinner from '@/components/shared/LoadingSpinner'

interface Project {
  id: string
  title: string
  slug: string
  category: string
  description: string
  status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'PLANNING'
  coverImage: string | null
}

const STATUS_LABELS: Record<string, { label: string; cls: string; dot: string }> = {
  ACTIVE:    { label: 'نشط',     cls: 'bg-success-50 text-success-700 border-success-200', dot: 'bg-success-500' },
  COMPLETED: { label: 'مكتمل',   cls: 'bg-primary-50 text-primary-700 border-primary-200', dot: 'bg-primary-500' },
  ON_HOLD:   { label: 'متوقف',   cls: 'bg-error-50 text-error-700 border-error-200', dot: 'bg-error-500' },
  PLANNING:  { label: 'تخطيط',   cls: 'bg-warning-50 text-warning-700 border-warning-200', dot: 'bg-warning-500' },
}

const PROJECT_ICONS = [BookOpen, Rocket, Handshake, Sparkles]

const ALL = 'الكل'

export default function ProjectsPage() {
  const t = useTranslations('projects')
  const [projects, setProjects] = useState<Project[]>([])
  const [categories, setCategories] = useState<string[]>([ALL])
  const [activeCategory, setActiveCategory] = useState(ALL)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const url = activeCategory === ALL
      ? '/api/projects'
      : `/api/projects?category=${encodeURIComponent(activeCategory)}`

    setLoading(true)
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setProjects(data.data.projects)
          if (activeCategory === ALL) {
            const cats: string[] = Array.from(
              new Set((data.data.projects as Project[]).map((p) => p.category))
            )
            setCategories([ALL, ...cats])
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [activeCategory])

  return (
    <PageLayout>
      <div className="min-h-screen">
        {/* ===== HEADER ===== */}
        <section className="relative overflow-hidden pt-28">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50/70 via-white to-secondary-50/50" />
          <div className="pointer-events-none absolute -left-20 top-1/3 h-72 w-72 rounded-full bg-primary-100/30 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 bottom-0 h-56 w-56 rounded-full bg-secondary-100/30 blur-3xl" />
          <div className="surface-pattern absolute inset-0 opacity-30" />

          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center">
            <FadeIn>
              <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-1.5 text-sm font-bold text-primary-700">
                <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
                أثر قابل للقياس
              </span>
              <h1 className="section-title">{t('title')}</h1>
              <p className="section-subtitle">
                مشاريع ومبادرات نوعية تقدمها شبكة الرواد لخدمة الشباب العربي
              </p>
            </FadeIn>
          </div>
        </section>

        {/* ===== PROJECTS ===== */}
        <section className="section-padding relative overflow-hidden bg-white">
          <div className="pointer-events-none absolute right-0 top-0 h-80 w-80 translate-x-1/3 -translate-y-1/4 rounded-full bg-primary-50/30 blur-3xl" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Category Filters */}
            <FadeIn>
              <div className="mb-10 flex flex-wrap items-center justify-center gap-2">
                <Filter size={16} className="ml-2 text-neutral-400" />
                {categories.map((cat) => (
                  <Button unstyled
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                      cat === activeCategory
                        ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md shadow-primary-900/20'
                        : 'border border-neutral-200 bg-white text-neutral-600 hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700'
                    }`}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </FadeIn>

            {loading ? (
              <div className="flex justify-center py-20">
                <LoadingSpinner size="lg" />
              </div>
            ) : projects.length === 0 ? (
              <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 py-20 text-center text-neutral-400">
                لا توجد مشاريع في هذا التصنيف
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map(({ id, title, slug, category, description, status, coverImage }, i) => {
                  const { label, cls, dot } = STATUS_LABELS[status] ?? { label: status, cls: 'badge-primary', dot: 'bg-neutral-400' }
                  const Icon = PROJECT_ICONS[i % PROJECT_ICONS.length]
                  return (
                    <FadeIn key={id} delay={i * 0.08}>
                      <Link
                        href={`/projects/${slug}`}
                        className="group card-hover block h-full overflow-hidden rounded-xl border border-neutral-200/80 bg-white p-0 no-underline shadow-sm transition-all duration-300 hover:shadow-xl hover:border-neutral-300"
                      >
                        {/* Image area */}
                        <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-primary-100 to-secondary-50">
                          {coverImage ? (
                            <>
                              <Image
                                src={coverImage}
                                alt={title}
                                fill
                                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                                className="h-full w-full object-cover transition-all duration-500 group-hover:scale-105"
                                unoptimized
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                            </>
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/80 text-primary-700 shadow-lg transition-all duration-300 group-hover:scale-110">
                                <Icon size={30} />
                              </div>
                            </div>
                          )}
                          <div className="absolute right-4 top-4">
                            <span className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-bold shadow-sm backdrop-blur-sm ${cls}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                              {label}
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary-700">
                            {category}
                          </div>
                          <h3 className="font-bold text-neutral-900 mb-2 transition-colors duration-200 group-hover:text-primary-700">{title}</h3>
                          <p className="text-sm text-neutral-600 leading-relaxed line-clamp-2">{description}</p>
                          <div className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary-700 transition-all duration-200 group-hover:gap-3">
                            عرض التفاصيل
                            <ArrowLeft size={15} className="rtl-flip" />
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
