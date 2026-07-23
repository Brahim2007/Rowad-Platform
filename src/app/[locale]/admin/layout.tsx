'use client'

/**
 * لوحة الإدارة — التصميم الجديد المتمحور حول «لوحة أثر الرواد»
 *
 * شريط التبويبات العلوي = عناصر لوحة الأثر الأساسية
 * القائمة الجانبية = إدارة المحتوى والمنصات والمشاريع
 * /admin تُحوّل تلقائياً إلى /admin/impact
 */

import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense, type MouseEvent } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  FolderKanban, Blocks, Users, FileText, Shield,
  LogOut, Menu, TrendingUp, Activity, Star, BarChart3, Bot, CalendarDays, Search,
  ClipboardList, CalendarCheck, ClipboardCheck, BookOpen,
  Medal, Settings, IdCard, UserCog, Archive, Bell, BrainCircuit, PanelRightClose, PanelRightOpen,
} from 'lucide-react'
import { ThemeCustomizer } from '@/components/admin/ThemeCustomizer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

/** تبويبات لوحة أثر الرواد — الشريط العلوي الرئيسي */
const impactTabs = [
  { id: 'dashboard',   href: '/admin/impact',                        label: 'الرئيسية',       icon: Shield },
  { id: 'members',     href: '/admin/impact?tab=members',             label: 'الأعضاء',         icon: Users },
  { id: 'activities',  href: '/admin/impact?tab=activities',          label: 'الأنشطة',        icon: Activity },
  { id: 'pulse',       href: '/admin/impact?tab=pulse',               label: 'المتابعة',       icon: TrendingUp },
  { id: 'card',        href: '/admin/impact?tab=card',                label: 'بطاقة الرائد',    icon: IdCard },
  { id: 'rewards',     href: '/admin/impact?tab=rewards',             label: 'المكافآت',       icon: Medal },
  { id: 'reports',     href: '/admin/impact?tab=reports',             label: 'التقارير',       icon: ClipboardList },
  { id: 'platformAlerts', href: '/admin/platforms-overview',          label: 'تنبيهات المنصات', icon: Bell },
  { id: 'settings',    href: '/admin/impact?tab=settings',            label: 'الإعدادات',       icon: Settings },
]

/** القائمة الجانبية — أدوات الإدارة المساندة */
const sidebarSections = [
  {
    title: 'إدارة المحتوى',
    links: [
      { href: '/admin/platforms',    label: 'المنصات والبرامج',  icon: Blocks },
      { href: '/admin/projects',     label: 'المشاريع',           icon: FolderKanban },
      { href: '/admin/documents',     label: 'الأرشيف المؤسسي',  icon: Archive },
      { href: '/admin/content',      label: 'صفحات المحتوى',       icon: FileText },
    ],
  },
  {
    title: 'المتابعة والتحليل',
    links: [
      { href: '/admin/platforms-overview',   label: 'مركز متابعة المنصات', icon: BarChart3 },
      { href: '/admin/ai-governance',        label: 'التقييم والتقويم الذكي', icon: BrainCircuit },
      { href: '/admin/analytics',        label: 'التحليلات والمؤشرات', icon: TrendingUp },
      { href: '/admin/evaluations',      label: 'التقييم وضمان الجودة', icon: ClipboardCheck },
      { href: '/admin/coordination',     label: 'التنسيق المؤسسي',     icon: CalendarCheck },
      { href: '/admin/calendar',      label: 'تقويم الأنشطة',     icon: CalendarDays },
      { href: '/admin/activity-log',     label: 'سجل النشاط',         icon: Activity },
    ],
  },
  {
    title: 'أدوات',
    links: [
      { href: '/admin/users', label: 'مستخدمو النظام', icon: UserCog },
      { href: '/guide', label: 'دليل المستخدم', icon: BookOpen },
    ],
  },
]

