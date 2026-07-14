'use client'

import PageLayout from '@/components/shared/PageLayout'
import FadeIn from '@/components/motion/FadeIn'
import { Link } from '@/i18n/routing'
import {
  ArrowLeft,
  BookOpen,
  Building2,
  CheckCircle2,
  Eye,
  Flag,
  Globe2,
  Handshake,
  Heart,
  Layers,
  Lightbulb,
  Network,
  Radio,
  Shield,
  Sparkles,
  Target,
  Users,
  Zap,
} from 'lucide-react'

const goals = [
  'استقطاب وتنمية الكوادر المتخصصة في العلوم الإنسانية.',
  'بناء المنصات الإلكترونية التفاعلية الهادفة.',
  'الاهتمام بالبحوث العلمية المهتمة بالدعوة الإلكترونية ووسائلها.',
  'رعاية المشاريع المعتمدة على التقنية الحديثة والمعنية بالتغيير المجتمعي الإيجابي.',
  'التعاون مع الشبكات المجتمعية الهادفة العاملة في البيئة الافتراضية.',
]

const workAreas = [
  { icon: BookOpen, title: 'التعليم عن بعد' },
  { icon: Users, title: 'التدريب عن بعد' },
  { icon: Building2, title: 'الإدارة الإلكترونية' },
  { icon: Layers, title: 'التطبيقات التفاعلية' },
  { icon: Network, title: 'الشبكات المجتمعية' },
  { icon: Radio, title: 'الإعلام الرقمي' },
  { icon: Globe2, title: 'التواصل الاجتماعي' },
  { icon: Handshake, title: 'التنسيق والتكامل الإلكتروني' },
]

const values = [
  { icon: Building2, title: 'المؤسسية', desc: 'نعمل بمنهجية واضحة، وأدوار محددة، وآليات قابلة للمتابعة.' },
  { icon: Shield, title: 'المسؤولية الشرعية', desc: 'نراعي الضوابط والقيم الحاكمة في كل مبادرة ومحتوى.' },
  { icon: Zap, title: 'المبادرة الفاعلة', desc: 'نحوّل الأفكار إلى برامج عملية قابلة للتطبيق والتطوير.' },
  { icon: Network, title: 'التكامل الإلكتروني', desc: 'نربط المنصات والفرق والشركاء ضمن منظومة واحدة.' },
]

const timeline = [
  { title: 'الواقع الرقمي', desc: 'الشباب يقضون ساعات طويلة على منصات التواصل ويتلقون منها المعرفة والتوجهات.' },
  { title: 'الحاجة المجتمعية', desc: 'النهضة تحتاج كوادر شابة واعية قادرة على استخدام التقنية في البناء والتأثير.' },
  { title: 'فكرة الشبكة', desc: 'منصة تستقطب الكفاءات وتنسق جهودها عبر التعليم والإعلام والشراكات الرقمية.' },
]

