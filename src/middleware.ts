import { auth } from '@/lib/auth'
import createMiddleware from 'next-intl/middleware'
import { NextResponse } from 'next/server'
import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

function createNonce() {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return btoa(String.fromCharCode(...bytes))
}

function buildCsp(nonce: string) {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://res.cloudinary.com https://www.rowwad.net https://images.unsplash.com",
    "font-src 'self'",
    "connect-src 'self' https://generativelanguage.googleapis.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')
}

export default auth(async function middleware(req) {
  const { pathname } = req.nextUrl
  const locale = pathname.split('/')[1] || 'ar'
  const nonce = createNonce()
  const csp = buildCsp(nonce)
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-nonce', nonce)

  const isAdminPage = pathname.match(/^\/(ar|en)\/admin\//) && !pathname.includes('/admin/login')
  const isAdminApi = pathname.startsWith('/api/admin/')
  const isPlatformManagerPage = pathname.match(/^\/(ar|en)\/admin\/my-platform/)
  const isPlatformManagerOperationalPage = pathname.match(/^\/(ar|en)\/admin\/(analytics|evaluations|coordination|calendar)(\/|$)/)
  const isEvaluatorPage = pathname.match(/^\/(ar|en)\/admin\/evaluations(\/|$)/)
  const isRestrictedOperationalPage = pathname.match(/^\/(ar|en)\/admin\/(platforms-overview|analytics|evaluations|coordination|calendar|activity-log)(\/|$)/)
  const isMemberPage = pathname.match(/^\/(ar|en)\/member\//) && !pathname.includes('/member/login')
  const hasAdminSession = Boolean(req.auth)

  // واجهات API الإدارية — تتطلب جلسة، وتُرجع JSON بدلاً من إعادة توجيه.
  if (isAdminApi && !hasAdminSession) {
    const response = NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })
    response.headers.set('Content-Security-Policy', csp)
    return response
  }
  if (isAdminApi) {
    const response = NextResponse.next({ request: { headers: requestHeaders } })
    response.headers.set('Content-Security-Policy', csp)
    return response
  }

  // الصفحات الإدارية — تتطلب جلسة NextAuth
  if (isAdminPage && !hasAdminSession) {
    const loginUrl = new URL(`/${locale}/admin/login`, req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    const response = NextResponse.redirect(loginUrl)
    response.headers.set('Content-Security-Policy', csp)
    return response
  }

  // صفحات الأعضاء — تتطلب member_token كوكي
  if (isMemberPage) {
    const memberToken = req.cookies.get('member_token')?.value
    if (!memberToken) {
      const loginUrl = new URL(`/${locale}/member/login`, req.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      const response = NextResponse.redirect(loginUrl)
      response.headers.set('Content-Security-Policy', csp)
      return response
    }
  }

  // توجيه مدراء المنصات — لا يدخلون /admin/* العامة
  if (hasAdminSession && isAdminPage) {
    const role = (req.auth?.user as { role?: string } | undefined)?.role
    if (role === 'PLATFORM_MANAGER' && !isPlatformManagerPage && !isPlatformManagerOperationalPage) {
      const response = NextResponse.redirect(new URL(`/${locale}/admin/my-platform`, req.url))
      response.headers.set('Content-Security-Policy', csp)
      return response
    }
    if (role === 'EVALUATOR' && !isEvaluatorPage) {
      const response = NextResponse.redirect(new URL(`/${locale}/admin/evaluations`, req.url))
      response.headers.set('Content-Security-Policy', csp)
      return response
    }
    if (role === 'EDITOR' && isRestrictedOperationalPage) {
      const response = NextResponse.redirect(new URL(`/${locale}/admin/content`, req.url))
      response.headers.set('Content-Security-Policy', csp)
      return response
    }
  }

  const response = intlMiddleware(req)

  // Pass original pathname for SEO metadata in layout
  response.headers.set('x-pathname', pathname)
  response.headers.set('Content-Security-Policy', csp)

  return response
})

export const config = {
  matcher: ['/api/admin/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
}
