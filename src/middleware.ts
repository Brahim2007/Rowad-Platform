import { auth } from '@/lib/auth'
import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

export default auth(async function middleware(req) {
  const { pathname } = req.nextUrl
  const isAdminPage = pathname.match(/^\/(ar)\/admin\//) && !pathname.includes('/admin/login')

  if (isAdminPage && !req.auth) {
    const locale = pathname.split('/')[1] || 'ar'
    const loginUrl = new URL(`/${locale}/admin/login`, req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const response = intlMiddleware(req)

  // Pass original pathname for SEO metadata in layout
  response.headers.set('x-pathname', pathname)

  return response
})

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
