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
  BarChart3,
  Crown,
  Database,
  Loader2,
  LockKeyhole,
  Quote,
  ShieldCheck,
  Sparkles,
  Activity,
  TrendingUp,
  Layers,
  Blocks,
  FileText,
  Target,
  TreePine,
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

const quotes = [
  {
    en: "Without data, you're just another person with an opinion.",
    by: 'W. Edwards Deming',
    ar: 'بدون بيانات، أنت مجرد شخص لديه رأي فقط.',
  },
  {
    en: 'Data is the new oil.',
    by: 'Clive Humby',
    ar: 'البيانات هي النفط الجديد.',
  },
  {
    en: 'In God we trust. All others must bring data.',
    by: 'W. Edwards Deming',
    ar: 'نحن نثق بالله، أما البقية فعليهم إحضار البيانات.',
  },
  {
    en: 'The goal is to turn data into information, and information into insight.',
    by: 'Carly Fiorina',
    ar: 'الهدف هو تحويل البيانات إلى معلومات، ثم إلى فهم عميق.',
  },
  {
    en: 'A leader is one who knows the way, goes the way, and shows the way.',
    by: 'John C. Maxwell',
    ar: 'القائد هو من يعرف الطريق، ويسلك الطريق، ويُري الآخرين الطريق.',
  },
  {
    en: 'The best way to predict the future is to create it.',
    by: 'Peter Drucker',
    ar: 'أفضل طريقة لتوقع المستقبل هي أن تصنعه أنت.',
  },
  {
    en: 'Quality is not an act, it is a habit.',
    by: 'Aristotle',
    ar: 'الجودة ليست فِعلاً، بل هي عادة.',
  },
  {
    en: 'Teamwork makes the dream work.',
    by: 'John C. Maxwell',
    ar: 'العمل الجماعي يصنع المعجزات.',
  },
]

// ─── Floating Icons using project colors (green/amber) ───

