'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, LogIn } from 'lucide-react'

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
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Shield className="mx-auto text-primary-600" size={48} />
          <h1 className="text-2xl font-bold text-neutral-900 mt-4">بوابة العضو</h1>
          <p className="text-neutral-500 mt-1">شبكة رواد الإلكترونية</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1">البريد الإلكتروني</label>
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
              <label className="block text-sm font-semibold text-neutral-700 mb-1">كلمة المرور</label>
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
              className="w-full btn-primary flex items-center justify-center gap-2 py-3"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <LogIn size={18} />
              )}
              {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
