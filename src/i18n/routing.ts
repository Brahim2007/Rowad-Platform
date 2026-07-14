import { defineRouting } from 'next-intl/routing'
import { createNavigation } from 'next-intl/navigation'

export const routing = defineRouting({
  locales: ['ar'],
  defaultLocale: 'ar',
  localePrefix: 'always',
})

export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing)
