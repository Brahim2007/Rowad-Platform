'use client'

import { useEffect, useState } from 'react'
import type { MouseEvent } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { Activity, ArrowLeft, ChevronDown, Clock, User, BookText, ImageOff, PlayCircle } from 'lucide-react'
import { Link } from '@/i18n/routing'
import FadeIn from '@/components/motion/FadeIn'
import PageLayout from '@/components/shared/PageLayout'
import LoadingSpinner from '@/components/shared/LoadingSpinner'

interface ActivityItem {
  id: string
  name: string
  slug: string
  description: string
  icon: string | null
}

interface Program {
  id: string
  name: string
  slug: string
  description: string
  image: string | null
  activities: ActivityItem[]
}

interface Platform {
  id: string
  name: string
  description: string
  vision: string | null
  logo: string | null
  coverImage: string | null
  color: string | null
  programs: Program[]
}

function parseCourseInfo(desc: string) {
  const instructor = desc.match(/المحاضر:\s*([^|]+)/)?.[1]?.trim()
  const duration = desc.match(/المدة:\s*([^|]+)/)?.[1]?.trim()
  const lessons = desc.match(/عدد الدروس:\s*(\d+)/)?.[1]
  return { instructor, duration, lessons: lessons ? parseInt(lessons) : null }
}

function CourseCard({ activity, platformSlug }: { activity: ActivityItem; platformSlug: string }) {
  const [expanded, setExpanded] = useState(false)
  const info = parseCourseInfo(activity.description)
  const hasImage = activity.icon && activity.icon.startsWith('http')

  return (
    <div
      className="group overflow-hidden rounded-lg border border-neutral-200 bg-white transition-all hover:-translate-y-1 hover:border-primary-200 hover:shadow-card-hover"
      onClick={() => setExpanded(!expanded)}
    >
      {/* Course Image */}
      {hasImage ? (
        <div className="relative aspect-square overflow-hidden border-b border-neutral-100 bg-neutral-50">
          <Image
            src={activity.icon!}
            alt={activity.name}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
            unoptimized
          />
        </div>
      ) : (
        <div className="aspect-square bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
          <ImageOff className="w-8 h-8 text-primary-300" />
        </div>
      )}

      {/* Course Info */}
      <div className="p-4">
        <h4 className="mb-3 text-base font-bold leading-7 text-neutral-900 line-clamp-2">
          {activity.name}
        </h4>

        {info.instructor && (
          <div className="flex items-center gap-1.5 text-xs text-neutral-500 mb-1">
            <User size={12} className="shrink-0" />
            <span className="truncate">{info.instructor}</span>
          </div>
        )}

        <div className="flex items-center gap-3 mt-2 flex-wrap">
          {info.duration && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md text-xs font-medium">
              <Clock size={11} />
              {info.duration}
            </span>
          )}
          {info.lessons && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">
              <BookText size={11} />
              {info.lessons} دروس
            </span>
          )}
        </div>

        {/* Expanded Description */}
        {expanded && (
          <div className="mt-3 pt-3 border-t border-neutral-100">
            <p className="text-xs text-neutral-600 leading-relaxed">
              {activity.description}
            </p>
          </div>
        )}

        <Link
          href={`/platforms/${platformSlug}/courses/${activity.slug}`}
          className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary-700 no-underline hover:text-primary-900"
          onClick={(event: MouseEvent<HTMLAnchorElement>) => event.stopPropagation()}
        >
          عرض محتوى الدورة
          <ArrowLeft size={15} className="rtl-flip" />
        </Link>
      </div>
    </div>
  )
}

