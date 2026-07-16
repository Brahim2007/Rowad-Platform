import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { Inter, IBM_Plex_Mono, IBM_Plex_Sans_Arabic } from 'next/font/google'
import { Toaster } from 'sonner'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import Providers from '@/components/shared/Providers'
import VisitTracker from '@/components/shared/VisitTracker'
import { DirectionProvider } from '@/components/ui/direction'
import '@/app/globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
})

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  weight: ['400', '600', '700'],
  subsets: ['arabic'],
  variable: '--font-ibm-plex-arabic',
  display: 'swap',
})

export const dynamic = 'force-dynamic'

const ROUTE_META: Record<string, { title: string; desc: string }> = {
  '/': { title: 'شبكة الرواد الإلكترونية', desc: 'منصة رقمية لتمكين الشباب العربي - شبكة الرواد الإلكترونية' },
  '/about': { title: 'عن الشبكة - شبكة الرواد الإلكترونية', desc: 'تعرف على شبكة الرواد الإلكترونية، رؤيتنا ورسالتنا وقيمنا التي تجمع الشباب العربي' },
  '/platforms': { title: 'المنصات - شبكة الرواد الإلكترونية', desc: 'استعرض منصات شبكة الرواد الإلكترونية: التعليم الرقمي، التطوع التقني، الإعلام الشبابي، وريادة الأعمال' },
  '/projects': { title: 'المشاريع - شبكة الرواد الإلكترونية', desc: 'تصفح مشاريع شبكة الرواد الإلكترونية في التقنية، التعليم، الثقافة، والفعاليات' },
  '/team': { title: 'فريق العمل - شبكة الرواد الإلكترونية', desc: 'تعرف على فريق شبكة الرواد الإلكترونية وإدارة المنصة' },
  '/contact': { title: 'اتصل بنا - شبكة الرواد الإلكترونية', desc: 'تواصل مع شبكة الرواد الإلكترونية عبر نموذج الاتصال أو البريد الإلكتروني' },
  '/guide': { title: 'دليل المستخدم - شبكة الرواد الإلكترونية', desc: 'الدليل الشامل لاستخدام منظومة شبكة الرواد الإلكترونية: لوحة القيادة، إدارة الأعضاء، رحلة المستفيد، مؤشرات الأداء، والمزيد' },
  '/admin': { title: 'لوحة الإدارة - شبكة الرواد الإلكترونية', desc: 'لوحة إدارة شبكة الرواد الإلكترونية' },
}

export async function generateMetadata({ params: _params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''

  // Strip locale prefix to get route key
  const route = '/' + pathname.replace(/^\/(ar)\/?/, '')

  // Find best match: exact first, then prefix for dynamic routes
  let meta = ROUTE_META[route]
  if (!meta) {
    // Handle dynamic routes (e.g. /platforms/slug, /projects/id, /admin/*)
    if (route.startsWith('/platforms/')) {
      meta = ROUTE_META['/platforms']
    } else if (route.startsWith('/projects/')) {
      meta = ROUTE_META['/projects']
    } else if (route.startsWith('/admin/')) {
      meta = ROUTE_META['/admin']
    } else if (route === '/about' || route.startsWith('/about')) {
      meta = ROUTE_META['/about']
    } else if (route === '/guide') {
      meta = ROUTE_META['/guide']
    } else {
      meta = ROUTE_META['/']
    }
  }

  return {
    title: meta.title,
    description: meta.desc,
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const messages = await getMessages()

  return (
    <html
      lang={locale}
      dir="rtl"
      className={`${inter.variable} ${ibmPlexMono.variable} ${ibmPlexArabic.variable}`}
    >
      <body>
        <NextIntlClientProvider messages={messages}>
          <DirectionProvider direction="rtl">
            <Providers>
              {children}
              <Toaster position="top-left" richColors />
            </Providers>
          </DirectionProvider>
          <VisitTracker />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
