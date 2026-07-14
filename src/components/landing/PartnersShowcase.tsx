'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import FadeIn from '@/components/motion/FadeIn'

interface Partner {
  id: string
  name: string
  logo: string | null
  websiteUrl: string | null
  type: string
  description: string | null
}

const TYPE_LABELS: Record<string, string> = {
  PARTNER: 'شريك',
  SPONSOR: 'راعٍ',
  SUPPORTER: 'داعم',
  DONOR: 'مانح',
}

export default function PartnersShowcase() {
  const t = useTranslations('partners')
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/partners')
      .then((response) => response.json())
      .then((data) => {
        if (data.success) setPartners(data.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const partnerLoop = partners.length > 0 ? [...partners, ...partners] : []

  return (
    <section className="section-padding relative overflow-hidden bg-white">
      <div className="pointer-events-none absolute left-0 top-1/3 h-64 w-64 -translate-x-1/3 rounded-full bg-secondary-50/50 blur-3xl" />
      <div className="pointer-events-none absolute right-0 bottom-1/4 h-48 w-48 translate-x-1/3 rounded-full bg-primary-50/50 blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="mx-auto max-w-3xl text-center">
            <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-secondary-50 px-4 py-1.5 text-sm font-bold text-secondary-700">
              <span className="h-1.5 w-1.5 rounded-full bg-secondary-500" />
              شركاء المسيرة
            </span>
            <h2 className="section-title">{t('title')}</h2>
            <p className="mt-4 text-base leading-8 text-neutral-600 sm:text-lg">
              نفتخر بشراكاتنا مع مؤسسات رائدة في المجال الشبابي والرقمي.
            </p>
          </div>
        </FadeIn>
      </div>

      {loading ? (
        <div className="relative mt-14 flex gap-8 overflow-hidden px-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-[150px] w-[250px] flex-shrink-0 animate-pulse rounded-xl border border-neutral-200 bg-neutral-100"
            />
          ))}
        </div>
      ) : partners.length === 0 ? (
        <div className="mx-auto mt-14 max-w-3xl rounded-xl border border-dashed border-neutral-300 bg-neutral-50 py-14 text-center text-neutral-500">
          لا يوجد شركاء متاحون حالياً
        </div>
      ) : (
        <div className="relative mt-14 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
          <div
            className="flex gap-8"
            style={{
              animation: 'scrollBand 38s linear infinite',
              width: 'max-content',
            }}
          >
            {partnerLoop.map(({ id, name, logo, websiteUrl, type, description }, i) => {
              const cardClass = 'group flex h-[150px] w-[250px] flex-shrink-0 flex-col items-center justify-center gap-3.5 rounded-xl border border-neutral-200/80 bg-gradient-to-b from-neutral-50 to-white px-6 py-5 text-center shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary-200/60 hover:-translate-y-0.5'
              const content = (
                <>
                  <div className="relative flex h-16 w-32 items-center justify-center transition-transform duration-300 group-hover:scale-105">
                    {logo ? (
                      <Image src={logo} alt={name} fill sizes="128px" className="object-contain" unoptimized />
                    ) : (
                      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-xl font-bold text-primary-700">
                        {name.trim().slice(0, 1)}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="line-clamp-2 text-xs font-bold leading-5 text-neutral-700 transition-colors duration-300 group-hover:text-primary-700">
                      {name}
                    </span>
                    <span className="mt-1 block text-[10px] font-semibold text-secondary-600">
                      {TYPE_LABELS[type] || type}
                    </span>
                    {description && <span className="sr-only">{description}</span>}
                  </div>
                </>
              )

              return websiteUrl ? (
                <a
                  key={`${id}-${i}`}
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${cardClass} no-underline`}
                >
                  {content}
                </a>
              ) : (
                <div key={`${id}-${i}`} className={cardClass}>
                  {content}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
