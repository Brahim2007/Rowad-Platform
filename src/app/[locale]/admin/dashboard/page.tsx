'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function AdminDashboardRedirect() {
  const router = useRouter()
  const params = useParams<{ locale: string }>()

  useEffect(() => {
    router.replace(`/${params?.locale || 'ar'}/admin/impact`)
  }, [router, params])

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        <p className="mt-4 text-sm text-neutral-500">جاري التوجيه إلى لوحة الأثر...</p>
      </div>
    </div>
  )
}
