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
  Loader2,
  LockKeyhole,
  ShieldCheck,
  Activity,
  FileText,
  TreePine,
  Eye,
  EyeOff,
  Building2,
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

  const logo = (
    <Image
      src="https://www.rowwad.net/uploads/system/logo-light.png"
      alt="شبكة الرواد الإلكترونية"
      width={140}
      height={48}
      className="h-10 w-auto"
      unoptimized
    />
  )

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30 flex items-center justify-center p-4" dir="rtl">
      {/* عناصر خلفية ناعمة */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <svg className="absolute h-full w-full opacity-[0.02]" viewBox="0 0 1440 900" preserveAspectRatio="none">
          <defs>
            <pattern id="login-light-grid" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="hsl(var(--primary-700))" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#login-light-grid)" />
        </svg>
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary-200/30 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-secondary-200/25 blur-3xl" />
      </div>

      <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.5s ease-out forwards; }
      `}</style>

      <div className="relative w-full max-w-[410px] animate-slide-up">
        {/* بطاقة تسجيل الدخول — تصميم فاتح ونظيف */}
        <div className="rounded-3xl border border-neutral-200/60 bg-white p-7 shadow-xl shadow-neutral-200/50">
          {/* الشعار */}
          <div className="text-center mb-6">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 ring-1 ring-primary-100">
              <LockKeyhole size={22} className="text-primary-600" />
            </div>
            <h1 className="text-xl font-bold text-neutral-900">تسجيل الدخول</h1>
            <p className="mt-1 text-sm text-neutral-500">لوحة تحكم شبكة الرواد الإلكترونية</p>
          </div>

          {DEMO_ACCOUNTS.length > 0 && (
            <div className="mb-5">
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
              <div className="my-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-neutral-200" />
                <span className="text-[10px] font-bold text-neutral-400 tracking-wider">أو</span>
                <div className="h-px flex-1 bg-neutral-200" />
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
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
              className="w-full rounded-2xl bg-primary-600 h-12 text-sm font-bold text-white shadow-lg shadow-primary-600/15 transition-all duration-300 hover:bg-primary-700 hover:shadow-xl hover:shadow-primary-600/25 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
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
          <div className="mt-6 pt-5 border-t border-neutral-100">
            <div className="grid grid-cols-3 gap-2.5 text-center">
              {[
                { icon: TreePine, label: 'منصات متعددة' },
                { icon: Activity, label: 'مؤشرات الأثر' },
                { icon: FileText, label: 'تقارير ذكية' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="rounded-xl bg-neutral-50 py-3 ring-1 ring-neutral-100 transition-all hover:bg-primary-50 hover:ring-primary-100">
                  <Icon className="mx-auto h-4 w-4 text-primary-600" />
                  <span className="block text-[10px] font-semibold text-neutral-600 mt-1">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* رابط العودة */}
        <div className="mt-5 text-center">
          <Link href="/ar" className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-400 transition-colors hover:text-primary-600 no-underline">
            <ArrowLeft size={12} />
            العودة إلى الموقع الرئيسي
          </Link>
        </div>
      </div>
    </div>
  )
}