export default function AboutPage() {
  return (
    <PageLayout>
      <div className="min-h-screen bg-white">
        {/* ===== HERO HEADER ===== */}
        <section className="relative overflow-hidden pt-28">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50/80 via-white to-secondary-50/60" />
          <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 translate-x-1/4 -translate-y-1/4 rounded-full bg-primary-100/40 blur-3xl" />
          <div className="pointer-events-none absolute left-0 bottom-0 h-64 w-64 -translate-x-1/4 rounded-full bg-secondary-100/30 blur-3xl" />
          <div className="surface-pattern absolute inset-0 opacity-30" />

          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <FadeIn>
              <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-1.5 text-sm font-bold text-primary-700">
                <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
                عن الشبكة
              </span>
              <h1 className="text-3xl font-bold leading-[1.2] text-neutral-900 md:text-4xl lg:text-5xl">
                عن شبكة الرواد الإلكترونية
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-neutral-600 lg:text-lg">
                صفحة تعريفية مركزة تعرض فكرة الشبكة، رسالتها، أهدافها، ومجالات عملها دون تكرار واجهة الصفحة الرئيسية.
              </p>
            </FadeIn>
          </div>
        </section>

        {/* ===== WHY ROWAD (TIMELINE) ===== */}
        <section className="section-padding relative overflow-hidden bg-white">
          <div className="pointer-events-none absolute left-0 top-1/3 h-72 w-72 -translate-x-1/3 rounded-full bg-primary-50/50 blur-3xl" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <FadeIn>
                <span className="mb-3 inline-flex rounded-full bg-primary-50 px-4 py-1.5 text-sm font-bold text-primary-700">
                  التعريف بالشبكة
                </span>
                <h2 className="section-title">لماذا شبكة الرواد؟</h2>
                <p className="mt-5 text-base leading-8 text-neutral-600">
                  أحدثت الثورة التكنولوجية تحولاً واضحاً في عالم الاتصال والتواصل الاجتماعي، وأصبح الشباب أكثر الفئات تأثراً بهذه الوسائل وأكثرها حضوراً فيها. ومن هذا الواقع جاءت الحاجة إلى توجيه هذا الحضور نحو بناء كوادر فاعلة ومبادرات نافعة.
                </p>
                <p className="mt-4 text-base leading-8 text-neutral-600">
                  لذلك جاءت فكرة شبكة الرواد الإلكترونية لتكون بيئة تستقطب الكفاءات، وتنسق جهودها، وتبني منصات رقمية هادفة تسهم في التغيير المجتمعي الإيجابي.
                </p>
              </FadeIn>

              <div className="grid gap-5">
                {timeline.map((item, i) => (
                  <FadeIn key={item.title} delay={i * 0.1}>
                    <div className="group relative overflow-hidden rounded-xl border border-primary-100/60 bg-gradient-to-l from-white to-primary-50/30 p-5 shadow-soft transition-all duration-300 hover:shadow-md hover:border-primary-200">
                      <div className="absolute right-0 top-0 h-full w-1.5 bg-gradient-to-b from-primary-500 to-primary-300 rounded-r-full" />
                      <div className="flex gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 text-sm font-bold text-white shadow-sm transition-transform duration-300 group-hover:scale-110">
                          {i + 1}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-neutral-900">{item.title}</h3>
                          <p className="mt-2 text-sm leading-7 text-neutral-600">{item.desc}</p>
                        </div>
                      </div>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ===== VISION & MISSION ===== */}
        <section className="section-padding relative overflow-hidden bg-neutral-50">
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 md:grid-cols-2">
              <FadeIn>
                <div className="group relative overflow-hidden rounded-2xl border border-primary-100/60 bg-white p-8 shadow-soft transition-all duration-300 hover:shadow-lg hover:border-primary-200">
                  <div className="absolute -left-6 -top-6 h-24 w-24 rounded-full bg-primary-100/50 blur-2xl" />
                  <div className="relative mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-100 to-primary-50 text-primary-700 shadow-sm transition-transform duration-300 group-hover:scale-110">
                    <Eye size={26} />
                  </div>
                  <h2 className="text-2xl font-bold text-neutral-900">رؤيتنا</h2>
                  <p className="mt-4 text-lg leading-8 text-neutral-600">
                    شبكة إلكترونية رائدة في النهوض المجتمعي.
                  </p>
                </div>
              </FadeIn>
              <FadeIn delay={0.1}>
                <div className="group relative overflow-hidden rounded-2xl border border-secondary-100/60 bg-white p-8 shadow-soft transition-all duration-300 hover:shadow-lg hover:border-secondary-200">
                  <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-secondary-100/50 blur-2xl" />
                  <div className="relative mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-secondary-100 to-secondary-50 text-secondary-700 shadow-sm transition-transform duration-300 group-hover:scale-110">
                    <Flag size={26} />
                  </div>
                  <h2 className="text-2xl font-bold text-neutral-900">رسالتنا</h2>
                  <p className="mt-4 text-base leading-8 text-neutral-600">
                    شبكة إلكترونية متخصصة في التعليم عن بعد تسعى للنهوض المجتمعي من خلال المنصات التفاعلية، وعبر الإعلام الرقمي والتواصل الاجتماعي والشبكات المجتمعية.
                  </p>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* ===== GOALS ===== */}
        <section className="section-padding relative overflow-hidden bg-white">
          <div className="pointer-events-none absolute right-0 top-0 h-80 w-80 translate-x-1/4 -translate-y-1/4 rounded-full bg-primary-50/40 blur-3xl" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-[0.92fr_1.08fr]">
              <FadeIn>
                <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-1.5 text-sm font-bold text-primary-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
                  ما الذي نعمل عليه؟
                </span>
                <h2 className="section-title">أهداف الشبكة</h2>
                <p className="mt-5 text-base leading-8 text-neutral-600">
                  نركز على بناء منظومة عمل تجمع الكفاءات، والمحتوى، والمنصات، والشراكات، بحيث تنتقل الأفكار من مبادرات متفرقة إلى أثر مستدام.
                </p>
              </FadeIn>

              <div className="grid gap-4">
                {goals.map((goal, i) => (
                  <FadeIn key={goal} delay={i * 0.07}>
                    <div className="group flex items-start gap-4 rounded-xl border border-neutral-200/80 bg-gradient-to-l from-neutral-50 to-white px-5 py-4 shadow-soft transition-all duration-300 hover:shadow-md hover:border-primary-200 hover:from-primary-50/30">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600 transition-all duration-300 group-hover:bg-primary-600 group-hover:text-white">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-semibold leading-7 text-neutral-700">{goal}</p>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ===== WORK AREAS ===== */}
        <section className="section-padding relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#3A5E33_0%,_transparent_60%)]" />
          <div className="surface-pattern pointer-events-none absolute inset-0 opacity-[0.06]" />
          <div className="pointer-events-none absolute left-1/3 top-0 h-64 w-64 rounded-full bg-primary-600/20 blur-[120px]" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <FadeIn>
              <div className="mx-auto max-w-3xl text-center">
                <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-bold text-secondary-300 backdrop-blur-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-secondary-400" />
                  مجالات العمل الرئيسية
                </span>
                <h2 className="text-3xl font-bold text-white md:text-4xl">ثمانية مسارات تعمل كمنظومة واحدة</h2>
                <p className="mt-4 text-base leading-8 text-white/60">
                  تعمل الشبكة عبر مسارات رقمية ومجتمعية متكاملة لضمان وضوح الأدوار وتراكم الأثر.
                </p>
              </div>
            </FadeIn>

            <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
              {workAreas.map(({ icon: Icon, title }, i) => (
                <FadeIn key={title} delay={i * 0.06}>
                  <div className="group flex h-full items-center gap-3 bg-gradient-to-br from-primary-900/90 to-primary-900/70 px-5 py-5 backdrop-blur-sm transition-all duration-300 hover:from-primary-800/90 hover:to-primary-800/70">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-secondary-300 transition-all duration-300 group-hover:bg-secondary-500/20 group-hover:scale-110">
                      <Icon size={20} />
                    </div>
                    <h3 className="text-sm font-bold leading-6 text-white">{title}</h3>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ===== VALUES ===== */}
        <section className="section-padding relative overflow-hidden bg-neutral-50">
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <FadeIn>
              <div className="mx-auto max-w-3xl text-center">
                <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-secondary-50 px-4 py-1.5 text-sm font-bold text-secondary-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-secondary-500" />
                  القيم الحاكمة
                </span>
                <h2 className="section-title">قيم الشبكة</h2>
                <p className="mt-4 text-base leading-8 text-neutral-600">
                  قيم عملية تضبط طريقة بناء المشاريع، وإدارة الفرق، والتعامل مع الشركاء والمستفيدين.
                </p>
              </div>
            </FadeIn>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {values.map(({ icon: Icon, title, desc }, i) => (
                <FadeIn key={title} delay={i * 0.08}>
                  <div className="group relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-primary-200">
                    <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-primary-50 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="relative mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-100 to-primary-50 text-primary-700 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-md">
                      <Icon size={22} />
                    </div>
                    <h3 className="relative text-lg font-bold text-neutral-900">{title}</h3>
                    <p className="relative mt-3 text-sm leading-7 text-neutral-600">{desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ===== MANAGEMENT ===== */}
        <section className="section-padding relative overflow-hidden bg-white">
          <div className="pointer-events-none absolute left-0 bottom-1/3 h-64 w-64 -translate-x-1/3 rounded-full bg-secondary-50/40 blur-3xl" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
              <FadeIn>
                <div className="relative rounded-2xl border border-neutral-200/80 bg-gradient-to-br from-neutral-50 to-white p-8 shadow-soft">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-100 to-primary-50 text-primary-700 shadow-sm">
                    <Building2 size={26} />
                  </div>
                  <h2 className="section-title">الإدارة والمقر</h2>
                  <p className="mt-5 text-base leading-8 text-neutral-600">
                    يدير شبكة الرواد الإلكترونية مجموعة من المهتمين بالتغيير المجتمعي الإيجابي وفق مفاهيم الإدارة الإلكترونية، ومن خلال منصتها وموقعها الإلكتروني وأدواتها في التواصل الاجتماعي.
                  </p>
                  <p className="mt-4 text-base leading-8 text-neutral-600">
                    للشبكة مكتب رئيسي في دولة الكويت بالشراكة مع جمعية فهد الأحمد الإنسانية، وتعمل مع جهات تتوافق مع رؤيتها في التعليم غير الربحي.
                  </p>
                </div>
              </FadeIn>

              <FadeIn delay={0.12} direction="right">
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    { icon: Target, title: 'استراتيجية واضحة', desc: 'أهداف محددة ومتابعة دورية.' },
                    { icon: Users, title: 'فرق متخصصة', desc: 'كوادر شبابية ومهنية.' },
                    { icon: Handshake, title: 'شراكات هادفة', desc: 'تكامل مع المؤسسات القريبة من الرسالة.' },
                    { icon: Heart, title: 'تعليم غير ربحي', desc: 'أولوية للأثر المجتمعي.' },
                  ].map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="group rounded-xl border border-neutral-200/80 bg-white p-5 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-secondary-200">
                      <Icon className="mb-4 h-6 w-6 text-secondary-600 transition-transform duration-300 group-hover:scale-110" />
                      <h3 className="font-bold text-neutral-900">{title}</h3>
                      <p className="mt-2 text-sm leading-7 text-neutral-600">{desc}</p>
                    </div>
                  ))}
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* ===== FINAL CTA ===== */}
        <section className="section-padding relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_#20321E_0%,_transparent_50%)]" />
          <div className="surface-pattern pointer-events-none absolute inset-0 opacity-[0.06]" />
          <div className="pointer-events-none absolute right-1/4 top-0 h-48 w-48 rounded-full bg-secondary-500/10 blur-[100px]" />

          <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
            <FadeIn>
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-white/10 to-white/5 text-secondary-300 shadow-lg shadow-black/10 ring-1 ring-white/10 backdrop-blur-sm">
                <Lightbulb size={28} />
              </div>
              <h2 className="text-3xl font-bold text-white md:text-4xl">هل لديك فكرة أو شراكة مناسبة؟</h2>
              <p className="mt-4 text-base leading-8 text-white/60">
                نرحب بالمبادرات التي تلتقي مع رؤية الشبكة في التعليم الرقمي والنهوض المجتمعي.
              </p>
              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <Link href="/contact" className="group inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-secondary-500 to-secondary-600 px-8 py-4 font-bold text-white no-underline shadow-lg shadow-secondary-900/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:from-secondary-600 hover:to-secondary-700">
                  <Sparkles size={20} />
                  تواصل معنا
                  <ArrowLeft size={20} className="rtl-flip transition-transform duration-200 group-hover:-translate-x-1" />
                </Link>
                <Link href="/projects" className="inline-flex items-center gap-2 rounded-xl border-2 border-white/20 px-8 py-4 font-bold text-white no-underline transition-all duration-300 hover:-translate-y-0.5 hover:border-white/50 hover:bg-white/5">
                  عرض المشاريع
                </Link>
              </div>
            </FadeIn>
          </div>
        </section>
      </div>
    </PageLayout>
  )
}
