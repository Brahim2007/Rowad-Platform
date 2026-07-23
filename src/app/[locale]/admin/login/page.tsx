'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Image from 'next/image'
import { signIn } from 'next-auth/react'
import {
  ArrowLeft,
  BarChart3,
  Eye,
  EyeOff,
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

  const handleSubmit = async (event: FormEvent) => {
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
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-cyan-400 via-cyan-500 to-teal-500 px-4 py-8 sm:px-6"
      dir="rtl"
    >
      <div className="pointer-events-none absolute -start-24 -top-24 size-80 rounded-full border-[44px] border-white/10" />
      <div className="pointer-events-none absolute -bottom-32 -end-24 size-96 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute start-[12%] top-[18%] size-3 rounded-full bg-white/60" />
      <div className="pointer-events-none absolute end-[14%] bottom-[16%] size-2 rounded-full bg-blue-950/25" />

      <div
        className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/30 bg-white shadow-[0_32px_90px_rgba(8,47,73,0.30)] lg:min-h-[610px] lg:grid-cols-[0.95fr_1.05fr]"
        style={{ direction: 'ltr' }}
      >
        <section
          className="relative flex min-h-[310px] flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-primary-800 p-7 text-white sm:p-10 lg:min-h-full"
          dir="rtl"
        >
          <div className="absolute inset-0 opacity-15">
            <div className="absolute -start-16 top-1/3 size-52 rounded-full border-[34px] border-cyan-300" />
            <div className="absolute -end-20 -top-16 size-64 rounded-full border border-white/50" />
            <div className="absolute bottom-16 end-14 size-20 rotate-45 border-2 border-cyan-300/60" />
            <div className="absolute bottom-20 start-12 size-16 rounded-full bg-cyan-300/30" />
          </div>

          <div className="relative">
            <div className="mb-8 inline-flex rounded-2xl bg-white/10 p-3 ring-1 ring-white/15 backdrop-blur-sm">
              <Image
                src="https://www.rowwad.net/uploads/system/logo-light.png"
                alt="شبكة الرواد الإلكترونية"
                width={190}
                height={70}
                className="h-auto w-40 sm:w-44"
                unoptimized
                priority
              />
            </div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-200/25 bg-cyan-300/10 px-3 py-1.5 text-[11px] font-bold text-cyan-100">
              <ShieldCheck size={14} />
              بوابة الإدارة الآمنة
            </div>
            <h1 className="max-w-md text-3xl font-black leading-[1.45] sm:text-4xl">
              مركز قيادة شبكة الرواد
            </h1>
            <div className="my-5 h-1 w-20 rounded-full bg-cyan-300" />
            <p className="max-w-md text-sm leading-7 text-blue-100/80">
              إدارة المنصات والأعضاء ومؤشرات الأثر والتقارير الذكية من مساحة موحّدة صُممت لدعم القرار.
            </p>
          </div>

          <div className="relative mt-8 grid grid-cols-3 gap-2">
            {[
              { icon: BarChart3, label: 'مؤشرات حية' },
              { icon: Layers3, label: 'منصات مترابطة' },
              { icon: Sparkles, label: 'تقارير ذكية' },
            ].map(item => (
              <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.07] px-2 py-3 text-center backdrop-blur-sm">
                <item.icon size={17} className="mx-auto mb-1.5 text-cyan-200" />
                <span className="text-[10px] font-semibold text-white/75">{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        <main className="flex items-center bg-white px-6 py-9 sm:px-10 lg:px-14" dir="rtl">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8">
              <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-800 ring-1 ring-blue-100">
                <LockKeyhole size={22} />
              </div>
              <h2 className="text-2xl font-black text-blue-950 sm:text-3xl">مرحبًا بعودتك</h2>
              <p className="mt-2 text-sm leading-6 text-neutral-500">سجّل الدخول للوصول إلى لوحة التحكم</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="admin-email" className="mb-2 block text-sm font-bold text-neutral-700">البريد الإلكتروني</label>
                <div className="relative">
                  <Mail size={18} className="pointer-events-none absolute end-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <Input
                    id="admin-email"
                    type="email"
                    required
                    value={email}
                    onChange={event => setEmail(event.target.value)}
                    className="h-12 rounded-xl border-neutral-200 pe-11 text-start focus:border-blue-500 focus:ring-blue-500/20"
                    placeholder="name@rowad-network.org"
                    autoComplete="email"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="admin-password" className="mb-2 block text-sm font-bold text-neutral-700">كلمة المرور</label>
                <div className="relative">
                  <LockKeyhole size={18} className="pointer-events-none absolute end-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <Input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={event => setPassword(event.target.value)}
                    className="h-12 rounded-xl border-neutral-200 px-11 text-start focus:border-blue-500 focus:ring-blue-500/20"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    dir="ltr"
                  />
                  <Button
                    unstyled
                    type="button"
                    onClick={() => setShowPassword(current => !current)}
                    className="absolute start-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-blue-700"
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
                  className="size-4 rounded border-neutral-300 text-blue-700 focus:ring-blue-600"
                />
                تذكّر البريد الإلكتروني
              </label>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">
                  {error}
                </div>
              )}

              <Button
                unstyled
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-blue-800 to-blue-600 font-bold text-white shadow-lg shadow-blue-700/20 transition hover:-translate-y-0.5 hover:shadow-xl disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowLeft size={18} />}
                {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
              </Button>
            </form>

            <div className="mt-8 border-t border-neutral-200 pt-5 text-center text-xs text-neutral-400">
              © {new Date().getFullYear()} شبكة الرواد الإلكترونية — جميع الحقوق محفوظة
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
