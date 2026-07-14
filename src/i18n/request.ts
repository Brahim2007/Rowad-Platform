import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'

function isLocale(locale: string): locale is (typeof routing.locales)[number] {
  return routing.locales.includes(locale as (typeof routing.locales)[number])
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale

  if (!locale || !isLocale(locale)) {
    locale = routing.defaultLocale
  }

  return {
    locale,
    messages: (await import(`../../public/locales/${locale}.json`)).default,
  }
})
