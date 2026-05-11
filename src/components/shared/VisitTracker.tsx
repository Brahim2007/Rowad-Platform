'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

function getVisitorId(): string {
  const KEY = 'rowad_visitor_id'
  let id = localStorage.getItem(KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(KEY, id)
  }
  return id
}

export default function VisitTracker() {
  const pathname = usePathname()
  const lastPath = useRef('')

  useEffect(() => {
    // Skip admin and internal paths
    if (pathname.includes('/admin/') || pathname.startsWith('/_next')) return

    // Avoid duplicate tracking of the same path
    if (pathname === lastPath.current) return
    lastPath.current = pathname

    const visitorId = getVisitorId()

    const data = {
      path: pathname,
      visitorId,
      referrer: document.referrer || undefined,
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
      language: navigator.language,
    }

    // Use sendBeacon for reliability on page unload
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
      navigator.sendBeacon('/api/track/visit', blob)
    } else {
      fetch('/api/track/visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        keepalive: true,
      }).catch(() => {
        // Silently fail — tracking is non-critical
      })
    }
  }, [pathname])

  return null
}
