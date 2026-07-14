'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, BookOpen, CheckCircle2, Clock, FileText, ImageOff, Layers, User } from 'lucide-react'
import { Link } from '@/i18n/routing'
import FadeIn from '@/components/motion/FadeIn'
import PageLayout from '@/components/shared/PageLayout'
import LoadingSpinner from '@/components/shared/LoadingSpinner'

interface Platform {
  name: string
  slug: string
  color: string | null
}

interface RelatedActivity {
  id: string
  name: string
  slug: string
  description: string
  icon: string | null
}

interface Program {
  name: string
  slug: string
  description: string
  image: string | null
  platform: Platform
  activities: RelatedActivity[]
}

interface ActivityDetail {
  id: string
  name: string
  slug: string
  description: string
  icon: string | null
  program: Program
}

function parseCourseInfo(desc: string) {
  const instructor = desc.match(/المحاضر:\s*([^|]+)/)?.[1]?.trim()
  const duration = desc.match(/المدة:\s*([^|]+)/)?.[1]?.trim()
  const lessons = desc.match(/عدد الدروس:\s*(\d+)/)?.[1]
  return { instructor, duration, lessons: lessons ? parseInt(lessons) : null }
}

export default function CourseDetailPage() {
  const params = useParams()
  const platformSlug = params.slug as string
  const courseSlug = params.courseSlug as string

  const [activity, setActivity] = useState<ActivityDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`/api/activities/${courseSlug}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null }
        return r.json()
      })
      .then((data) => {
        if (data?.success) setActivity(data.data.activity)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [courseSlug])

  const info = useMemo(() => parseCourseInfo(activity?.description || ''), [activity])

  if (loading) {
    return (
      <PageLayout>
        <div className="flex min-h-screen items-center justify-center">
          <LoadingSpinner />
        </div>
      </PageLayout>
    )
  }

  if (notFound || !activity || activity.program.platform.slug !== platformSlug) {
    return (
      <PageLayout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="mb-2 text-2xl font-bold text-neutral-900">الدورة غير موجودة</h1>
            <Link href={`/platforms/${platformSlug}`} className="font-bold text-primary-700 no-underline">
              العودة إلى المنصة
            </Link>
          </div>
        </div>
      </PageLayout>
    )
  }

  const brandColor = activity.program.platform.color || '#527F47'
  const courseImage = activity.icon || activity.program.image
  const lessonCount = info.lessons || 3
  const lessons = Array.from({ length: lessonCount }).map((_, index) => ({
    title: index === 0 ? 'المدخل العام ومفاهيم الدورة' : index === lessonCount - 1 ? 'التطبيقات والمراجعة النهائية' : `محور تدريبي ${index + 1}`,
    description: index === 0
      ? `تهيئة معرفية مرتبطة بموضوع ${activity.name}.`
      : 'عرض المفاهيم الأساسية، الأمثلة التطبيقية، ونقاط المراجعة.',
  }))
  const relatedActivities = activity.program.activities.filter((item) => item.slug !== activity.slug).slice(0, 4)

  return (
    <PageLayout>
      <div className="min-h-screen bg-neutral-50">
        <section className="relative overflow-hidden bg-neutral-950 pt-28 text-white">
          {courseImage ? (
            <Image
              src={courseImage}
              alt={activity.name}
              fill
              sizes="100vw"
              className="absolute inset-0 h-full w-full object-cover opacity-40 brightness-110 saturate-125"
              unoptimized
            />
          ) : (
            <div className="surface-pattern absolute inset-0 bg-gradient-soft opacity-30" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/85 to-neutral-950/55" />

          <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-16 pt-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8">
            <FadeIn>
              <Link href={`/platforms/${platformSlug}`} className="mb-8 inline-flex items-center gap-1 text-sm font-bold text-white/80 no-underline hover:text-white">
                <ArrowLeft size={16} className="rtl-flip" />
                العودة إلى {activity.program.platform.name}
              </Link>

              <div className="mb-5 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-xs font-bold text-neutral-950">
                  <BookOpen size={15} />
                  {activity.program.name}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-bold text-white backdrop-blur-sm">
                  <Layers size={15} />
                  {lessonCount} دروس
                </span>
              </div>

              <h1 className="max-w-3xl text-4xl font-bold leading-tight md:text-5xl">{activity.name}</h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-white/85 sm:text-lg">
                صفحة عرض مخصصة لمحتوى الدورة، تجمع بياناتها الأساسية ومسار الدروس داخل الدبلوم.
              </p>

              <div className="mt-7 grid max-w-2xl gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
                  <User className="mb-2 h-5 w-5 text-white/75" />
                  <p className="text-xs text-white/60">المحاضر</p>
                  <p className="mt-1 text-sm font-bold">{info.instructor || 'غير محدد'}</p>
                </div>
                <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
                  <Clock className="mb-2 h-5 w-5 text-white/75" />
                  <p className="text-xs text-white/60">المدة</p>
                  <p className="mt-1 text-sm font-bold">{info.duration || 'غير محددة'}</p>
                </div>
                <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
                  <FileText className="mb-2 h-5 w-5 text-white/75" />
                  <p className="text-xs text-white/60">عدد الدروس</p>
                  <p className="mt-1 text-sm font-bold">{lessonCount} دروس</p>
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <div className="overflow-hidden rounded-lg border border-white/20 bg-white shadow-card-hover">
                <div className="relative aspect-square bg-neutral-50">
                  {courseImage ? (
                    <Image src={courseImage} alt={activity.name} fill sizes="420px" className="object-contain" unoptimized />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ImageOff className="h-16 w-16 text-primary-300" />
                    </div>
                  )}
                </div>
                <div className="p-5 text-neutral-900">
                  <div className="mb-4 h-1.5 rounded-full" style={{ backgroundColor: brandColor }} />
                  <p className="text-sm leading-7 text-neutral-600">{activity.description}</p>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        <section className="py-14 md:py-16">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8">
            <FadeIn>
              <div className="mb-6 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-neutral-900">محتويات الدورة</h2>
                  <p className="mt-2 text-sm leading-7 text-neutral-500">تصميم أولي لطريقة عرض محاور الدورة داخل الدبلوم.</p>
                </div>
              </div>

              <div className="space-y-4">
                {lessons.map((lesson, index) => (
                  <div key={lesson.title} className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
                    <div className="flex gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-50 font-bold text-primary-700">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-neutral-900">{lesson.title}</h3>
                        <p className="mt-2 text-sm leading-7 text-neutral-600">{lesson.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <aside className="space-y-5">
                <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-4 text-lg font-bold text-neutral-900">مسار الدبلوم</h3>
                  <div className="space-y-3">
                    {activity.program.activities.map((item) => (
                      <Link
                        key={item.id}
                        href={`/platforms/${platformSlug}/courses/${item.slug}`}
                        className={`flex items-start gap-3 rounded-lg border p-3 no-underline transition-colors ${
                          item.slug === activity.slug
                            ? 'border-primary-200 bg-primary-50 text-primary-900'
                            : 'border-neutral-100 bg-white text-neutral-700 hover:bg-neutral-50'
                        }`}
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: item.slug === activity.slug ? brandColor : undefined }} />
                        <span className="text-sm font-bold leading-6">{item.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>

                {relatedActivities.length > 0 && (
                  <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-4 text-lg font-bold text-neutral-900">دورات مرتبطة</h3>
                    <div className="space-y-3">
                      {relatedActivities.map((item) => (
                        <Link key={item.id} href={`/platforms/${platformSlug}/courses/${item.slug}`} className="flex items-center gap-3 no-underline">
                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-neutral-50">
                            {item.icon ? (
                              <Image src={item.icon} alt={item.name} fill sizes="56px" className="object-contain" unoptimized />
                            ) : (
                              <div className="flex h-full items-center justify-center bg-primary-50">
                                <BookOpen className="h-5 w-5 text-primary-400" />
                              </div>
                            )}
                          </div>
                          <span className="text-sm font-bold leading-6 text-neutral-800">{item.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </aside>
            </FadeIn>
          </div>
        </section>
      </div>
    </PageLayout>
  )
}
