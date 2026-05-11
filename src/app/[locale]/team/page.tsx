'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Linkedin, Quote, Users } from 'lucide-react'
import FadeIn from '@/components/motion/FadeIn'
import PageLayout from '@/components/shared/PageLayout'
import LoadingSpinner from '@/components/shared/LoadingSpinner'

interface TeamMember {
  id: string
  name: string
  role: string
  bio: string | null
  avatar: string | null
  linkedinUrl: string | null
}

function getInitials(name: string) {
  return name.trim().slice(0, 2)
}

const AVATAR_COLORS = [
  'from-primary-600 to-primary-800',
  'from-secondary-500 to-secondary-700',
  'from-primary-500 to-primary-700',
  'from-secondary-600 to-secondary-800',
  'from-primary-700 to-primary-900',
  'from-secondary-500 to-secondary-700',
  'from-primary-600 to-primary-800',
  'from-secondary-600 to-secondary-800',
]

export default function TeamPage() {
  const t = useTranslations('team')
  const [team, setTeam] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/team')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setTeam(data.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <PageLayout>
      <div className="min-h-screen">
        {/* ===== HEADER ===== */}
        <section className="relative overflow-hidden pt-28">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50/70 via-white to-secondary-50/50" />
          <div className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-primary-100/40 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-secondary-100/30 blur-3xl" />
          <div className="surface-pattern absolute inset-0 opacity-30" />

          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center">
            <FadeIn>
              <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-1.5 text-sm font-bold text-primary-700">
                <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
                فريق العمل
              </span>
              <h1 className="section-title">{t('title')}</h1>
              <p className="section-subtitle">
                نخبة من الشباب الطموح يعملون معاً لتحقيق رؤية شبكة الرواد
              </p>
            </FadeIn>
          </div>
        </section>

        {/* ===== TEAM GRID ===== */}
        <section className="section-padding relative overflow-hidden bg-white">
          <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-[600px] -translate-x-1/2 rounded-full bg-primary-50/30 blur-3xl" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {loading ? (
              <div className="flex justify-center py-20">
                <LoadingSpinner size="lg" />
              </div>
            ) : team.length === 0 ? (
              <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 py-20 text-center text-neutral-400">
                لا يوجد أعضاء فريق متاحون حالياً
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {team.map(({ id, name, role, bio, avatar, linkedinUrl }, i) => (
                  <FadeIn key={id} delay={i * 0.08}>
                    <div className="group relative h-full overflow-hidden rounded-xl border border-neutral-200/80 bg-white p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-primary-200/60">
                      {/* Top accent bar */}
                      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-500 to-secondary-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                      {/* Avatar */}
                      <div className="relative mx-auto mb-5">
                        {avatar ? (
                          <div className="relative inline-block">
                            <img
                              src={avatar}
                              alt={name}
                              className="relative mx-auto h-22 w-22 rounded-full border-4 border-white object-cover shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl"
                              style={{ width: '5.5rem', height: '5.5rem' }}
                            />
                            <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                          </div>
                        ) : (
                          <div
                            className={`relative mx-auto flex h-22 w-22 items-center justify-center rounded-full bg-gradient-to-br ${AVATAR_COLORS[i % AVATAR_COLORS.length]} shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl`}
                            style={{ width: '5.5rem', height: '5.5rem' }}
                          >
                            <span className="text-2xl font-bold text-white">{getInitials(name)}</span>
                          </div>
                        )}
                      </div>

                      <h3 className="font-bold text-neutral-900 transition-colors duration-200 group-hover:text-primary-700">{name}</h3>
                      <p className="mt-1 text-sm font-semibold text-primary-600">{role || 'عضو فريق'}</p>

                      {bio && (
                        <div className="relative mt-4">
                          <Quote size={14} className="absolute -right-1 -top-1 text-primary-200 opacity-50" />
                          <p className="line-clamp-3 px-2 text-xs leading-6 text-neutral-500">{bio}</p>
                        </div>
                      )}

                      {linkedinUrl && (
                        <div className="mt-5 pt-4 border-t border-neutral-100">
                          <a
                            href={linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-400 transition-all duration-200 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-600 hover:shadow-sm"
                            aria-label={`LinkedIn - ${name}`}
                          >
                            <Linkedin size={16} />
                          </a>
                        </div>
                      )}
                    </div>
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
