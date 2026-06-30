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
import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  LayoutDashboard, FolderKanban, Blocks, Users, FileText, Shield,
  LogOut, Menu, TrendingUp, Activity, Star,
  Library, ClipboardList, CalendarCheck, ClipboardCheck, BookOpen,
  Medal, Settings, IdCard, UserCog,
} from 'lucide-react'

/** تبويبات لوحة أثر الرواد — الشريط العلوي الرئيسي */
const impactTabs = [
  { id: 'dashboard',   href: '/admin/impact',                        label: 'الرئيسية',       icon: Shield },
  { id: 'members',     href: '/admin/impact?tab=members',             label: 'الأعضاء',         icon: Users },
  { id: 'activities',  href: '/admin/impact?tab=activities',          label: 'الأنشطة',        icon: Activity },
  { id: 'pulse',       href: '/admin/impact?tab=pulse',               label: 'المتابعة',       icon: TrendingUp },
  { id: 'card',        href: '/admin/impact?tab=card',                label: 'بطاقة الرائد',    icon: IdCard },
  { id: 'rewards',     href: '/admin/impact?tab=rewards',             label: 'المكافآت',       icon: Medal },
  { id: 'reports',     href: '/admin/impact?tab=reports',             label: 'التقارير',       icon: ClipboardList },
  { id: 'settings',    href: '/admin/impact?tab=settings',            label: 'الإعدادات',       icon: Settings },
]

/** القائمة الجانبية — أدوات الإدارة المساندة */
const sidebarSections = [
  {
    title: 'إدارة المحتوى',
    links: [
      { href: '/admin/members',      label: 'الأعضاء والمستفيدون', icon: Users },
      { href: '/admin/platforms',    label: 'المنصات والبرامج',  icon: Blocks },
      { href: '/admin/projects',     label: 'المشاريع',           icon: FolderKanban },
      { href: '/admin/knowledge-library', label: 'المكتبة المعرفية', icon: Library },
      { href: '/admin/content',      label: 'صفحات المحتوى',       icon: FileText },
    ],
  },
  {
    title: 'المتابعة والتحليل',
    links: [
      { href: '/admin/analytics',        label: 'التحليلات والمؤشرات', icon: TrendingUp },
      { href: '/admin/evaluations',      label: 'التقييم وضمان الجودة', icon: ClipboardCheck },
      { href: '/admin/coordination',     label: 'التنسيق المؤسسي',     icon: CalendarCheck },
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

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [sidebarOpen, setSidebarOpen] = useState(false)

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

  if (isLoginPage) {
    return <>{children}</>
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-neutral-500">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  /** اكتشاف التبويب النشط */
  const currentTab = isImpactPage ? (searchParams.get('tab') || 'dashboard') : null

  function tabActive(id: string) {
    if (id === 'dashboard') return currentTab === 'dashboard'
    return currentTab === id
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex" dir="rtl">
      {/* ─── Sidebar ─── */}
      <aside className={`fixed inset-y-0 right-0 z-50 w-64 bg-white border-l border-neutral-200 transform transition-transform lg:translate-x-0 overflow-y-auto ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'} lg:relative`}>
        <div className="h-full flex flex-col">
          {/* Brand */}
          <div className="p-5 border-b border-neutral-100">
            <Link href="/admin/impact" className="no-underline">
              <div className="flex items-center gap-2">
                <Image
                  src="/images/Rowad-Logo.png"
                  alt="شبكة الرواد الإلكترونية"
                  width={138}
                  height={45}
                  className="h-auto w-28"
                  priority
                />
              </div>
              <p className="text-xs text-neutral-400 mt-1">لوحة التحكم</p>
            </Link>
          </div>

          {/* Impact quick link */}
          <div className="px-4 pt-4">
            <Link
              href="/admin/impact"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold bg-primary-600 text-white no-underline hover:bg-primary-700 transition-colors"
            >
              <Shield size={20} />
              <span>لوحة أثر الرواد</span>
              <Star size={14} className="mr-auto text-amber-300" />
            </Link>
          </div>

          {/* Sidebar sections */}
          <nav className="flex-1 p-4 space-y-5 overflow-y-auto">
            {sidebarSections.map(section => (
              <div key={section.title}>
                <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider px-4 mb-2">
                  {section.title}
                </p>
                <div className="space-y-0.5">
                  {section.links.map(({ href, label, icon: Icon }) => {
                    const active = pathname.startsWith(href)
                    return (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors no-underline ${
                          active
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-neutral-600 hover:bg-neutral-50'
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
          <div className="p-4 border-t border-neutral-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-primary-700 font-semibold text-sm">
                  {session?.user?.name?.[0] || 'أ'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">
                  {session?.user?.name || 'Admin'}
                </p>
                <p className="text-xs text-neutral-400 truncate">{session?.user?.email}</p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/ar/admin/login' })}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-neutral-600 hover:text-error-600 hover:bg-error-50 rounded-lg transition-colors"
            >
              <LogOut size={16} />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ─── Main ─── */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile header */}
        <header className="lg:hidden bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-neutral-600 hover:text-neutral-900"
            aria-label="فتح القائمة"
          >
            <Menu size={24} />
          </button>
          <span className="font-semibold text-neutral-900">لوحة أثر الرواد</span>
          <div className="w-10" />
        </header>

        {/* ─── شريط تبويبات لوحة الأثر (الأساسي) ─── */}
        <div className="bg-white border-b border-neutral-200 px-2 lg:px-4 flex-shrink-0 overflow-x-auto">
          <div className="flex gap-0.5 items-end max-w-7xl mx-auto">
            {impactTabs.map(tab => (
              <Link
                key={tab.id}
                href={tab.href}
                className={`flex items-center gap-1.5 px-3 lg:px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap no-underline ${
                  tabActive(tab.id)
                    ? 'border-primary-600 text-primary-600 bg-primary-50/50'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <tab.icon size={16} />
                <span className="hidden sm:inline">{tab.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* ─── محتوى الصفحة ─── */}
        <div className="flex-1 min-h-0">
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
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
      </div>
    }>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </Suspense>
  )
}
