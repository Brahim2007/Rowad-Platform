'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'
import AnnouncementBanner from './AnnouncementBanner'
import Image from 'next/image'
import { Link } from '@/i18n/routing'
import {
  ArrowLeft,
  BookOpen,
  FolderKanban,
  Home,
  Info,
  Layers,
  Lock,
  Mail,
  Menu,
  Users,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const navLinks = [
  { key: 'home', href: '/', icon: Home },
  { key: 'about', href: '/about', icon: Info },
  { key: 'platforms', href: '/platforms', icon: Layers },
  { key: 'projects', href: '/projects', icon: FolderKanban },
  { key: 'team', href: '/team', icon: Users },
  { key: 'guide', href: '/guide', icon: BookOpen },
  { key: 'contact', href: '/contact', icon: Mail },
] as const

export default function Navbar() {
  const t = useTranslations('navbar')
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const isHomePage = pathname === '/' || pathname === '/ar' || pathname === '/en'
  const floatingOnHero = isHomePage && !scrolled && !mobileOpen

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/' || pathname === '/ar' || pathname === '/en'
    return pathname.includes(href)
  }

  return (
    <>
      <AnnouncementBanner />
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        floatingOnHero
          ? 'border-b border-primary-100/90 bg-white/95 shadow-md shadow-primary-950/5 backdrop-blur-xl'
          : scrolled
          ? 'border-b border-neutral-200/80 bg-white/95 shadow-lg shadow-neutral-900/5 backdrop-blur-xl'
          : 'border-b border-transparent bg-white/80 backdrop-blur-sm'
      }`}
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between md:h-[72px]">
          <Link href="/" className="flex items-center gap-3 no-underline" aria-label="شبكة الرواد الإلكترونية">
            <Image
              src="/images/Rowad-Logo.png"
              alt="شبكة الرواد الإلكترونية"
              width={154}
              height={50}
              priority
              className="h-auto w-32 sm:w-36"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ key, href, icon: Icon }) => (
              <Link
                key={key}
                href={href}
                className={`relative inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 no-underline ${
                  isActive(href)
                    ? 'bg-primary-50 text-primary-700 shadow-sm ring-1 ring-primary-100'
                    : 'text-neutral-700 hover:bg-primary-50 hover:text-primary-700'
                }`}
              >
                <Icon size={16} />
                {t(key)}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button unstyled asChild size="sm" variant="default" className="hidden sm:inline-flex">
              <Link href="/contact" className="group no-underline">
                {t('contact')}
                <ArrowLeft size={16} className="rtl-flip transition-transform duration-200 group-hover:-translate-x-0.5" />
              </Link>
            </Button>
            <Button unstyled asChild size="sm" variant="outline" className="hidden sm:inline-flex border-primary-200 bg-white text-primary-700 hover:bg-primary-50">
              <Link href="/admin/login" className="no-underline">
                <Lock size={14} />
                دخول الإدارة
              </Link>
            </Button>
            <Button unstyled
              type="button"
              size="icon"
              variant="outline"
              className="md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="border-t border-neutral-200/80 bg-white/95 shadow-xl backdrop-blur-xl md:hidden">
          <div className="space-y-1 px-4 py-4">
            {navLinks.map(({ key, href, icon: Icon }) => (
              <Link
                key={key}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 no-underline ${
                  isActive(href)
                    ? 'bg-primary-50 text-primary-700 shadow-sm'
                    : 'text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <Icon size={18} />
                {t(key)}
              </Link>
            ))}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button unstyled asChild>
                <Link href="/contact" onClick={() => setMobileOpen(false)} className="no-underline">
                  {t('contact')}
                  <ArrowLeft size={16} className="rtl-flip" />
                </Link>
              </Button>
              <Button unstyled asChild variant="outline">
                <Link href="/admin/login" onClick={() => setMobileOpen(false)} className="no-underline">
                  <Lock size={16} />
                  دخول الإدارة
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
    </>
  )
}
