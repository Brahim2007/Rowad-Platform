import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { Link } from '@/i18n/routing'
import { Linkedin, Mail, MapPin, Heart } from 'lucide-react'
import ScrollToTopButton from './ScrollToTopButton'

export default function Footer() {
  const t = useTranslations('footer')

  return (
    <footer className="relative bg-gradient-to-b from-neutral-900 to-neutral-950 text-neutral-300">
      {/* Subtle top border glow */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/30 to-transparent" />

      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-1/4 h-64 w-64 rounded-full bg-primary-900/20 blur-[100px]" />
        <div className="absolute -right-20 bottom-1/4 h-48 w-48 rounded-full bg-secondary-900/10 blur-[100px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-[1.4fr_1fr_1fr_auto]">
          {/* Brand Column */}
          <div>
            <div className="mb-5 inline-flex">
              <Image
                src="https://www.rowwad.net/uploads/system/logo-light.png"
                alt="شبكة الرواد الإلكترونية"
                width={220}
                height={72}
                className="h-auto w-44"
              />
            </div>
            <p className="max-w-sm text-sm leading-8 text-neutral-400">
              شبكة الرواد الإلكترونية: منصة شبابية رقمية متكاملة تحتضن المبدعين العرب،
              وتفتح لهم آفاق الفرص عبر مشاريع تنموية نوعية، وبرامج تدريبية ممنهجة،
              وشبكة شراكات مجتمعية هادفة — لبناء جيل رقمي قادر على صناعة الأثر.
            </p>
            {/* Social links */}
            <div className="mt-6 flex items-center gap-3">
              <a
                href="https://www.linkedin.com/company/rowad-network"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-700 text-neutral-500 transition-all duration-200 hover:border-secondary-500 hover:bg-secondary-500/10 hover:text-secondary-400"
                aria-label="LinkedIn"
              >
                <Linkedin size={16} />
              </a>
              <a
                href="mailto:info@rowad-network.org"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-700 text-neutral-500 transition-all duration-200 hover:border-primary-500 hover:bg-primary-500/10 hover:text-primary-400"
                aria-label="Email"
              >
                <Mail size={16} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-5 text-sm font-bold tracking-wider text-white uppercase">{t('quickLinks')}</h3>
            <ul className="space-y-3">
              {[
                { key: 'home', href: '/' },
                { key: 'about', href: '/about' },
                { key: 'platforms', href: '/platforms' },
                { key: 'projects', href: '/projects' },
                { key: 'team', href: '/team' },
                { key: 'guide', href: '/guide' },
              ].map(({ key, href }) => (
                <li key={key}>
                  <Link
                    href={href}
                    className="group inline-flex items-center gap-1.5 text-sm text-neutral-400 no-underline transition-all duration-200 hover:text-secondary-400"
                  >
                    <span className="h-0.5 w-0 bg-secondary-500 transition-all duration-200 group-hover:w-3" />
                    {t(key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-5 text-sm font-bold tracking-wider text-white uppercase">{t('contact')}</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-center gap-3 group">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-800 text-neutral-500 transition-all duration-200 group-hover:bg-secondary-500/10 group-hover:text-secondary-400">
                  <Mail size={14} />
                </div>
                <a href="mailto:info@rowad-network.org" className="text-neutral-400 no-underline transition-colors hover:text-secondary-400">
                  info@rowad-network.org
                </a>
              </li>
              <li className="flex items-center gap-3 group">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-800 text-neutral-500 transition-all duration-200 group-hover:bg-primary-500/10 group-hover:text-primary-400">
                  <MapPin size={14} />
                </div>
                <span className="text-neutral-400">الكويت</span>
              </li>
            </ul>
          </div>

          {/* Scroll to top */}
          <div className="flex items-start md:pt-0">
            <ScrollToTopButton />
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="relative border-t border-neutral-800">
        <div className="mx-auto max-w-7xl px-4 py-5 text-center sm:px-6 lg:px-8">
          <p className="text-xs font-medium text-white/50">
            المنصة قيد التطوير والتحديث المستمر — النسخة التجريبية (Beta) من فبراير 2026
          </p>
        </div>
      </div>

      <div className="border-t border-neutral-800/50">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-center sm:px-6 lg:flex-row lg:text-start lg:px-8">
          <p className="text-sm text-neutral-400">{t('rights')}</p>
          <p className="inline-flex items-center gap-1.5 text-sm text-neutral-400">
            بُني بـ
            <Heart size={14} className="fill-red-500 text-red-500" />
            لخدمة الشباب العربي من طرف{' '}
            <a
              href="https://www.linkedin.com/in/kertiou-brahim-37654940/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-secondary-400 no-underline transition-colors hover:text-secondary-300"
            >
              Brahim KERTIOU
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
