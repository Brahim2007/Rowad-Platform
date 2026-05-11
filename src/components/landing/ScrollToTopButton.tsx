'use client'

import { ArrowUp } from 'lucide-react'

export default function ScrollToTopButton() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <button
      onClick={scrollToTop}
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-700 text-neutral-500 transition-all duration-200 hover:-translate-y-1 hover:border-primary-500 hover:bg-primary-500/10 hover:text-primary-400 hover:shadow-lg hover:shadow-primary-900/20"
      aria-label="العودة إلى الأعلى"
    >
      <ArrowUp size={18} />
    </button>
  )
}