/** جرس الإشعارات — يعرض في القائمة الجانبية */
function NotificationBell({ recipientType }: { recipientType: string }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let activeRequest: AbortController | null = null
    const refresh = () => {
      if (document.hidden || activeRequest) return
      activeRequest = new AbortController()
      fetch(`/api/notifications?type=${recipientType}&limit=99`, { signal: activeRequest.signal })
        .then(r => r.json())
        .then(d => { if (d.success) setCount(d.unreadCount || 0) })
        .catch(() => {})
        .finally(() => { activeRequest = null })
    }
    refresh()
    const id = setInterval(refresh, 60000)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', refresh)
      activeRequest?.abort()
    }
  }, [recipientType])
  return (
    <Link href="/admin/notifications" prefetch={false} className="relative p-1.5 text-neutral-500 hover:text-primary-600 transition-colors" title="الإشعارات">
      <Bell size={18} />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}

function SearchGlobal() {
  const router = useRouter()
  const [q, setQ] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (q.trim().length >= 2) router.push(`/ar/admin/search?q=${encodeURIComponent(q.trim())}`)
  }

  return (
    <form onSubmit={handleSearch} className="flex items-center gap-2">
      <Search size={16} className="text-neutral-400" />
      <Input
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="بحث سريع في الأعضاء والأنشطة والوثائق..."
        className="h-8 min-w-[300px] flex-1 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
        dir="rtl"
      />
      <Button unstyled type="submit" variant="ghost" size="sm" className="h-7 px-2 text-primary-700">بحث</Button>
    </form>
  )
}

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarHidden, setSidebarHidden] = useState(false)

  const isLoginPage = pathname.includes('/admin/login')
  const isImpactPage = pathname.includes('/admin/impact')

  // Redirect /admin to /admin/impact
  useEffect(() => {
    const cleanPath = pathname.replace(/^\/(ar|en)/, '')
    if (cleanPath === '/admin' || cleanPath === '/admin/') {
      const locale = pathname.startsWith('/en') ? 'en' : 'ar'
      router.replace(`/${locale}/admin/impact`)
    }
  }, [pathname, router])

  useEffect(() => {
    if (status === 'unauthenticated' && !isLoginPage) {
      router.push('/ar/admin/login')
    }
  }, [status, router, isLoginPage])

  useEffect(() => {
    setSidebarHidden(window.localStorage.getItem('admin-sidebar-hidden') === 'true')
  }, [])

  const toggleDesktopSidebar = () => {
    setSidebarHidden(current => {
      const next = !current
      window.localStorage.setItem('admin-sidebar-hidden', String(next))
      return next
    })
  }

  if (isLoginPage) {
    return <>{children}</>
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <Skeleton className="mx-auto size-12 rounded-full" />
          <Skeleton className="mx-auto mt-4 h-4 w-28" />
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  const userRole = (session?.user as any)?.role || 'EDITOR'
  const isSuperAdmin = userRole === 'SUPER_ADMIN'
  const isSystemManager = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN'
  const isPlatformManager = userRole === 'PLATFORM_MANAGER'
  const isEvaluator = userRole === 'EVALUATOR'

  /** القائمة الجانبية مع تصفية حسب الدور */
  const visibleSections = isEvaluator
    ? [{
        title: 'التقييم',
        links: [
          { href: '/admin/evaluations', label: 'تقييماتي المسندة', icon: ClipboardCheck },
        ],
      }]
    : isPlatformManager
    ? [
        // مدير المنصة يرى فقط العناصر المرتبطة بمنصته
        {
          title: 'منصتي',
          links: [
            { href: '/admin/my-platform',                   label: 'لوحة المنصة',     icon: Shield },
            { href: '/admin/my-platform?tab=members',       label: 'الأعضاء',         icon: Users },
            { href: '/admin/my-platform?tab=activities',    label: 'الأنشطة',        icon: Activity },
            { href: '/admin/analytics',                     label: 'تحليلات منصتي',  icon: TrendingUp },
            { href: '/admin/evaluations',                   label: 'تقييمات منصتي',  icon: ClipboardCheck },
            { href: '/admin/coordination',                  label: 'مهام منصتي',     icon: CalendarCheck },
            { href: '/admin/calendar',                      label: 'تقويم منصتي',    icon: CalendarDays },
          ],
        },
      ]
    : sidebarSections.map(section => {
        const links = section.links.filter(link => {
          if (link.href === '/admin/users') return isSuperAdmin
          if (link.href === '/admin/ai-governance') return isSystemManager
          if (userRole === 'EDITOR' && ['/admin/platforms-overview', '/admin/analytics', '/admin/evaluations', '/admin/coordination', '/admin/calendar', '/admin/activity-log'].includes(link.href)) return false
          return true
        })
        // إضافة رابط المساعد الذكي للإدارة العليا فقط
        if (section.title === 'أدوات' && isSuperAdmin) {
          return {
            ...section,
            links: [
              ...links,
              { href: '/admin/ai-assistant', label: 'المساعد الذكي', icon: Bot },
              { href: '/admin/impact/ai-reports', label: 'أرشيف التقارير الذكية', icon: Archive },
            ],
          }
        }
        return { ...section, links }
      })

  /** اكتشاف التبويب النشط */
  const currentTab = isImpactPage ? (pathname.includes('/admin/impact/ai-reports') ? 'reports' : (searchParams.get('tab') || 'dashboard')) : null

  function tabActive(id: string) {
    if (id === 'dashboard') return currentTab === 'dashboard'
    return currentTab === id
  }

  return (
    <div className="min-h-screen bg-neutral-100 flex text-neutral-900" dir="rtl" data-slot="admin-shell">
      {/* ─── Sidebar ─── */}
      <aside className={`fixed inset-y-0 right-0 z-50 w-72 border-l border-neutral-200 bg-white/95 shadow-xl shadow-neutral-950/5 backdrop-blur transform transition-transform lg:relative lg:translate-x-0 lg:shadow-none lg:transition-[width,border-color] lg:duration-300 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'} ${sidebarHidden ? 'lg:w-0 lg:border-transparent lg:overflow-hidden' : 'lg:w-72'} overflow-y-auto`}>
        <div className="h-full w-72 flex flex-col">
          {/* Brand */}
          <div className="p-5 border-b border-neutral-100 bg-gradient-to-l from-primary-50/80 to-white">
            <Link href="/admin/impact" prefetch={false} className="no-underline">
              <div className="flex items-center gap-3">
                <Image
                  src="/images/Rowad-Logo.png"
                  alt="شبكة الرواد الإلكترونية"
                  width={138}
                  height={45}
                  className="h-auto w-28"
                  priority
                />
              </div>
              <p className="text-xs font-semibold text-primary-700 mt-2">لوحة التحكم التشغيلية</p>
            </Link>
          </div>

          {/* Impact quick link — للإدارة فقط */}
          {!isPlatformManager && (
          <div className="px-4 pt-4">
            <Link
              href="/admin/impact"
              prefetch={false}
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-md text-sm font-bold bg-neutral-950 text-white no-underline hover:bg-primary-800 transition-colors"
            >
              <Shield size={20} />
              <span>لوحة أثر الرواد</span>
              <Star size={14} className="mr-auto text-amber-300" />
            </Link>
          </div>
          )}

          {/* Sidebar sections */}
          <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
            {visibleSections.map(section => (
              <div key={section.title}>
                <p className="text-[11px] font-bold text-neutral-400 px-4 mb-2">
                  {section.title}
                </p>
                <div className="space-y-1">
                  {section.links.map(({ href, label, icon: Icon }) => {
                    const active = pathname.startsWith(href)
                    return (
                      <Link
                        key={href}
                        href={href}
                        prefetch={false}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-semibold transition-colors no-underline ${
                          active
                            ? 'bg-primary-50 text-primary-800 ring-1 ring-primary-100'
                            : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950'
                        }`}
                      >
                        <Icon size={18} />
                        <span className="truncate">{label}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* User footer */}
          <div className="p-4 border-t border-neutral-100 bg-neutral-50/80">
            <div className="flex items-center gap-3 mb-3">
              <NotificationBell recipientType={isPlatformManager ? 'PLATFORM_MANAGER' : 'ADMIN'} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">
                  {session?.user?.name || 'Admin'}
                </p>
                <p className="text-xs text-neutral-400 truncate">{session?.user?.email}</p>
              </div>
            </div>
            <Button unstyled
              onClick={() => signOut({ callbackUrl: '/ar/admin/login' })}
              variant="ghost"
              className="w-full justify-start text-neutral-600 hover:bg-error-50 hover:text-error-700"
            >
              <LogOut size={16} />
              <span>تسجيل الخروج</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* ─── Main ─── */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile header */}
        <header className="lg:hidden bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <Button unstyled
            onClick={() => setSidebarOpen(true)}
            variant="ghost"
            size="icon"
            aria-label="فتح القائمة"
          >
            <Menu size={24} />
          </Button>
          <span className="font-semibold text-neutral-900">لوحة أثر الرواد</span>
          <ThemeCustomizer compact />
        </header>

        {/* شريط البحث السريع — سطح المكتب */}
        <div className="hidden lg:block sticky top-0 z-30 border-b border-neutral-200 bg-white/90 px-5 py-3 backdrop-blur flex-shrink-0">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                unstyled
                type="button"
                onClick={toggleDesktopSidebar}
                variant="ghost"
                size="icon"
                className="size-9 shrink-0 border border-neutral-200 bg-white text-neutral-600 shadow-sm hover:bg-primary-50 hover:text-primary-700"
                aria-label={sidebarHidden ? 'إظهار القائمة الجانبية' : 'إخفاء القائمة الجانبية'}
                aria-expanded={!sidebarHidden}
                title={sidebarHidden ? 'إظهار القائمة الجانبية' : 'إخفاء القائمة الجانبية'}
              >
                {sidebarHidden ? <PanelRightOpen size={19} /> : <PanelRightClose size={19} />}
              </Button>
              <div className="min-w-0">
                <p className="text-sm font-bold text-neutral-950">مركز التحكم</p>
                <p className="text-xs text-neutral-500">متابعة الأثر، المحتوى، والمنصات من مساحة واحدة</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="min-w-[420px] rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-1.5 shadow-sm">
                <SearchGlobal />
              </div>
              <ThemeCustomizer />
            </div>
          </div>
        </div>

        {/* ─── شريط تبويبات لوحة الأثر (للإدارة فقط) ─── */}
        {!isPlatformManager && !isEvaluator && (
        <div className="border-b border-neutral-200 bg-white px-2 lg:px-5 flex-shrink-0 overflow-x-auto">
          <div className="flex gap-0.5 items-end max-w-7xl mx-auto">
            {impactTabs
              .filter(tab => tab.id !== 'platformAlerts' || userRole === 'SUPER_ADMIN' || userRole === 'ADMIN')
              .map(tab => (
              <Link
                key={tab.id}
                href={tab.href}
                prefetch={false}
                onClick={(event: MouseEvent<HTMLAnchorElement>) => {
                  if (!tab.href.startsWith('/admin/impact') || !isImpactPage || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
                  event.preventDefault()
                  const locale = pathname.split('/')[1] || 'ar'
                  window.history.pushState(null, '', `/${locale}${tab.href}`)
                }}
                className={`cursor-pointer flex items-center gap-1.5 px-3 lg:px-4 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap no-underline ${
                  tabActive(tab.id)
                    ? 'border-primary-700 text-primary-800 bg-primary-50'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                <tab.icon size={16} />
                <span className="hidden sm:inline">{tab.label}</span>
              </Link>
            ))}
          </div>
        </div>
        )}

        {/* ─── محتوى الصفحة ─── */}
        <div className="flex-1 min-h-0 bg-neutral-100">
          {children}
        </div>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}

/** تصدير مع Suspense لأن useSearchParams يتطلب ذلك */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Skeleton className="mx-auto size-12 rounded-full" />
      </div>
    }>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </Suspense>
  )
}
