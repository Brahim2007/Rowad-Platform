# التهيئة التقنية (Technical Configuration)
## Tailwind, i18n, و إعدادات أخرى

---

## 1. تهيئة Tailwind CSS

ضع هذا الملف في `tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.5rem',
        md: '2rem',
        lg: '2.5rem',
        xl: '3rem',
      },
      screens: {
        '2xl': '1280px',
      },
    },
    extend: {
      colors: {
        primary: {
          50:  '#F2F7F1',
          100: '#DEEADC',
          200: '#BFD5BA',
          300: '#95B98C',
          400: '#6E9C62',
          500: '#527F47',
          600: '#3F6336',
          700: '#324E2C',
          800: '#283E24',
          900: '#20321E',
          950: '#101A0F',
        },
        secondary: {
          50:  '#FBF7F0',
          100: '#F4ECD6',
          200: '#E8D5A8',
          300: '#D9B872',
          400: '#CB9D4A',
          500: '#B8853A',
          600: '#9B6E2F',
          700: '#7C5728',
          800: '#634626',
          900: '#503923',
        },
        neutral: {
          50:  '#FAFAF9',
          100: '#F5F4F1',
          200: '#E8E6E0',
          300: '#D4D1C8',
          400: '#A8A496',
          500: '#7C7868',
          600: '#5C5849',
          700: '#45423A',
          800: '#2D2B26',
          900: '#1A1916',
          950: '#0F0E0C',
        },
        success: {
          50: '#F0FDF4',
          500: '#22C55E',
          700: '#15803D',
        },
        warning: {
          50: '#FFFBEB',
          500: '#F59E0B',
          700: '#B45309',
        },
        error: {
          50: '#FEF2F2',
          500: '#EF4444',
          700: '#B91C1C',
        },
        info: {
          50: '#EFF6FF',
          500: '#3B82F6',
          700: '#1D4ED8',
        },
      },
      fontFamily: {
        arabic: ['var(--font-ibm-plex-arabic)', 'system-ui', 'sans-serif'],
        english: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-ibm-plex-mono)', 'monospace'],
      },
      fontSize: {
        'display-2xl': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-xl':  ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-lg':  ['3rem', { lineHeight: '1.15', letterSpacing: '-0.01em' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'glow-primary': '0 0 30px -5px rgb(82 127 71 / 0.4)',
        'glow-secondary': '0 0 30px -5px rgb(184 133 58 / 0.4)',
        'card-hover': '0 12px 24px -8px rgb(0 0 0 / 0.12)',
        'soft': '0 2px 8px -2px rgb(0 0 0 / 0.06)',
      },
      animation: {
        'fade-in': 'fadeIn 400ms ease-out',
        'fade-in-up': 'fadeInUp 500ms ease-out',
        'fade-in-down': 'fadeInDown 500ms ease-out',
        'slide-in-from-end': 'slideInFromEnd 300ms ease-out',
        'scale-in': 'scaleIn 200ms ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-subtle': 'bounceSubtle 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInFromEnd: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #527F47 0%, #324E2C 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #B8853A 0%, #7C5728 100%)',
        'gradient-soft': 'linear-gradient(135deg, #F2F7F1 0%, #FBF7F0 100%)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'pattern-mosaic': "url('/patterns/mosaic.svg')",
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('tailwindcss-animate'),
    require('tailwindcss-rtl'),
  ],
}

export default config
```

---

## 2. Globals CSS

