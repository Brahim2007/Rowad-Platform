'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  Layers3,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { safeInternalPath } from '@/lib/safe-internal-path'

const REMEMBERED_ADMIN_EMAIL = 'rowad_admin_email'

const highlights = [
  { icon: Layers3, label: 'إدارة موحّدة' },
  { icon: BarChart3, label: 'مؤشرات الأثر' },
  { icon: FileText, label: 'تقارير ذكية' },
]

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const rememberedEmail = window.localStorage.getItem(REMEMBERED_ADMIN_EMAIL)
    if (rememberedEmail) {
      setEmail(rememberedEmail)
      setRememberMe(true)
    }
  }, [])

  const getCallbackUrl = () => {
    const params = new URLSearchParams(window.location.search)
    return safeInternalPath(params.get('callbackUrl'), '/ar/admin/dashboard')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة')
        return
      }

      if (rememberMe) {
        window.localStorage.setItem(REMEMBERED_ADMIN_EMAIL, email.trim())
      } else {
        window.localStorage.removeItem(REMEMBERED_ADMIN_EMAIL)
      }

      window.location.href = getCallbackUrl()
    } catch {
      setError('تعذر الاتصال بالخادم، حاول مرة أخرى')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 px-4 py-8 sm:px-6"
      dir="rtl"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -start-32 -top-36 size-[34rem] rounded-full border-[72px] border-white/[0.06]" />
        <div className="absolute -bottom-44 -end-28 size-[32rem] rounded-full bg-secondary-400/20 blur-3xl" />
        <div className="absolute start-[12%] top-[17%] size-3 rounded-full bg-secondary-200/80" />
        <div className="absolute bottom-[18%] end-[11%] size-2 rounded-full bg-white/70" />
        <div className="absolute end-[17%] top-[12%] h-px w-20 rotate-45 bg-white/20" />
      </div>

      <div
        className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-[26px] border border-white/20 bg-white shadow-[0_35px_100px_rgba(20,40,18,0.34)] lg:min-h-[570px] lg:grid-cols-[1fr_1fr]"
        style={{ direction: 'ltr' }}
      >
        <section
          className="relative flex min-h-[310px] flex-col justify-between overflow-hidden bg-gradient-to-br from-primary-700 via-primary-800 to-primary-950 p-7 text-white sm:p-10 lg:min-h-full"
          dir="rtl"
        >
          <div className="pointer-events-none absolute inset-0 opacity-20">
            <div className="absolute -start-12 top-16 size-28 rounded-full border-2 border-secondary-300" />
            <div className="absolute end-16 top-28 size-52 rounded-full border-[3px] border-white/20" />
            <div className="absolute -end-8 bottom-20 size-36 rotate-45 border-2 border-secondary-300/70" />
            <div className="absolute bottom-14 start-14 size-20 rounded-full bg-secondary-400/40" />
            <div className="absolute bottom-0 start-0 h-24 w-full bg-gradient-to-t from-black/15 to-transparent" />
          </div>

          <div className="relative">
            <div className="mb-8 inline-flex rounded-2xl bg-white p-3 shadow-lg shadow-black/10 ring-1 ring-white/30">
              <Image
                src="/images/Rowad-Logo.png"
                alt="شبكة الرواد الإلكترونية"
                width={220}
                height={86}
                className="h-auto w-44 sm:w-48"
                priority
              />
            </div>

            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-secondary-200/25 bg-secondary-300/10 px-3 py-1.5 text-[11px] font-bold text-secondary-200">
              <Sparkles size={14} />
              منظومة إدارة الأثر والبرامج
            </div>

            <h1 className="max-w-md text-3xl font-black leading-[1.45] sm:text-4xl">
              أهلاً بك في لوحة قيادة الرواد
            </h1>
            <div className="my-5 h-1 w-20 rounded-full bg-secondary-400" />
            <p className="max-w-md text-sm leading-7 text-white/70">
              مساحة موحّدة لإدارة المنصات والأعضاء، متابعة مؤشرات الأداء، وصناعة تقارير أثر تدعم القرار.
            </p>
          </div>

          <div className="relative mt-8 grid grid-cols-3 gap-2">
            {highlights.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="rounded-xl border border-white/10 bg-white/[0.07] px-2 py-3 text-center backdrop-blur-sm"
              >
                <Icon size={17} className="mx-auto mb-1.5 text-secondary-300" />
                <span className="text-[10px] font-semibold text-white/75">{label}</span>
              </div>
            ))}
          </div>
        </section>

        <main className="flex items-center bg-white px-6 py-9 sm:px-10 lg:px-14" dir="rtl">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8">
              <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-700 ring-1 ring-primary-100">
                <LockKeyhole size={22} />
              </div>
              <h2 className="text-2xl font-black text-primary-950 sm:text-3xl">مرحبًا بعودتك</h2>
              <p className="mt-2 text-sm leading-6 text-neutral-500">
                سجّل الدخول للوصول إلى لوحة التحكم
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="admin-email" className="mb-2 block text-sm font-bold text-neutral-700">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <Mail
                    size={18}
                    className="pointer-events-none absolute end-4 top-1/2 -translate-y-1/2 text-neutral-400"
                  />
                  <Input
                    id="admin-email"
                    type="email"
                    required
                    value={email}
                    onChange={event => setEmail(event.target.value)}
                    className="h-12 rounded-xl border-neutral-200 pe-11 text-start focus:border-primary-500 focus:ring-primary-500/20"
                    placeholder="name@rowad-network.org"
                    autoComplete="email"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="admin-password" className="mb-2 block text-sm font-bold text-neutral-700">
                  كلمة المرور
                </label>
                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="pointer-events-none absolute end-4 top-1/2 -translate-y-1/2 text-neutral-400"
                  />
                  <Input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={event => setPassword(event.target.value)}
                    className="h-12 rounded-xl border-neutral-200 px-11 text-start focus:border-primary-500 focus:ring-primary-500/20"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    dir="ltr"
                  />
                  <Button
                    unstyled
                    type="button"
                    onClick={() => setShowPassword(current => !current)}
                    className="absolute start-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-primary-50 hover:text-primary-700"
                    aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </Button>
                </div>
              </div>

              <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-neutral-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={event => setRememberMe(event.target.checked)}
                  className="size-4 rounded border-neutral-300 text-primary-700 focus:ring-primary-600"
                />
                تذكّر البريد الإلكتروني
              </label>

              {error && (
                <div
                  className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
                  role="alert"
                >
                  <ShieldCheck size={17} className="shrink-0" />
                  {error}
                </div>
              )}

              <Button
                unstyled
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-primary-700 to-primary-600 font-bold text-white shadow-lg shadow-primary-700/20 transition hover:-translate-y-0.5 hover:from-primary-800 hover:to-primary-700 hover:shadow-xl disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowLeft size={18} />}
                {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
              </Button>
            </form>

            <div className="mt-7 border-t border-neutral-200 pt-5">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="inline-flex items-center gap-1.5 text-neutral-400">
                  <CheckCircle2 size={14} className="text-primary-600" />
                  اتصال آمن ومشفّر
                </span>
                <Link
                  href="/ar"
                  className="inline-flex items-center gap-1.5 font-semibold text-primary-700 no-underline transition hover:text-primary-900"
                >
                  العودة للموقع
                  <ArrowLeft size={13} />
                </Link>
              </div>
            </div>

            <p className="mt-6 text-center text-[11px] text-neutral-400">
              © {new Date().getFullYear()} شبكة الرواد الإلكترونية — جميع الحقوق محفوظة
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}
