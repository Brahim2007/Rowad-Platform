'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, Calendar } from 'lucide-react'
import { Link } from '@/i18n/routing'
import FadeIn from '@/components/motion/FadeIn'
import PageLayout from '@/components/shared/PageLayout'
import LoadingSpinner from '@/components/shared/LoadingSpinner'

interface ProjectDetail {
  id: string
  title: string
  slug: string
  category: string
  description: string
  fullContent: string | null
  status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'PLANNING'
  startDate: string | null
  endDate: string | null
  isFeatured: boolean
  platform: { id: string; name: string; slug: string } | null
  program: { id: string; name: string; slug: string } | null
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'نشط',
  COMPLETED: 'مكتمل',
  ON_HOLD: 'متوقف',
  PLANNING: 'تخطيط',
}

const STATUS_CLASSES: Record<string, string> = {
  ACTIVE: 'badge-success',
  COMPLETED: 'badge-primary',
  ON_HOLD: 'badge-error',
  PLANNING: 'badge-warning',
}

export default function ProjectDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null }
        return r.json()
      })
      .then((data) => {
        if (data?.success) setProject(data.data)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <PageLayout>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </PageLayout>
    )
  }

  if (notFound || !project) {
    return (
      <PageLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">المشروع غير موجود</h1>
            <Link href="/projects" className="text-primary-600 no-underline">العودة إلى المشاريع</Link>
          </div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="min-h-screen">
        <section className="bg-gradient-soft pt-32 pb-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <FadeIn>
              <Link href="/projects" className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-primary-600 no-underline mb-6">
                <ArrowLeft size={16} className="rtl-flip" />
                العودة إلى المشاريع
              </Link>
              <div className="flex items-center gap-3 mb-4">
                <span className={STATUS_CLASSES[project.status] || ''}>
                  {STATUS_LABELS[project.status] || project.status}
                </span>
                <span className="text-sm text-neutral-400">{project.category}</span>
              </div>
              <h1 className="section-title mb-4">{project.title}</h1>
              <p className="text-lg text-neutral-600">{project.description}</p>
            </FadeIn>
          </div>
        </section>

        <section className="section-padding">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <FadeIn>
              <div className="card">
                <div className="aspect-video bg-gradient-soft rounded-lg mb-6 flex items-center justify-center">
                  <span className="text-neutral-400">صورة المشروع</span>
                </div>

                <div className="flex flex-wrap gap-6 text-sm text-neutral-500 mb-6">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    <span>
                      تاريخ الإطلاق: {project.startDate
                        ? new Date(project.startDate).toLocaleDateString('ar-SA')
                        : 'قيد التحديث'}
                    </span>
                  </div>
                  {project.platform && (
                    <Link
                      href={`/platforms/${project.platform.slug}`}
                      className="flex items-center gap-1 text-primary-600 no-underline"
                    >
                      منصة: {project.platform.name}
                    </Link>
                  )}
                  {project.program && (
                    <span className="text-neutral-400">
                      برنامج: {project.program.name}
                    </span>
                  )}
                </div>

                {project.fullContent && (
                  <div className="prose prose-neutral max-w-none">
                    <p className="text-neutral-700 leading-relaxed">{project.fullContent}</p>
                  </div>
                )}
              </div>
            </FadeIn>
          </div>
        </section>
      </div>
    </PageLayout>
  )
}