ضع في `src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ═══════════════════════════════════════════════════════ */
/* الخطوط */
/* ═══════════════════════════════════════════════════════ */

@font-face {
  font-family: 'IBM Plex Sans Arabic';
  src: url('/fonts/IBMPlexSansArabic-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'IBM Plex Sans Arabic';
  src: url('/fonts/IBMPlexSansArabic-Medium.woff2') format('woff2');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'IBM Plex Sans Arabic';
  src: url('/fonts/IBMPlexSansArabic-SemiBold.woff2') format('woff2');
  font-weight: 600;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'IBM Plex Sans Arabic';
  src: url('/fonts/IBMPlexSansArabic-Bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

/* ═══════════════════════════════════════════════════════ */
/* CSS Variables */
/* ═══════════════════════════════════════════════════════ */

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 28 9% 9%;
    --card: 0 0% 100%;
    --card-foreground: 28 9% 9%;
    --primary: 110 28% 39%;
    --primary-foreground: 0 0% 100%;
    --secondary: 35 52% 47%;
    --secondary-foreground: 0 0% 100%;
    --muted: 30 9% 96%;
    --muted-foreground: 32 11% 46%;
    --border: 30 12% 89%;
    --input: 30 12% 89%;
    --ring: 110 28% 39%;
  }
}

/* ═══════════════════════════════════════════════════════ */
/* الأساسيات */
/* ═══════════════════════════════════════════════════════ */

@layer base {
  * {
    @apply border-neutral-200;
  }
  
  html {
    scroll-behavior: smooth;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  html[lang="ar"] body {
    @apply font-arabic;
    line-height: 1.7;
  }
  
  html[lang="en"] body {
    @apply font-english;
    line-height: 1.6;
  }
  
  body {
    @apply bg-white text-neutral-900;
  }
  
  /* تحسين القراءة العربية */
  html[dir="rtl"] {
    text-align: start;
  }
  
  /* العناوين */
  h1, h2, h3, h4, h5, h6 {
    @apply font-semibold tracking-tight;
  }
  
  /* الروابط */
  a {
    @apply transition-colors duration-200;
  }
  
  /* تحديد النص */
  ::selection {
    @apply bg-primary-200 text-primary-900;
  }
  
  /* شريط التمرير */
  ::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }
  
  ::-webkit-scrollbar-track {
    @apply bg-neutral-100;
  }
  
  ::-webkit-scrollbar-thumb {
    @apply bg-neutral-400 rounded-full hover:bg-neutral-500;
  }
}

/* ═══════════════════════════════════════════════════════ */
/* مكونات مخصصة */
/* ═══════════════════════════════════════════════════════ */

@layer components {
  /* الحاوية الرئيسية */
  .container-app {
    @apply mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl;
  }
  
  /* أزرار */
  .btn {
    @apply inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed;
  }
  
  .btn-primary {
    @apply btn bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white shadow-md hover:shadow-lg focus:ring-primary-200;
  }
  
  .btn-secondary {
    @apply btn bg-secondary-500 hover:bg-secondary-600 text-white shadow-md focus:ring-secondary-200;
  }
  
  .btn-outline {
    @apply btn bg-transparent border-2 border-primary-600 text-primary-700 hover:bg-primary-50 focus:ring-primary-200;
  }
  
  .btn-ghost {
    @apply btn bg-transparent text-neutral-700 hover:bg-neutral-100 focus:ring-neutral-200;
  }
  
  .btn-sm { @apply px-4 py-2 text-sm; }
  .btn-md { @apply px-6 py-3 text-base; }
  .btn-lg { @apply px-8 py-4 text-lg; }
  .btn-xl { @apply px-10 py-5 text-xl; }
  
  /* حقول الإدخال */
  .input-field {
    @apply w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-colors duration-200 disabled:bg-neutral-50 disabled:text-neutral-500;
  }
  
  .input-field-error {
    @apply border-error-500 focus:border-error-500 focus:ring-error-100;
  }
  
  /* بطاقات */
  .card {
    @apply bg-white border border-neutral-200 rounded-xl p-6 shadow-sm transition-shadow duration-200;
  }
  
  .card-hover {
    @apply hover:shadow-md hover:border-neutral-300 cursor-pointer;
  }
  
  /* علامات */
  .badge {
    @apply inline-flex items-center px-3 py-1 rounded-full text-xs font-medium;
  }
  
  .badge-primary { @apply badge bg-primary-100 text-primary-800; }
  .badge-secondary { @apply badge bg-secondary-100 text-secondary-800; }
  .badge-success { @apply badge bg-success-50 text-success-700; }
  .badge-warning { @apply badge bg-warning-50 text-warning-700; }
  .badge-error { @apply badge bg-error-50 text-error-700; }
  .badge-info { @apply badge bg-info-50 text-info-700; }
  
  /* عناوين الأقسام */
  .section-title {
    @apply text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 tracking-tight;
  }
  
  .section-subtitle {
    @apply text-lg md:text-xl text-neutral-600 mt-4 max-w-3xl mx-auto;
  }
  
  /* الحاوية مع padding للأقسام */
  .section-padding {
    @apply py-16 md:py-20 lg:py-24;
  }
}

/* ═══════════════════════════════════════════════════════ */
/* Utilities */
/* ═══════════════════════════════════════════════════════ */

@layer utilities {
  /* قطع النص */
  .text-balance {
    text-wrap: balance;
  }
  
  .text-pretty {
    text-wrap: pretty;
  }
  
  /* إخفاء scrollbar */
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
}

/* ═══════════════════════════════════════════════════════ */
/* RTL خصائص */
/* ═══════════════════════════════════════════════════════ */

[dir="rtl"] .rtl-flip {
  transform: scaleX(-1);
}

[dir="rtl"] .rtl-rotate-180 {
  transform: rotate(180deg);
}
```

---

## 3. تهيئة الخطوط في Layout

ضع في `src/app/[locale]/layout.tsx`:

```typescript
import { Inter, IBM_Plex_Mono } from 'next/font/google'
import localFont from 'next/font/local'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
})

const ibmPlexArabic = localFont({
  src: [
    {
      path: '../../../public/fonts/IBMPlexSansArabic-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../../public/fonts/IBMPlexSansArabic-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../../public/fonts/IBMPlexSansArabic-SemiBold.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../../public/fonts/IBMPlexSansArabic-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-ibm-plex-arabic',
  display: 'swap',
})

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const dir = locale === 'ar' ? 'rtl' : 'ltr'
  
  return (
    <html 
      lang={locale} 
      dir={dir}
      className={`${inter.variable} ${ibmPlexMono.variable} ${ibmPlexArabic.variable}`}
    >
      <body>{children}</body>
    </html>
  )
}
```

