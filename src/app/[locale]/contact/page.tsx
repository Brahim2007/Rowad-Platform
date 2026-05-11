'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Mail, MapPin, Send, Linkedin, MessageSquare, CheckCircle2, ArrowLeft, Sparkles } from 'lucide-react'
import FadeIn from '@/components/motion/FadeIn'
import PageLayout from '@/components/shared/PageLayout'

const contactMethods = [
  {
    icon: Mail,
    label: 'البريد الإلكتروني',
    value: 'info@rowad-network.org',
    href: 'mailto:info@rowad-network.org',
    gradient: 'from-primary-100 to-primary-50',
    iconColor: 'text-primary-600',
    hoverBorder: 'hover:border-primary-200',
  },
  {
    icon: MapPin,
    label: 'الموقع',
    value: 'الكويت',
    href: null,
    gradient: 'from-secondary-100 to-secondary-50',
    iconColor: 'text-secondary-600',
    hoverBorder: 'hover:border-secondary-200',
  },
  {
    icon: Linkedin,
    label: 'لينكد إن',
    value: '@rowad-network',
    href: 'https://www.linkedin.com/company/rowad-network',
    gradient: 'from-info-100 to-info-50',
    iconColor: 'text-info-600',
    hoverBorder: 'hover:border-info-200',
  },
]

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setSent(true)
      } else {
        const data = await res.json()
        alert(data.message || 'حدث خطأ، يرجى المحاولة لاحقاً')
      }
    } catch {
      alert('حدث خطأ في الاتصال، يرجى المحاولة لاحقاً')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageLayout>
      <div className="min-h-screen">
        {/* ===== HEADER ===== */}
        <section className="relative overflow-hidden pt-28">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50/70 via-white to-secondary-50/50" />
          <div className="pointer-events-none absolute -left-20 top-1/3 h-72 w-72 rounded-full bg-primary-100/40 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 bottom-0 h-56 w-56 rounded-full bg-secondary-100/30 blur-3xl" />
          <div className="surface-pattern absolute inset-0 opacity-30" />

          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center">
            <FadeIn>
              <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-1.5 text-sm font-bold text-primary-700">
                <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
                تواصل معنا
              </span>
              <h1 className="section-title">تواصل معنا</h1>
              <p className="section-subtitle">
                لديك استفسار أو فكرة؟ نحن هنا لنسمع منك
              </p>
            </FadeIn>
          </div>
        </section>

        {/* ===== CONTACT CONTENT ===== */}
        <section className="section-padding relative overflow-hidden bg-white">
          <div className="pointer-events-none absolute right-0 top-0 h-80 w-80 translate-x-1/3 -translate-y-1/4 rounded-full bg-primary-50/30 blur-3xl" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
              {/* Form */}
              <FadeIn>
                <div className="relative rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-soft sm:p-8">
                  {/* Form header */}
                  <div className="mb-8 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 text-primary-600 shadow-sm">
                      <MessageSquare size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-neutral-900">أرسل لنا رسالة</h3>
                      <p className="text-sm text-neutral-500">سنتواصل معك في أقرب وقت</p>
                    </div>
                  </div>

                  {sent ? (
                    <div className="py-16 text-center">
                      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-success-100 to-success-50 shadow-sm">
                        <CheckCircle2 className="h-10 w-10 text-success-500" />
                      </div>
                      <h3 className="text-xl font-bold text-neutral-900 mb-2">شكراً لتواصلك!</h3>
                      <p className="text-neutral-500">سيتم الرد على استفسارك في أقرب وقت ممكن.</p>
                      <button
                        onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }) }}
                        className="mt-6 btn-outline btn-sm"
                      >
                        إرسال رسالة أخرى
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1.5">الاسم الكامل</label>
                          <input
                            required
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="input-field"
                            placeholder="أدخل اسمك"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1.5">البريد الإلكتروني</label>
                          <input
                            required
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className="input-field"
                            placeholder="أدخل بريدك"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1.5">الموضوع</label>
                        <input
                          required
                          value={form.subject}
                          onChange={(e) => setForm({ ...form, subject: e.target.value })}
                          className="input-field"
                          placeholder="موضوع الرسالة"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1.5">الرسالة</label>
                        <textarea
                          required
                          rows={5}
                          value={form.message}
                          onChange={(e) => setForm({ ...form, message: e.target.value })}
                          className="input-field resize-none"
                          placeholder="اكتب رسالتك هنا..."
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary btn-md w-full group disabled:opacity-70"
                      >
                        {loading ? (
                          'جارٍ الإرسال...'
                        ) : (
                          <>
                            إرسال الرسالة
                            <Send size={16} className="transition-transform duration-200 group-hover:-translate-x-0.5 rtl-flip" />
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              </FadeIn>

              {/* Contact Info Cards */}
              <FadeIn delay={0.15}>
                <div className="space-y-5">
                  {contactMethods.map(({ icon: Icon, label, value, href, gradient, iconColor, hoverBorder }) => (
                    <div
                      key={label}
                      className={`group rounded-xl border border-neutral-200/80 bg-white p-5 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${hoverBorder}`}
                    >
                      {href ? (
                        <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 no-underline">
                          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} ${iconColor} shadow-sm transition-all duration-300 group-hover:scale-110`}>
                            <Icon size={20} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-neutral-900 mb-0.5">{label}</h3>
                            <p className="text-sm text-neutral-500">{value}</p>
                          </div>
                        </a>
                      ) : (
                        <div className="flex items-center gap-4">
                          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} ${iconColor} shadow-sm transition-all duration-300 group-hover:scale-110`}>
                            <Icon size={20} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-neutral-900 mb-0.5">{label}</h3>
                            <p className="text-sm text-neutral-500">{value}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Quick CTA */}
                  <div className="rounded-xl bg-gradient-to-br from-primary-50 to-primary-100/50 p-6 text-center shadow-soft">
                    <Sparkles className="mx-auto h-8 w-8 text-primary-600 mb-3" />
                    <h3 className="font-bold text-neutral-900">نحن نسمعك</h3>
                    <p className="mt-2 text-sm leading-7 text-neutral-600">
                      فريقنا متاح للرد على استفساراتك واقتراحاتك على مدار الساعة
                    </p>
                  </div>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>
      </div>
    </PageLayout>
  )
}
