'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  LayoutDashboard, FolderKanban, Blocks, Users, FileText,
  LogOut, Menu, ChevronLeft, TrendingUp,
  Library, ClipboardList, CalendarCheck, ClipboardCheck, Activity, BookOpen
} from 'lucide-react'

const sidebarLinks = [
  { href: '/admin/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { href: '/admin/members', label: 'الأعضاء', icon: Users },
  { href: '/admin/platforms', label: 'المنصات', icon: Blocks },
  { href: '/admin/projects', label: 'المشاريع', icon: FolderKanban },
  { href: '/admin/knowledge-library', label: 'المكتبة المعرفية', icon: Library },
  { href: '/admin/analytics', label: 'التحليلات', icon: TrendingUp },
  { href: '/admin/reports', label: 'التقارير', icon: ClipboardList },
  { href: '/admin/evaluations', label: 'التقييم', icon: ClipboardCheck },
  { href: '/admin/coordination', label: 'التنسيق', icon: CalendarCheck },
  { href: '/admin/activity-log', label: 'سجل النشاط', icon: Activity },
  { href: '/admin/content', label: 'المحتوى', icon: FileText },
  { href: '/guide', label: 'دليل المستخدم', icon: BookOpen },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isLoginPage = pathname.includes('/admin/login')

  useEffect(() => {
    if (status === 'unauthenticated' && !isLoginPage) {
      router.push('/ar/admin/login')
    }
  }, [status, router, isLoginPage])

  // Render login page standalone without admin layout
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

  return (
    <div className="min-h-screen bg-neutral-50 flex" dir="rtl">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 right-0 z-50 w-64 bg-white border-l border-neutral-200 transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'} lg:relative`}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <Image
                src="/images/Rowad-Logo.png"
                alt="شبكة الرواد الإلكترونية"
                width={138}
                height={45}
                className="h-auto w-32"
                priority
              />
            </div>
            <p className="text-xs text-neutral-400 mt-1">لوحة التحكم</p>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {sidebarLinks.map(({ href, label, icon: Icon }) => {
              const isActive = pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors no-underline ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  <Icon size={20} />
                  <span>{label}</span>
                  {isActive && <ChevronLeft size={16} className="mr-auto" />}
                </Link>
              )
            })}
          </nav>

          <div className="p-4 border-t border-neutral-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center">
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

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-neutral-600 hover:text-neutral-900"
            aria-label="فتح القائمة"
          >
            <Menu size={24} />
          </button>
          <span className="font-semibold text-neutral-900">لوحة التحكم</span>
          <div className="w-10" />
        </header>

        {children}
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