---

## 4. تهيئة i18n (next-intl)

### ملف `src/i18n/routing.ts`
```typescript
import { defineRouting } from 'next-intl/routing'
import { createSharedPathnamesNavigation } from 'next-intl/navigation'

export const routing = defineRouting({
  locales: ['ar', 'en'],
  defaultLocale: 'ar',
  localePrefix: 'always',
})

export const { Link, redirect, usePathname, useRouter } = 
  createSharedPathnamesNavigation(routing)
```

### ملف `src/i18n/request.ts`
```typescript
import { getRequestConfig } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale
  
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale
  }
  
  return {
    locale,
    messages: (await import(`../../public/locales/${locale}.json`)).default,
  }
})
```

### ملف `src/middleware.ts`
```typescript
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

export default createMiddleware(routing)

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
```

### ملف `next.config.ts`
```typescript
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { hostname: 'res.cloudinary.com' },
    ],
  },
  
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
    ]
  },
}

export default withNextIntl(nextConfig)
```

---

## 5. ملفات الترجمة

### `public/locales/ar.json`
```json
{
  "common": {
    "joinUs": "انضم إلينا",
    "learnMore": "اعرف المزيد",
    "submit": "إرسال",
    "next": "التالي",
    "previous": "السابق",
    "save": "حفظ",
    "cancel": "إلغاء",
    "loading": "جاري التحميل...",
    "required": "مطلوب",
    "optional": "اختياري"
  },
  "navbar": {
    "home": "الرئيسية",
    "about": "عن الشبكة",
    "projects": "المشاريع",
    "team": "الفريق",
    "contact": "تواصل معنا"
  },
  "hero": {
    "title": "شبكة الرواد الإلكترونية",
    "subtitle": "منصة رقمية لتمكين الشباب العربي",
    "description": "شبكة الرواد الإلكترونية منصة شبابية تهدف إلى بناء مجتمع رقمي يربط الشباب العربي ويمكّنهم من المساهمة في تطوير منطقتهم.",
    "cta": "اكتشف المزيد"
  },
  "footer": {
    "rights": "جميع الحقوق محفوظة © 2026 شبكة الرواد الإلكترونية"
  }
}
```

### `public/locales/en.json`
نسخة إنجليزية مماثلة بنفس البنية.

---
```

## 6. متغيرات البيئة (.env.example)

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/rowad_db"
DIRECT_DATABASE_URL="postgresql://user:password@localhost:5432/rowad_db"

# NextAuth
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"

# File Storage (Cloudinary) - اختياري
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

---

## 7. package.json (Dependencies الرئيسية)

```json
{
  "name": "rowad-platform",
  "version": "0.1.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "db:migrate": "prisma migrate dev",
    "db:deploy": "prisma migrate deploy",
    "db:studio": "prisma studio",
    "db:seed": "tsx prisma/seed.ts"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.9.0",
    "@prisma/client": "^5.20.0",
    "@radix-ui/react-checkbox": "^1.1.0",
    "@radix-ui/react-dialog": "^1.1.0",
    "@radix-ui/react-label": "^2.1.0",
    "@radix-ui/react-progress": "^1.1.0",
    "@radix-ui/react-radio-group": "^1.2.0",
    "@radix-ui/react-select": "^2.1.0",
    "@radix-ui/react-toast": "^1.2.0",
    "@upstash/ratelimit": "^2.0.0",
    "@upstash/redis": "^1.34.0",
    "bcryptjs": "^2.4.3",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "date-fns": "^3.6.0",
    "framer-motion": "^11.5.0",
    "lucide-react": "^0.445.0",
    "next": "^15.0.0",
    "next-auth": "^5.0.0-beta",
    "next-intl": "^3.20.0",
    "pino": "^9.4.0",
    "react": "^19.0.0",
    "react-day-picker": "^9.0.0",
    "react-dom": "^19.0.0",
    "react-dropzone": "^14.2.0",
    "react-hook-form": "^7.53.0",
    "react-phone-number-input": "^3.4.0",
    "resend": "^4.0.0",
    "sonner": "^1.5.0",
    "tailwind-merge": "^2.5.0",
    "zod": "^3.23.0",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "^15.0.0",
    "postcss": "^8.4.0",
    "prisma": "^5.20.0",
    "tailwindcss": "^3.4.0",
    "tailwindcss-animate": "^1.0.7",
    "tailwindcss-rtl": "^0.9.0",
    "tsx": "^4.19.0",
    "typescript": "^5.6.0"
  }
}
```
