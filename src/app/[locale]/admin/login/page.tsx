'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { useEffect, useState } from 'react'
import { signIn } from 'next-auth/react'
import Image from 'next/image'
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
    en: 'Data is a precious thing and will last longer than the systems themselves.',
    by: 'Tim Berners-Lee',
    ar: 'البيانات شيء ثمين وستبقى أكثر من الأنظمة نفسها.',
  },
  {
    en: 'Numbers have an important story to tell. They rely on you to give them a clear and convincing voice.',
    by: 'Stephen Few',
    ar: 'الأرقام لديها قصة مهمة، لكنها تحتاجك لترويها بوضوح.',
  },
  {
    en: 'Garbage in, garbage out.',
    by: 'Computer Science principle',
    ar: 'مدخلات سيئة = نتائج سيئة.',
  },
  {
    en: 'Data quality is more important than data quantity.',
    by: 'Data science principle',
    ar: 'جودة البيانات أهم من كميتها.',
  },
  {
    en: 'Big data is at the foundation of all of the megatrends.',
    by: 'Chris Lynch',
    ar: 'البيانات الضخمة هي أساس كل الاتجاهات الكبرى.',
  },
]

// ─── Floating Icons Data ───

const floatingIcons = [
  { icon: Database, label: 'بيانات', x: '10%', y: '15%', size: 22, delay: '0s', duration: '6s' },
  { icon: BarChart3, label: 'تحليل', x: '80%', y: '20%', size: 20, delay: '1.5s', duration: '7s' },
  { icon: Activity, label: 'أداء', x: '15%', y: '70%', size: 24, delay: '0.8s', duration: '8s' },
  { icon: TrendingUp, label: 'نمو', x: '75%', y: '75%', size: 18, delay: '2.2s', duration: '5.5s' },
  { icon: Layers, label: 'تقارير', x: '85%', y: '45%', size: 20, delay: '3s', duration: '7.5s' },
  { icon: ShieldCheck, label: 'حوكمة', x: '5%', y: '45%', size: 16, delay: '1s', duration: '6.5s' },
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
    return params.get('callbackUrl') || '/ar/admin/dashboard'
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

      <div className="min-h-screen overflow-y-auto bg-gradient-to-br from-primary-950 via-primary-900 to-primary-950" dir="rtl">
        <div className="grid min-h-screen lg:grid-cols-[1fr_1fr]">
          {/* ─── Right: Brand Section ─── */}
          <section className="relative hidden overflow-hidden lg:flex lg:flex-col lg:min-h-screen">
            {/* Animated wave background */}
            <div className="absolute inset-0 opacity-[0.07]">
              <svg
                className="h-full w-full animate-wave"
                viewBox="0 0 1440 900"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="wave-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0.3" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,450 C240,350 480,550 720,450 C960,350 1200,550 1440,450 L1440,900 L0,900 Z"
                  fill="url(#wave-grad)"
                  opacity="0.15"
                />
                <path
                  d="M0,550 C240,450 480,650 720,550 C960,450 1200,650 1440,550 L1440,900 L0,900 Z"
                  fill="url(#wave-grad)"
                  opacity="0.1"
                />
              </svg>
            </div>

            {/* Floating Icons */}
            {floatingIcons.map(({ icon: Icon, label, x, y, size, delay, duration }) => (
              <div
                key={label}
                className="absolute animate-float text-white/20"
                style={{ left: x, top: y, '--delay': delay, '--duration': duration } as React.CSSProperties}
              >
                <div className="relative">
                  <Icon size={size} />
                  <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium opacity-0 transition-opacity group-hover:opacity-100">
                    {label}
                  </span>
                </div>
              </div>
            ))}

            {/* Glowing orbs */}
            <div className="absolute left-1/4 top-1/4 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-secondary-500/10 blur-3xl animate-pulse-glow" />
            <div className="absolute bottom-1/4 right-1/4 h-48 w-48 rounded-full bg-primary-400/10 blur-3xl animate-pulse-glow" style={{ animationDelay: '1.5s' }} />

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

                {/* Title */}
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-secondary-300 backdrop-blur-sm">
                  <Database size={12} />
                  لوحة قيادة منظومة البيانات
                </div>

                <h1 className="text-3xl font-bold leading-tight text-white">
                  لوحة قيادة منظومة البيانات
                </h1>

                <p className="mt-3 text-sm leading-7 text-white/60">
                  مراقبة شاملة للبيانات، التحليلات، والأداء الحي للمنصات والمبادرات لضمان جودة الأرشفة ودعم القرار.
                </p>

                {/* Single Random Quote Card */}
                <div className="relative mt-6 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-5 backdrop-blur-sm shadow-xl">
                  {/* Gradient border accent */}
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
                      <div className="mt-3 border-t border-white/10 pt-3">
                        <p className="text-xs leading-6 text-white/70">
                          {randomQuote.ar}
                        </p>
                      </div>
                    </blockquote>
                  </div>
                </div>

                {/* Bottom decorative items */}
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
          <main className="flex items-center justify-center px-4 py-8 sm:px-8 lg:px-12">
            <div className="w-full max-w-[460px]">
              {/* Mobile Logo */}
              <div className="mb-6 text-center lg:hidden">
                <div className="mx-auto mb-4 inline-flex rounded-xl bg-white/10 p-3 shadow-lg backdrop-blur-sm ring-1 ring-white/10">
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

              {/* Mobile: Single Random Quote */}
              <div className="mb-6 lg:hidden">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 sm:p-4 backdrop-blur-sm">
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
              <div className="rounded-xl border border-white/10 bg-white/95 p-5 sm:p-6 shadow-xl backdrop-blur-sm">
                <div className="mb-4">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 text-primary-700 shadow-sm">
                    <LockKeyhole size={18} />
                  </div>
                  <h1 className="text-xl font-bold text-neutral-900">تسجيل الدخول</h1>
                  <p className="mt-1 text-sm leading-6 text-neutral-500">
                    ادخل إلى لوحة تحكم شبكة الرواد لإدارة المحتوى ومتابعة مؤشرات الأثر.
                  </p>
                </div>

                {DEMO_ACCOUNTS.length > 0 && (
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
                )}

                {/* ===== فاصل ===== */}
                {DEMO_ACCOUNTS.length > 0 && <div className="mb-4 flex items-center gap-3">
                  <div className="h-px flex-1 bg-neutral-200" />
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">أو سجل دخولك يدوياً</span>
                  <div className="h-px flex-1 bg-neutral-200" />
                </div>}

                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-neutral-700">
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
                    <label className="mb-1 block text-sm font-semibold text-neutral-700">
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
                    className="btn-primary btn-md w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        جارٍ تسجيل الدخول...
                      </>
                    ) : (
                      <>
                        تسجيل الدخول
                        <ShieldCheck size={16} />
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-4 grid grid-cols-3 gap-1.5 sm:gap-2 border-t border-neutral-200 pt-4 text-center">
                  {[
                    { icon: Database, label: 'بيانات' },
                    { icon: BarChart3, label: 'تحليل' },
                    { icon: ShieldCheck, label: 'حوكمة' },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="rounded-xl bg-neutral-50/80 px-1 sm:px-2 py-2 ring-1 ring-neutral-100">
                      <Icon className="mx-auto mb-1 h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-700" />
                      <span className="text-[10px] sm:text-[11px] font-bold text-neutral-600">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  )
}
