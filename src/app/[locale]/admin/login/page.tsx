'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { useEffect, useState } from 'react'
import { signIn } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { safeInternalPath } from '@/lib/safe-internal-path'
import {
  ArrowLeft,
  Crown,
  Database,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  Activity,
  TrendingUp,
  Blocks,
  FileText,
  TreePine,
  Eye,
  EyeOff,
} from 'lucide-react'

const DEMO_ACCOUNTS: Array<{
  role: string
  icon: typeof Crown
  email: string
  password: string
  color: string
  bgLight: string
  border: string
  textColor: string
  desc: string
}> = []

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [demoLoadingIdx, setDemoLoadingIdx] = useState<number | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const getCallbackUrl = () => {
    const params = new URLSearchParams(window.location.search)
    return safeInternalPath(params.get('callbackUrl'), '/ar/admin/dashboard')
  }

  const loginWithCredentials = async (loginEmail: string, loginPassword: string) => {
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email: loginEmail,
        password: loginPassword,
        redirect: false,
      })

      if (result?.error) {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة')
      } else {
        window.location.href = getCallbackUrl()
      }
    } catch {
      setError('حدث خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await loginWithCredentials(email, password)
  }

  const handleDemoLogin = async (idx: number) => {
    const account = DEMO_ACCOUNTS[idx]
    setEmail(account.email)
    setPassword(account.password)
    setDemoLoadingIdx(idx)
    setError('')

    try {
      const result = await signIn('credentials', {
        email: account.email,
        password: account.password,
        redirect: false,
      })

      if (result?.error) {
        setError('فشل الدخول التجريبي — تأكد من تشغيل البذرة')
      } else {
        window.location.href = getCallbackUrl()
      }
    } catch {
      setError('حدث خطأ في الاتصال')
    } finally {
      setDemoLoadingIdx(null)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-primary-950 via-primary-900 to-neutral-950 flex items-center justify-center p-4" dir="rtl">
      {/* خلفية بنمط نقاط */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
        <svg className="h-full w-full" viewBox="0 0 1440 900" preserveAspectRatio="none">
          <defs>
            <pattern id="inov-login-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="1" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#inov-login-grid)" />
        </svg>
      </div>
      {/* كرات ضبابية ناعمة */}
      <div className="absolute -left-32 top-1/3 h-80 w-80 rounded-full bg-secondary-500/8 blur-3xl" />
      <div className="absolute -right-32 bottom-1/4 h-64 w-64 rounded-full bg-primary-400/8 blur-3xl" />

      <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.5s ease-out forwards; }
      `}</style>

      <div className="w-full max-w-[420px] animate-slide-up">
        {/* بطاقة تسجيل الدخول - تصميم نظيف */}
        <div className="rounded-3xl border border-white/10 bg-white/98 p-8 shadow-2xl backdrop-blur-sm">
          {/* الشعار */}
          <div className="text-center mb-7">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 shadow-sm ring-1 ring-primary-200/50">
              <Image
                src="https://www.rowwad.net/uploads/system/logo-light.png"
                alt="شبكة الرواد الإلكترونية"
                width={36}
                height={36}
                className="h-9 w-auto"
                unoptimized
              />
            </div>
            <h1 className="text-xl font-bold text-neutral-900">تسجيل الدخول</h1>
            <p className="mt-1.5 text-sm text-neutral-500 leading-6">لوحة تحكم شبكة الرواد الإلكترونية</p>
          </div>

          {DEMO_ACCOUNTS.length > 0 && (
            <div className="mb-6">
              <div className="grid gap-2">
                {DEMO_ACCOUNTS.map((account, idx) => {
                  const Icon = account.icon
                  const isLoading = demoLoadingIdx === idx
                  return (
                    <Button unstyled
                      key={idx}
                      type="button"
                      onClick={() => handleDemoLogin(idx)}
                      disabled={loading || demoLoadingIdx !== null}
                      className={`flex w-full items-center gap-3 rounded-xl border ${account.border} ${account.bgLight} px-3 py-2.5 text-start transition-all hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${account.color} text-white shadow-sm`}>
                        {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Icon size={16} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block text-[11px] sm:text-xs font-bold ${account.textColor}`}>{account.role}</span>
                        <span className="mt-0.5 block text-[10px] text-neutral-500 leading-tight">{account.desc}</span>
                      </span>
                      <ArrowLeft size={14} className="shrink-0 text-neutral-400" />
                    </Button>
                  )
                })}
              </div>
              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-neutral-200" />
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">أو</span>
                <div className="h-px flex-1 bg-neutral-200" />
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-neutral-700">البريد الإلكتروني</label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field h-11"
                placeholder="admin@rowad.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-neutral-700">كلمة المرور</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field h-11 pl-10"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-error-50 px-4 py-3 text-xs text-error-700 ring-1 ring-error-200 flex items-center gap-2" role="alert">
                <ShieldCheck size={14} className="shrink-0" />
                {error}
              </div>
            )}

            <Button unstyled
              type="submit"
              disabled={loading || demoLoadingIdx !== null}
              className="w-full rounded-2xl bg-gradient-to-l from-primary-600 to-primary-700 h-12 text-sm font-bold text-white shadow-lg shadow-primary-600/20 transition-all duration-300 hover:shadow-xl hover:shadow-primary-600/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  جارٍ تسجيل الدخول...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  تسجيل الدخول
                  <ArrowLeft size={16} />
                </span>
              )}
            </Button>
          </form>

          {/* مؤشرات سفلية */}
          <div className="mt-6 pt-6 border-t border-neutral-100">
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { icon: TreePine, label: 'منصات' },
                { icon: Activity, label: 'مؤشرات' },
                { icon: FileText, label: 'تقارير' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="group rounded-xl bg-primary-50/50 py-2.5 ring-1 ring-primary-100/50 transition-all hover:bg-primary-100 hover:shadow-sm">
                  <Icon className="mx-auto h-4 w-4 text-primary-600 group-hover:text-primary-700" />
                  <span className="block text-[10px] font-bold text-primary-700 mt-1">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* رابط العودة */}
        <div className="mt-5 text-center">
          <Link href="/ar" className="inline-flex items-center gap-1.5 text-xs text-white/40 transition-colors hover:text-secondary-300 no-underline">
            <ArrowLeft size={12} />
            العودة إلى الموقع الرئيسي
          </Link>
        </div>
      </div>
    </div>
  )
}
