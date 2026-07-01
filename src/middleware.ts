import { auth } from '@/lib/auth'
import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

export default auth(async function middleware(req) {
  const { pathname } = req.nextUrl
  const locale = pathname.split('/')[1] || 'ar'

  const isAdminPage = pathname.match(/^\/(ar|en)\/admin\//) && !pathname.includes('/admin/login')
  const isPlatformManagerPage = pathname.match(/^\/(ar|en)\/admin\/my-platform/)
  const isMemberPage = pathname.match(/^\/(ar|en)\/member\//) && !pathname.includes('/member/login')

  // الصفحات الإدارية — تتطلب جلسة NextAuth
  if (isAdminPage && !req.auth) {
    const loginUrl = new URL(`/${locale}/admin/login`, req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // صفحات الأعضاء — تتطلب member_token كوكي
  if (isMemberPage) {
    const memberToken = req.cookies.get('member_token')?.value
    if (!memberToken) {
      const loginUrl = new URL(`/${locale}/member/login`, req.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // توجيه مدراء المنصات — لا يدخلون /admin/* العامة
  if (req.auth && isAdminPage && !isPlatformManagerPage) {
    const role = (req.auth.user as any)?.role
    if (role === 'PLATFORM_MANAGER') {
      return NextResponse.redirect(new URL(`/${locale}/admin/my-platform`, req.url))
    }
  }

  const response = intlMiddleware(req)

  // Pass original pathname for SEO metadata in layout
  response.headers.set('x-pathname', pathname)

  return response
})

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