function DiplomaCard({ program, platformSlug }: { program: Program; platformSlug: string }) {
  const [expanded, setExpanded] = useState(false)
  const hasImage = program.image && program.image.startsWith('http')

  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm transition-all hover:border-neutral-300 hover:shadow-card-hover">
      {/* Program Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-right"
      >
        <div className="grid gap-5 p-4 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center sm:p-5 lg:grid-cols-[220px_minmax(0,1fr)]">
          {/* Diploma Image Thumbnail */}
          {hasImage ? (
            <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-neutral-100 bg-neutral-50 shadow-soft sm:max-w-[220px]">
              <Image
                src={program.image!}
                alt={program.name}
                fill
                sizes="220px"
                className="h-full w-full object-contain"
                unoptimized
              />
            </div>
          ) : (
            <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 shadow-soft sm:max-w-[220px]">
              <BookText className="h-14 w-14 text-primary-500" />
            </div>
          )}

          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary-700">
                <BookText size={14} />
                دبلوم تدريبي
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold text-neutral-600">
                <Activity size={14} />
                {program.activities.length} {program.activities.length === 1 ? 'دورة' : 'دورات'}
              </span>
            </div>
            <h3 className="text-2xl font-bold leading-9 text-neutral-900">{program.name}</h3>
            {program.description && (
              <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-600">{program.description}</p>
            )}
            <div className="mt-5 inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-bold text-white">
              <span>{expanded ? 'إخفاء المحتويات' : 'عرض محتويات الدبلوم'}</span>
              <ChevronDown
                size={18}
                className={`shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
              />
            </div>
            {program.activities[0] && (
              <span className="mt-3 flex items-center gap-2 text-xs font-bold text-neutral-500">
                <PlayCircle size={14} />
                يبدأ بـ {program.activities[0].name}
              </span>
            )}
          </div>
        </div>
      </button>

      {/* Expanded: Course Cards Grid */}
      {expanded && (
        <div className="border-t border-neutral-100 bg-neutral-50/70 p-4 sm:p-5">
          {program.activities.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-6">لا توجد دورات مسجلة حالياً</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {program.activities.map((activity) => (
                <CourseCard key={activity.id} activity={activity} platformSlug={platformSlug} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function PlatformDetailPage() {
  const params = useParams()
  const slug = params.slug as string

  const [platform, setPlatform] = useState<Platform | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`/api/platforms/${slug}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null }
        return r.json()
      })
      .then((data) => {
        if (data?.success) setPlatform(data.data.platform)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <PageLayout>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </PageLayout>
    )
  }

  if (notFound || !platform) {
    return (
      <PageLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">المنصة غير موجودة</h1>
            <Link href="/platforms" className="text-primary-600 no-underline">
              العودة إلى المنصات
            </Link>
          </div>
        </div>
      </PageLayout>
    )
  }

  const brandColor = platform.color || '#527F47'
  const heroImage = platform.coverImage || platform.logo || platform.programs.find((program) => program.image)?.image || null
  const coursesCount = platform.programs.reduce((sum, program) => sum + program.activities.length, 0)

  return (
    <PageLayout>
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-neutral-950 pt-28 text-white">
          {heroImage ? (
            <Image
              src={heroImage}
              alt={platform.name}
              fill
              sizes="100vw"
              className="absolute inset-0 h-full w-full object-cover opacity-95 brightness-110 saturate-150"
              unoptimized
            />
          ) : (
            <div className="surface-pattern absolute inset-0 bg-gradient-soft" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/65 to-neutral-950/15" />
          <div className="absolute inset-y-0 start-0 w-2/3 bg-gradient-to-l from-neutral-950/90 to-transparent" />

          <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pb-20">
            <FadeIn>
              <Link href="/platforms" className="mb-8 inline-flex items-center gap-1 text-sm font-bold text-white/80 no-underline hover:text-white">
                <ArrowLeft size={16} className="rtl-flip" />
                العودة إلى المنصات
              </Link>

              <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(460px,1.1fr)] lg:items-end">
                <div className="max-w-2xl">
                  <div className="mb-5 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-xs font-bold text-neutral-950">
                      <BookText size={15} />
                      {platform.programs.length} برامج
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-bold text-white backdrop-blur-sm">
                      <Activity size={15} />
                      {coursesCount} دورة
                    </span>
                  </div>
                  <h1 className="text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl">{platform.name}</h1>
                  <p className="mt-5 max-w-xl text-base leading-8 text-white/85 sm:text-lg">
                    {platform.description}
                  </p>

                  {platform.vision && (
                    <div className="mt-6 border-s-4 bg-white/10 px-5 py-4 text-sm font-bold leading-7 text-white backdrop-blur-sm" style={{ borderColor: brandColor }}>
                      الرؤية: {platform.vision}
                    </div>
                  )}
                </div>

                <div className="relative min-h-[280px] overflow-hidden rounded-lg border border-white/20 bg-white/10 shadow-card-hover sm:min-h-[380px] lg:min-h-[480px]">
                  {heroImage ? (
                    <Image
                      src={heroImage}
                      alt={platform.name}
                      fill
                      sizes="(min-width: 1024px) 50vw, 100vw"
                      className="absolute inset-0 h-full w-full object-cover brightness-110 saturate-150"
                      unoptimized
                    />
                  ) : (
                    <div className="surface-pattern absolute inset-0 flex items-center justify-center bg-gradient-soft">
                      <ImageOff className="h-16 w-16 text-primary-300" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/45 via-transparent to-white/10" />
                  <div className="absolute inset-x-6 bottom-6 h-1.5 rounded-full" style={{ backgroundColor: brandColor }} />
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Programs & Courses Section */}
        <section className="section-padding">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-neutral-900 mb-8">
              الدبلومات والدورات التدريبية
              <span className="text-neutral-400 text-lg font-normal mr-2">
                ({platform.programs.reduce((sum, p) => sum + p.activities.length, 0)} دورة)
              </span>
            </h2>

            {platform.programs.length === 0 ? (
              <p className="text-neutral-400 text-center py-12">لا توجد برامج مسجلة لهذه المنصة حالياً</p>
            ) : (
              <div className="space-y-6">
                {platform.programs.map((program, i) => (
                  <FadeIn key={program.id} delay={i * 0.1}>
                    <DiplomaCard program={program} platformSlug={slug} />
                  </FadeIn>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </PageLayout>
  )
}