const floatingIcons = [
  { icon: TreePine, label: 'نمو', x: '10%', y: '15%', size: 22, delay: '0s', duration: '6s' },
  { icon: BarChart3, label: 'تحليل', x: '80%', y: '20%', size: 20, delay: '1.5s', duration: '7s' },
  { icon: Activity, label: 'أداء', x: '15%', y: '70%', size: 24, delay: '0.8s', duration: '8s' },
  { icon: TrendingUp, label: 'نمو', x: '75%', y: '75%', size: 18, delay: '2.2s', duration: '5.5s' },
  { icon: Layers, label: 'تقارير', x: '85%', y: '45%', size: 20, delay: '3s', duration: '7.5s' },
  { icon: ShieldCheck, label: 'حوكمة', x: '5%', y: '45%', size: 16, delay: '1s', duration: '6.5s' },
  { icon: Target, label: 'رؤية', x: '45%', y: '12%', size: 18, delay: '2.5s', duration: '7s' },
]

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [demoLoadingIdx, setDemoLoadingIdx] = useState<number | null>(null)

  const [randomQuote, setRandomQuote] = useState(quotes[0])

  useEffect(() => {
    setRandomQuote(quotes[Math.floor(Math.random() * quotes.length)])
  }, [])

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
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-12px) rotate(3deg); }
          50% { transform: translateY(-6px) rotate(-2deg); }
          75% { transform: translateY(-18px) rotate(4deg); }
        }
        @keyframes wave {
          0% { transform: translateX(0) translateY(0); }
          50% { transform: translateX(-25%) translateY(2px); }
          100% { transform: translateX(0) translateY(0); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-float { animation: float var(--duration, 6s) ease-in-out infinite; animation-delay: var(--delay, 0s); }
        .animate-wave { animation: wave 8s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
        .animate-slide-up { animation: slide-up 0.6s ease-out forwards; }
      `}</style>

      <div className="min-h-screen overflow-y-auto bg-gradient-to-br from-primary-950 via-primary-900 to-neutral-950" dir="rtl">
        {/* خلفية بنمط الأمواج */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <svg className="absolute h-full w-full opacity-[0.03]" viewBox="0 0 1440 900" preserveAspectRatio="none">
            <defs>
              <pattern id="login-grid" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#login-grid)" />
          </svg>
        </div>

        <div className="grid min-h-screen lg:grid-cols-[1fr_1fr]">
          {/* ─── Right: Brand Section ─── */}
          <section className="relative hidden overflow-hidden lg:flex lg:flex-col lg:min-h-screen">
            {/* خلفية متدرجة */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-950 via-primary-900 to-primary-950" />

            {/* أنماط مموجة */}
            <div className="absolute inset-0 opacity-[0.06]">
              <svg className="h-full w-full animate-wave" viewBox="0 0 1440 900" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="wave-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0.3" />
                  </linearGradient>
                </defs>
                <path d="M0,450 C240,350 480,550 720,450 C960,350 1200,550 1440,450 L1440,900 L0,900 Z" fill="url(#wave-grad)" opacity="0.15" />
                <path d="M0,550 C240,450 480,650 720,550 C960,450 1200,650 1440,550 L1440,900 L0,900 Z" fill="url(#wave-grad)" opacity="0.1" />
              </svg>
            </div>

            {/* الأيقونات العائمة بألوان المشروع */}
            {floatingIcons.map(({ icon: Icon, label, x, y, size, delay, duration }) => (
              <div
                key={label}
                className="absolute animate-float"
                style={{ left: x, top: y, '--delay': delay, '--duration': duration } as React.CSSProperties}
              >
                <div className="relative group">
                  <Icon size={size} className="text-primary-300/20 transition-all duration-300 group-hover:text-secondary-300/40" />
                  <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium text-white/30 opacity-0 transition-opacity group-hover:opacity-100">
                    {label}
                  </span>
                </div>
              </div>
            ))}

            {/* كرات ضبابية بألوان المشروع */}
            <div className="absolute left-1/4 top-1/4 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-secondary-500/10 blur-3xl animate-pulse-glow" />
            <div className="absolute bottom-1/4 right-1/4 h-48 w-48 rounded-full bg-primary-400/10 blur-3xl animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
            <div className="absolute left-1/3 bottom-1/3 h-36 w-36 rounded-full bg-primary-500/8 blur-3xl animate-pulse-glow" style={{ animationDelay: '3s' }} />

            {/* Content Card */}
            <div className="relative z-10 flex flex-1 items-center justify-center p-10">
              <div className="w-full max-w-lg animate-slide-up">
                {/* Logo */}
                <div className="mb-6">
                  <Image
                    src="https://www.rowwad.net/uploads/system/logo-light.png"
                    alt="شبكة الرواد الإلكترونية"
                    width={176}
                    height={64}
                    className="h-auto w-44"
                    unoptimized
                  />
                </div>

                {/* Badge */}
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary-400/15 bg-primary-400/8 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-secondary-300 backdrop-blur-sm">
                  <Database size={12} />
                  لوحة قيادة منظومة البيانات والأثر
                </div>

                <h1 className="text-3xl font-bold leading-tight text-white">
                  لوحة قيادة منظومة
                  <span className="bg-gradient-to-l from-secondary-300 to-primary-300 bg-clip-text text-transparent"> البيانات والأثر</span>
                </h1>

                <p className="mt-3 text-sm leading-7 text-white/60">
                  مراقبة شاملة للبيانات، التحليلات، والأداء الحي للمنصات والمبادرات لضمان جودة الأرشفة ودعم القرار — بألوان شبكة الرواد.
                </p>

                {/* بطاقة الاقتباس */}
                <div className="relative mt-6 overflow-hidden rounded-2xl border border-primary-400/10 bg-gradient-to-br from-primary-400/6 to-secondary-500/5 p-5 backdrop-blur-sm shadow-xl">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-secondary-500/10 via-transparent to-transparent pointer-events-none" />

                  <div className="relative">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary-500/20 text-secondary-300">
                        <Quote size={13} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-secondary-300/80">
                        مقولة اليوم
                      </span>
                    </div>
                    <blockquote>
                      <p className="text-base font-semibold leading-7 text-white">
                        &ldquo;{randomQuote.en}&rdquo;
                      </p>
                      <footer className="mt-2 text-xs text-white/50">
                        — {randomQuote.by}
                      </footer>
                      <div className="mt-3 border-t border-primary-400/10 pt-3">
                        <p className="text-xs leading-6 text-white/70">
                          {randomQuote.ar}
                        </p>
                      </div>
                    </blockquote>
                  </div>
                </div>

                {/* مؤشرات المشروع */}
                <div className="mt-6 flex items-center gap-6 text-xs text-white/40">
                  <span className="flex items-center gap-2">
                    <Blocks size={16} className="text-secondary-400/60" />
                    منصات متعددة
                  </span>
                  <span className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-secondary-400/60" />
                    تحليلات لحظية
                  </span>
                  <span className="flex items-center gap-2">
                    <FileText size={16} className="text-secondary-400/60" />
                    تقارير ذكية
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* ─── Left: Login Form ─── */}
          <main className="relative flex items-center justify-center px-4 py-8 sm:px-8 lg:px-12">
            <div className="w-full max-w-[460px]">
              {/* Mobile Logo */}
              <div className="mb-6 text-center lg:hidden">
                <div className="mx-auto mb-4 inline-flex rounded-xl bg-primary-900/60 p-3 shadow-lg backdrop-blur-sm ring-1 ring-primary-400/15">
                  <Image
                    src="https://www.rowwad.net/uploads/system/logo-light.png"
                    alt="شبكة الرواد الإلكترونية"
                    width={160}
                    height={58}
                    className="h-auto w-36 sm:w-40"
                    unoptimized
                  />
                </div>
              </div>

              {/* Mobile: الاقتباس */}
              <div className="mb-6 lg:hidden">
                <div className="rounded-xl border border-primary-400/10 bg-primary-900/30 p-3 sm:p-4 backdrop-blur-sm">
                  <div className="mb-2 flex items-center gap-2 text-secondary-300">
                    <Quote size={14} />
                    <span className="text-[11px] font-bold uppercase tracking-wider">مقولة اليوم</span>
                  </div>
                  <blockquote>
                    <p className="text-sm font-semibold leading-6 text-white/90">{randomQuote.en}</p>
                    <footer className="mt-1 text-[11px] text-white/50">— {randomQuote.by}</footer>
                  </blockquote>
                </div>
              </div>

              {/* Login Card */}
              <div className="animate-slide-up">
                <div className="rounded-2xl border border-primary-200/20 bg-white/95 p-5 sm:p-6 shadow-xl backdrop-blur-sm">
                  <div className="mb-5">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 text-primary-700 shadow-sm ring-1 ring-primary-200/50">
                      <LockKeyhole size={20} />
                    </div>
                    <h1 className="text-xl font-bold text-neutral-900">تسجيل الدخول</h1>
                    <p className="mt-1 text-sm leading-6 text-neutral-500">
                      ادخل إلى لوحة تحكم شبكة الرواد لإدارة المحتوى ومتابعة مؤشرات الأثر.
                    </p>
                  </div>

                  {DEMO_ACCOUNTS.length > 0 && (
                    <>
                      <div className="mb-5">
                        <div className="mb-3 flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-secondary-100 text-secondary-600">
                            <Sparkles size={12} />
                          </div>
                          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">دخول تجريبي بنقرة واحدة</span>
                        </div>

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
                                  <span className={`block text-[11px] sm:text-xs font-bold ${account.textColor}`}>
                                    {account.role}
                                  </span>
                                  <span className="mt-0.5 block text-[10px] text-neutral-500 leading-tight">
                                    {account.desc}
                                  </span>
                                </span>
                                <ArrowLeft size={14} className="shrink-0 text-neutral-400" />
                              </Button>
                            )
                          })}
                        </div>
                      </div>

                      {/* فاصل */}
                      <div className="mb-5 flex items-center gap-3">
                        <div className="h-px flex-1 bg-neutral-200" />
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">أو سجل دخولك يدوياً</span>
                        <div className="h-px flex-1 bg-neutral-200" />
                      </div>
                    </>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-neutral-700">
                        البريد الإلكتروني
                      </label>
                      <Input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input-field"
                        placeholder="email@example.com"
                        autoComplete="email"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-neutral-700">
                        كلمة المرور
                      </label>
                      <Input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input-field"
                        placeholder="••••••••"
                        autoComplete="current-password"
                      />
                    </div>

                    {error && (
                      <div className="rounded-xl bg-error-50 px-3 py-2 text-xs text-error-700 ring-1 ring-error-200" role="alert">
                        {error}
                      </div>
                    )}

                    <Button unstyled
                      type="submit"
                      disabled={loading || demoLoadingIdx !== null}
                      className="w-full rounded-2xl bg-gradient-to-l from-primary-600 to-primary-700 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary-600/20 transition-all duration-300 hover:shadow-xl hover:shadow-primary-600/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 size={16} className="animate-spin" />
                          جارٍ تسجيل الدخول...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          تسجيل الدخول
                          <ShieldCheck size={16} />
                        </span>
                      )}
                    </Button>
                  </form>

                  <div className="mt-5 grid grid-cols-3 gap-2 border-t border-neutral-200 pt-5 text-center">
                    {[
                      { icon: TreePine, label: 'نمو', desc: 'مؤشرات الأثر' },
                      { icon: BarChart3, label: 'تحليل', desc: 'البيانات والتقارير' },
                      { icon: ShieldCheck, label: 'حوكمة', desc: 'إدارة ورقابة' },
                    ].map(({ icon: Icon, label, desc }) => (
                      <div key={label} className="group rounded-xl bg-primary-50/60 px-2 py-3 ring-1 ring-primary-100 transition-all duration-300 hover:bg-primary-100 hover:shadow-sm">
                        <Icon className="mx-auto mb-1.5 h-5 w-5 text-primary-600 group-hover:text-primary-700 transition-colors" />
                        <span className="block text-xs font-bold text-primary-800">{label}</span>
                        <span className="text-[9px] text-primary-500/70">{desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* رابط العودة */}
                <div className="mt-4 text-center">
                  <Link href="/ar" className="inline-flex items-center gap-1.5 text-xs text-white/40 transition-colors hover:text-secondary-300">
                    <ArrowLeft size={12} />
                    العودة إلى الموقع الرئيسي
                  </Link>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  )
}
