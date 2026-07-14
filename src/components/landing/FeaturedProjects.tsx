'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { Link } from '@/i18n/routing'
import { ArrowLeft, BookOpen, Handshake, Rocket, Sparkles } from 'lucide-react'
import FadeIn from '@/components/motion/FadeIn'

interface Project {
  id: string
  title: string
  slug: string
  description: string
  category: string
  status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'PLANNING'
  coverImage: string | null
  isFeatured: boolean
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'نشط',
  COMPLETED: 'مكتمل',
  ON_HOLD: 'متوقف',
  PLANNING: 'تخطيط',
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-success-500',
  COMPLETED: 'bg-primary-500',
  ON_HOLD: 'bg-error-500',
  PLANNING: 'bg-warning-500',
}

const STATUS_BG: Record<string, string> = {
  ACTIVE: 'bg-success-50 text-success-700 border-success-200',
  COMPLETED: 'bg-primary-50 text-primary-700 border-primary-200',
  ON_HOLD: 'bg-error-50 text-error-700 border-error-200',
  PLANNING: 'bg-warning-50 text-warning-700 border-warning-200',
}

const PROJECT_ICONS = [BookOpen, Rocket, Handshake, Sparkles]

function ProjectSkeleton() {
  return (
    <div className="card h-full animate-pulse overflow-hidden p-0">
      <div className="aspect-[4/3] bg-neutral-200" />
      <div className="p-6">
        <div className="mb-4 h-4 w-24 rounded bg-neutral-200" />
        <div className="mb-3 h-5 w-4/5 rounded bg-neutral-200" />
        <div className="space-y-2">
          <div className="h-3 rounded bg-neutral-200" />
          <div className="h-3 w-3/4 rounded bg-neutral-200" />
        </div>
      </div>
    </div>
  )
}

export default function FeaturedProjects() {
  const t = useTranslations('projects')
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/projects?featured=true&limit=6')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setProjects(data.data.projects)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="section-padding relative overflow-hidden bg-white">
      <div className="pointer-events-none absolute left-0 bottom-1/3 h-80 w-80 -translate-x-1/3 rounded-full bg-primary-50/60 blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <FadeIn>
            <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-1.5 text-sm font-bold text-primary-700">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
              أثر قابل للقياس
            </span>
            <h2 className="section-title">{t('title')}</h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-neutral-600 sm:text-lg">
              مشاريع ومبادرات نوعية تجمع بين المعرفة، التنفيذ، والشراكات لخدمة الشباب العربي.
            </p>
          </FadeIn>

          <FadeIn delay={0.12}>
            <Link href="/projects" className="btn-outline btn-md no-underline group">
              {t('viewAll')}
              <ArrowLeft size={18} className="rtl-flip transition-transform duration-200 group-hover:-translate-x-1" />
            </Link>
          </FadeIn>
        </div>

        {loading ? (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <ProjectSkeleton key={i} />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="mt-12 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 py-16 text-center text-neutral-500">
            لا توجد مشاريع مميزة حالياً
          </div>
        ) : (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map(({ id, title, slug, category, description, status, coverImage }, i) => {
              const Icon = PROJECT_ICONS[i % PROJECT_ICONS.length]
              const statusDot = STATUS_STYLES[status] || 'bg-neutral-400'
              return (
                <FadeIn key={id} delay={i * 0.08}>
                  <Link
                    href={`/projects/${slug}`}
                    className="group card-hover block h-full overflow-hidden rounded-xl border border-neutral-200/80 bg-white p-0 no-underline transition-all duration-300 hover:border-neutral-300 hover:shadow-xl"
                  >
                    {/* Image area */}
                    <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-primary-100 to-secondary-50">
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
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                        </>
                      ) : (
                        <div className="surface-pattern flex h-full items-center justify-center">
                          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/80 text-primary-700 shadow-lg shadow-primary-900/10 transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl">
                            <Icon size={36} />
                          </div>
                        </div>
                      )}

                      {/* Status badge */}
                      <div className="absolute right-4 top-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-bold shadow-sm backdrop-blur-sm ${STATUS_BG[status] || ''}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${statusDot}`} />
                          {STATUS_LABELS[status] || status}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary-700">
                        {category}
                      </div>
                      <h3 className="mb-3 text-lg font-bold leading-7 text-neutral-900 transition-colors duration-200 group-hover:text-primary-700">{title}</h3>
                      <p className="line-clamp-3 text-sm leading-7 text-neutral-600">{description}</p>
                      <div className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary-700 transition-all duration-200 group-hover:gap-3">
                        اقرأ المزيد
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
  )
}
