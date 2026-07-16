'use client'

import { Button } from '@/components/ui/button'

import { useEffect, useState } from 'react'
import { Megaphone, X } from 'lucide-react'

interface BannerData {
  id: string; text: string; link?: string; bgColor?: string; textColor?: string; isActive: boolean
}

// Simple localStorage-based dismissal
function getDismissedBanners(): string[] {
  try { return JSON.parse(localStorage.getItem('dismissed_banners') || '[]') } catch { return [] }
}

function dismissBanner(id: string) {
  const list = getDismissedBanners()
  if (!list.includes(id)) { list.push(id); localStorage.setItem('dismissed_banners', JSON.stringify(list)) }
}

export default function AnnouncementBanner() {
  const [banner, setBanner] = useState<BannerData | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    fetch('/api/content/announcement').then(r => r.json()).then(json => {
      if (json.success && json.data) {
        const dismissedIds = getDismissedBanners()
        if (!dismissedIds.includes(json.data.id)) setBanner(json.data)
      }
    }).catch(() => {})
  }, [])

  if (!banner || dismissed) return null

  return (
    <div
      className="text-center py-2 px-4 text-sm relative"
      style={{ backgroundColor: banner.bgColor || '#fef3c7', color: banner.textColor || '#92400e' }}
    >
      <span className="inline-flex items-center gap-1.5">
        <Megaphone size={14} />
        {banner.link ? (
          <a href={banner.link} className="hover:underline font-semibold" target={banner.link.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">
            {banner.text}
          </a>
        ) : (
          <span className="font-semibold">{banner.text}</span>
        )}
      </span>
      <Button unstyled
        onClick={() => { dismissBanner(banner.id); setDismissed(true) }}
        className="absolute left-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-black/10 rounded"
        aria-label="إغلاق"
      >
        <X size={14} />
      </Button>
    </div>
  )
}
