'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, LogIn, ArrowLeft, TreePine, Users } from 'lucide-react'

export default function MemberLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/member/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (data.success) {
        if (data.data.member.mustChangePassword) {
          router.push('/ar/member?tab=profile')
        } else {
          router.push('/ar/member')
        }
      } else {
        setError(data.message || 'فشل تسجيل الدخول')
      }
    } catch {
      setError('فشل الاتصال بالخادم')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-primary-950 via-primary-900 to-neutral-950 flex items-center justify-center p-4" dir="rtl">
      {/* خلفية بنمط هندسي */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
        <svg className="h-full w-full" viewBox="0 0 1440 900" preserveAspectRatio="none">
          <defs>
            <pattern id="member-login-grid" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#member-login-grid)" />
        </svg>
      </div>
      {/* كرات ضبابية */}
      <div className="absolute -left-20 top-1/3 h-64 w-64 rounded-full bg-secondary-500/10 blur-3xl animate-pulse-glow" />
      <div className="absolute -right-20 bottom-1/4 h-48 w-48 rounded-full bg-primary-400/10 blur-3xl animate-pulse-glow" style={{ animationDelay: '2s' }} />

      <style>{`
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
        .animate-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
      `}</style>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 shadow-lg shadow-primary-600/20 ring-1 ring-primary-400/20">
            <Shield className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white">بوابة العضو</h1>
          <p className="text-primary-200/70 mt-2 text-sm">شبكة الرواد الإلكترونية</p>
        </div>

        <div className="rounded-2xl border border-primary-200/10 bg-white/95 p-6 shadow-xl backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-error-50 px-4 py-3 text-sm text-error-700 ring-1 ring-error-200">
                <Shield size={14} className="shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-neutral-700">البريد الإلكتروني</label>
              <Input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-field"
                placeholder="email@example.com"
                dir="ltr"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-neutral-700">كلمة المرور</label>
              <Input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                dir="ltr"
              />
            </div>

            <Button unstyled
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-l from-primary-600 to-primary-700 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary-600/20 transition-all duration-300 hover:shadow-xl hover:shadow-primary-600/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <LogIn size={18} />
              )}
              {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-between border-t border-neutral-100 pt-5">
            <Link href="/ar" className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 transition-colors hover:text-primary-600">
              <ArrowLeft size={12} />
              العودة للرئيسية
            </Link>
            <div className="flex items-center gap-3 text-[10px] text-neutral-400">
              <span className="flex items-center gap-1"><TreePine size={11} className="text-primary-500" /> رواد</span>
              <span className="flex items-center gap-1"><Users size={11} className="text-secondary-500" /> شباب</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
