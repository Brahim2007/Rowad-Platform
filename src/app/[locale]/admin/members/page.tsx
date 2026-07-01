'use client'

/**
 * صفحة الأعضاء — تم توحيدها مع تبويب الأعضاء في لوحة الأثر.
 * هذه الصفحة تعيد التوجيه تلقائياً.
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function MembersRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/ar/admin/impact?tab=members')
  }, [router])

  return (
    <div className="flex items-center justify-center py-16">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
        <p className="mt-3 text-sm text-neutral-400">جاري التوجيه إلى لوحة الأثر...</p>
      </div>
    </div>
  )
}
