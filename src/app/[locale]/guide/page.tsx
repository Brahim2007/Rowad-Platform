'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  BookOpen, ChevronDown, Menu, Database, LayoutDashboard, Route,
  Target, Users, Blocks, FileText, ClipboardList, Activity,
  Layers, ShieldCheck, BarChart3, Fingerprint, Handshake,
  Compass, CheckSquare, Clock, BookMarked, GraduationCap,
  Search, Filter, Download, PieChart, RefreshCw, Calendar,
  ImageOff, ChevronLeft, ArrowUpRight, ListChecks, UserCheck,
  Network, Briefcase, Globe, TrendingUp, Library, ClipboardCheck,
  CalendarCheck, Settings, HelpCircle, Info, AlertCircle,
  CheckCircle, ArrowLeft, Maximize2, Plus, Star, Workflow,
  FileSearch, Link2, Upload, Eye, Edit3, Trash2, LogIn,
  ChevronRight, ExternalLink, ZoomIn
} from 'lucide-react'
import PageLayout from '@/components/shared/PageLayout'

// ─── Section Card ───

function GuideSection({
  id,
  icon: Icon,
  title,
  subtitle,
  children,
  defaultOpen = false,
}: {
  id: string
  icon: React.ElementType
  title: string
  subtitle: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div id={id} className="card border border-neutral-200 overflow-hidden scroll-mt-24">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 md:p-6 text-right hover:bg-neutral-50/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
            <Icon size={24} />
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold text-neutral-900">{title}</h2>
            <p className="text-sm text-neutral-500">{subtitle}</p>
          </div>
        </div>
        <ChevronDown
          size={20}
          className={`text-neutral-400 transition-transform duration-300 shrink-0 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <div
        className={`transition-all duration-300 overflow-hidden ${
          open ? 'max-h-[9999px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-5 md:px-6 pb-6 border-t border-neutral-100 pt-5">
          {children}
        </div>
      </div>
    </div>
  )
}

// ─── Image Placeholder ───

function ImagePlaceholder({
  label,
  height = 'h-64',
  icon: Icon = ImageOff,
}: {
  label: string
  height?: string
  icon?: React.ElementType
}) {
  return (
    <div
      className={`relative ${height} bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-xl border-2 border-dashed border-neutral-300 flex flex-col items-center justify-center gap-3 overflow-hidden group cursor-pointer hover:border-primary-300 hover:from-primary-50 hover:to-primary-100/30 transition-all duration-300`}
    >
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#527F47_1px,transparent_1px)] [background-size:20px_20px]" />
      <div className="w-16 h-16 rounded-2xl bg-white/80 border border-neutral-200 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
        <Icon size={28} className="text-neutral-400 group-hover:text-primary-500 transition-colors" />
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-neutral-500 group-hover:text-primary-700 transition-colors">{label}</p>
        <p className="text-xs text-neutral-400 mt-0.5">مساحة محجوزة لصورة توضيحية</p>
      </div>
    </div>
  )
}

// ─── Step Card ───

function StepCard({ number, title, desc }: { number: number; title: string; desc: string }) {
  return (
    <div className="flex gap-4 p-4 rounded-xl bg-neutral-50 border border-neutral-200 hover:border-primary-200 transition-colors">
      <div className="w-9 h-9 rounded-lg bg-primary-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
        {number}
      </div>
      <div>
        <h4 className="font-bold text-neutral-900 text-sm mb-1">{title}</h4>
        <p className="text-xs text-neutral-600 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

// ─── Info Box ───

function InfoBox({ type = 'info', title, children }: { type?: 'info' | 'warning' | 'success' | 'tip'; title: string; children: React.ReactNode }) {
  const styles = {
    info: { bg: 'bg-blue-50 border-blue-200', icon: Info, iconColor: 'text-blue-600', titleColor: 'text-blue-800' },
    warning: { bg: 'bg-amber-50 border-amber-200', icon: AlertCircle, iconColor: 'text-amber-600', titleColor: 'text-amber-800' },
    success: { bg: 'bg-green-50 border-green-200', icon: CheckCircle, iconColor: 'text-green-600', titleColor: 'text-green-800' },
    tip: { bg: 'bg-purple-50 border-purple-200', icon: Star, iconColor: 'text-purple-600', titleColor: 'text-purple-800' },
  }
  const s = styles[type]
  const Icon = s.icon

  return (
    <div className={`${s.bg} border rounded-xl p-4`}>
      <div className="flex items-start gap-3">
        <Icon size={20} className={`${s.iconColor} shrink-0 mt-0.5`} />
        <div>
          <h4 className={`font-bold text-sm ${s.titleColor} mb-1`}>{title}</h4>
          <div className="text-xs text-neutral-700 leading-relaxed">{children}</div>
        </div>
      </div>
    </div>
  )
}

// ─── FAQ Item ───

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl border border-neutral-200 overflow-hidden hover:border-primary-200 transition-colors">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-right hover:bg-neutral-50 transition-colors"
      >
        <span className="text-sm font-bold text-neutral-900 flex items-center gap-2">
          <HelpCircle size={16} className="text-primary-500 shrink-0" />
          {question}
        </span>
        <ChevronDown size={16} className={`text-neutral-400 shrink-0 mr-2 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 pt-0 border-t border-neutral-100">
          <p className="text-xs text-neutral-600 leading-relaxed mt-3 pr-7">{answer}</p>
        </div>
      )}
    </div>
  )
}

// ─── Table of Contents ───

const SECTIONS = [
  { id: 'intro', icon: BookOpen, label: 'مقدمة عن المنظومة' },
  { id: 'dashboard', icon: LayoutDashboard, label: 'لوحة القيادة' },
  { id: 'members', icon: Users, label: 'الأعضاء ورحلة المستفيد' },
  { id: 'platforms', icon: Blocks, label: 'المنصات والمبادرات' },
  { id: 'tasks', icon: ListChecks, label: 'المهام والتنسيق' },
  { id: 'kpi', icon: Target, label: 'مؤشرات الأداء وقياس الأثر' },
  { id: 'reports', icon: FileText, label: 'التقارير والتحليلات' },
  { id: 'library', icon: Library, label: 'المكتبة المعرفية' },
  { id: 'faq', icon: HelpCircle, label: 'أسئلة شائعة' },
]

// ─── Main Page ───

export default function GuidePage() {
  const [tocOpen, setTocOpen] = useState(false)

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setTocOpen(false)
    }
  }

  return (
    <PageLayout>
      <div className="pt-28 md:pt-36 px-4 md:px-6 lg:px-8 pb-4 md:pb-6 lg:pb-8 max-w-5xl mx-auto" dir="rtl">
        {/* ─── Hero ─── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 p-8 md:p-12 mb-8">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary-300 rounded-full blur-3xl" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 flex items-center justify-center p-2">
                <Image
                  src="/images/Rowad-Logo.png"
                  alt="شبكة الرواد الإلكترونية"
                  width={138}
                  height={45}
                  className="h-auto w-full brightness-0 invert sepia-0 hue-rotate-0 saturate-0"
                  style={{ filter: 'brightness(0) invert(1)' }}
                />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">دليل المستخدم</h1>
                <p className="text-primary-200 text-sm">شبكة الرواد الإلكترونية — نظام إدارة المنظومة المتكامل</p>
              </div>
            </div>
            <p className="text-primary-100 max-w-2xl leading-relaxed text-sm md:text-base">
              هذا الدليل يشرح بالتفصيل جميع مكونات النظام: لوحة القيادة، إدارة الأعضاء ورحلة المستفيد،
              المنصات والمبادرات، المهام والتنسيق، مؤشرات الأداء، التقارير، والمكتبة المعرفية.
              يهدف الدليل إلى تمكين الفريق من استخدام المنظومة بكفاءة عالية.
            </p>

            {/* Quick stats */}
            <div className="flex flex-wrap gap-4 mt-6">
              {[
                { label: 'الأقسام', value: '9' },
                { label: 'صفحة تفاعلية', value: 'كاملة' },
                { label: 'آخر تحديث', value: 'مايو 2026' },
              ].map(s => (
                <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/10">
                  <p className="text-primary-200 text-xs">{s.label}</p>
                  <p className="text-white font-bold text-sm">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Table of Contents ─── */}
        <div className="mb-8">
          {/* Desktop TOC */}
          <div className="hidden lg:flex flex-wrap gap-2">
            {SECTIONS.map(s => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-neutral-200 text-sm font-medium text-neutral-700 hover:border-primary-300 hover:text-primary-700 hover:bg-primary-50 transition-all no-underline shadow-sm"
              >
                <s.icon size={16} className="text-primary-500" />
                {s.label}
              </button>
            ))}
          </div>

          {/* Mobile TOC */}
          <div className="lg:hidden relative">
            <button
              onClick={() => setTocOpen(!tocOpen)}
              className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-neutral-200 shadow-sm"
            >
              <span className="flex items-center gap-2 text-sm font-bold text-neutral-700">
                <Menu size={16} className="text-primary-500" />
                فهرس الدليل
              </span>
              <ChevronDown size={18} className={`text-neutral-400 transition-transform ${tocOpen ? 'rotate-180' : ''}`} />
            </button>
            {tocOpen && (
              <div className="absolute top-full right-0 left-0 mt-2 bg-white rounded-xl border border-neutral-200 shadow-lg z-30 p-2">
                {SECTIONS.map(s => (
                  <button
                    key={s.id}
                    onClick={() => scrollTo(s.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-neutral-700 hover:bg-primary-50 hover:text-primary-700 transition-colors text-right"
                  >
                    <s.icon size={16} className="text-primary-500 shrink-0" />
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── Content ─── */}
        <div className="space-y-6">

          {/* === 1. Introduction === */}
          <GuideSection id="intro" icon={BookOpen} title="مقدمة عن المنظومة" subtitle="نظرة شاملة على نظام إدارة شبكة الرواد الإلكترونية" defaultOpen>
            <div className="space-y-5">
              <p className="text-sm leading-relaxed text-neutral-700">
                <strong>شبكة الرواد الإلكترونية</strong> هي منظومة رقمية متكاملة تهدف إلى تمكين الشباب العربي
                وتطوير قدراتهم من خلال منصات متعددة تغطي مجالات: التقنية والبرمجة، الريادة المجتمعية،
                الإعلام الرقمي، والتطوع. تجمع المنظومة بين إدارة الأعضاء، تتبع رحلة المستفيد،
                قياس الأثر، والتنسيق المؤسسي في نظام واحد.
              </p>

              <ImagePlaceholder label="صورة توضيحية: شعار شبكة الرواد الإلكترونية" height="h-48" icon={Network} />

              <div>
                <h3 className="font-bold text-neutral-900 mb-3 text-sm">الركائز الأساسية للمنظومة</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    { icon: Database, label: 'قاعدة بيانات موحدة', desc: 'ملف موحد لكل مستفيد برقم تعريفي (Unified ID) يضمن عدم التكرار.' },
                    { icon: Route, label: 'رحلة المستفيد', desc: 'تتبع مسار تطور العضو عبر 8 مراحل من الاكتشاف إلى السفير.' },
                    { icon: Target, label: 'قياس الأثر', desc: 'مؤشرات أداء دقيقة لقياس الاحتفاظ، الرضا، والإكمال.' },
                    { icon: Handshake, label: 'التنسيق المؤسسي', desc: 'إدارة المهام بين الفرق والمنسقين بكفاءة عالية.' },
                  ].map(item => (
                    <div key={item.label} className="flex gap-3 p-3.5 rounded-xl bg-neutral-50 border border-neutral-200">
                      <div className="w-9 h-9 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
                        <item.icon size={18} />
                      </div>
                      <div>
                        <h4 className="font-bold text-neutral-900 text-sm">{item.label}</h4>
                        <p className="text-xs text-neutral-600 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <InfoBox type="info" title="من يمكنه استخدام هذا الدليل؟">
                هذا الدليل موجه لجميع مستخدمي النظام: مدراء المنصات، منسقي البرامج، فريق التقييم،
                فريق التقارير، والإدارة العليا. كل قسم يشرح الميزات من منظور المستخدم المستهدف.
              </InfoBox>
            </div>
          </GuideSection>

          {/* === 2. Dashboard === */}
          <GuideSection id="dashboard" icon={LayoutDashboard} title="لوحة القيادة" subtitle="شرح تفصيلي للوحة التحكم الرئيسية ومكوناتها">
            <div className="space-y-5">
              <p className="text-sm text-neutral-700 leading-relaxed">
                لوحة القيادة (Dashboard) هي الشاشة الرئيسية التي تظهر بعد تسجيل الدخول. تمنحك نظرة شاملة
                على أداء المنظومة عبر أربعة أقسام رئيسية: تعمل على مراقبة شاملة للبيانات، التحليلات، والأداء الحي للمنصات والمبادرات لضمان جودة الأرشفة ودعم القرار.
              </p>

              <ImagePlaceholder label="لقطة شاشة: لوحة القيادة الرئيسية" height="h-72" icon={LayoutDashboard} />

              <div>
                <h3 className="font-bold text-neutral-900 mb-3 text-sm">مكونات لوحة القيادة</h3>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                    <h4 className="font-bold text-neutral-900 text-sm flex items-center gap-2 mb-2">
                      <Fingerprint size={16} className="text-primary-600" />
                      بطاقات مؤشرات الأداء العليا (Top KPIs)
                    </h4>
                    <p className="text-xs text-neutral-600 leading-relaxed mb-2">
                      تعرض أربع بطاقات سريعة: عدد الملفات الموحدة النشطة (ID)، جودة البيانات،
                      مؤشرات الأداء المستخرجة، والمنصات النشطة. هذه البطاقات تعطي نظرة فورية على صحة المنظومة.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                    <h4 className="font-bold text-neutral-900 text-sm flex items-center gap-2 mb-2">
                      <Activity size={16} className="text-primary-600" />
                      الديناميكية والتتبع الحي
                    </h4>
                    <p className="text-xs text-neutral-600 leading-relaxed mb-2">
                      يعرض هذا القسم المنصات النشطة مع بيانات آنية: عدد الأعضاء، ساعات العمل المسجلة،
                      ونسبة التفاعل. يمكنك النقر على "إدارة" للذهاب إلى صفحة المنصة مباشرة.
                      كل منصة مميزة بلونها الخاص مع شريط تقدم جانبي.
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {['تحديث مباشر', 'مقارنة تفاعل', 'روابط سريعة'].map(tag => (
                        <span key={tag} className="text-[10px] bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">{tag}</span>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                    <h4 className="font-bold text-neutral-900 text-sm flex items-center gap-2 mb-2">
                      <Target size={16} className="text-secondary-600" />
                      قياس الأثر والفاعلية
                    </h4>
                    <p className="text-xs text-neutral-600 leading-relaxed mb-2">
                      يعرض ثلاثة مؤشرات رئيسية: <strong>معدل الاحتفاظ</strong> (النسبة المئوية للأعضاء المستمرين)،
                      <strong> رضا الأعضاء</strong> (معدل الرضا من 10)، <strong>إكمال البرامج</strong> (نسبة إتمام البرامج).
                      كل مؤشر يعرض تغيره مقارنة بالفترة السابقة.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                    <h4 className="font-bold text-neutral-900 text-sm flex items-center gap-2 mb-2">
                      <Route size={16} className="text-primary-600" />
                      مسار تطور الأعضاء (Journey Funnel)
                    </h4>
                    <p className="text-xs text-neutral-600 leading-relaxed mb-2">
                      قمع بصري يوضح توزيع الأعضاء عبر مراحل الرحلة الثمانية. كل شريط يمثل مرحلة
                      وعدد الأعضاء فيها. يمكنك النقر على أيقونة المسار بجانب أي عضو في الجدول
                      لعرض رحلته الكاملة في نافذة منبثقة.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                    <h4 className="font-bold text-neutral-900 text-sm flex items-center gap-2 mb-2">
                      <Database size={16} className="text-primary-600" />
                      قاعدة البيانات الموحدة (Unified ID)
                    </h4>
                    <p className="text-xs text-neutral-600 leading-relaxed mb-2">
                      جدول يعرض أحدث الأعضاء المسجلين مع بيانات: الرقم الموحد، الاسم، الدولة،
                      المسار الحالي، النشاط (عدد التسجيلات والمشاركات)، الحالة. يمكنك البحث
                      بالاسم أو الكود، والنقر على "فتح الملف" للذهاب إلى صفحة العضو الكاملة.
                    </p>
                  </div>
                </div>
              </div>

              <ImagePlaceholder label="لقطة شاشة: قاعدة البيانات الموحدة وجدول الأعضاء" height="h-56" icon={Database} />

              <InfoBox type="tip" title="نصيحة: تخصيص لوحة القيادة">
                  استخدم زر "تحديث" لإعادة تحميل البيانات. يمكنك تصفية الأعضاء بالبحث المباشر في جدول
                  قاعدة البيانات. لمشاهدة رحلة أي عضو كاملة، انقر على أيقونة المسار (Route) بجانب اسمه.
              </InfoBox>
            </div>
          </GuideSection>

          {/* === 3. Members & Journey === */}
          <GuideSection id="members" icon={Users} title="الأعضاء ورحلة المستفيد" subtitle="إدارة ملفات الأعضاء وتتبع رحلة التطور الكاملة">
            <div className="space-y-5">
              <p className="text-sm text-neutral-700 leading-relaxed">
                نظام إدارة الأعضاء هو القلب النابض للمنظومة. يوفر ملفاً موحداً لكل مستفيد (Unified ID)
                يتضمن جميع بياناته، مسار رحلته، وتسجيلاته في البرامج والأنشطة عبر جميع المنصات.
              </p>

              <ImagePlaceholder label="صورة توضيحية: صفحة إدارة الأعضاء" height="h-56" icon={Users} />

              <div>
                <h3 className="font-bold text-neutral-900 mb-3 text-sm">مراحل رحلة المستفيد (8 مراحل)</h3>
                <div className="grid sm:grid-cols-2 gap-2">
                  {[
                    { stage: 'اكتشاف', desc: 'المستفيد يتعرف على الشبكة عبر منصات التواصل أو الفعاليات.', color: 'bg-neutral-100 border-neutral-300' },
                    { stage: 'تقديم', desc: 'تسجيل البيانات الأساسية وإنشاء الملف الموحد (Unified ID).', color: 'bg-primary-100 border-primary-200' },
                    { stage: 'تأهيل', desc: 'إكمال الملف الشخصي والتوجيه للبرامج المناسبة.', color: 'bg-primary-100 border-primary-200' },
                    { stage: 'نشط', desc: 'المستفيد يشارك بنشاط في البرامج والأنشطة.', color: 'bg-green-50 border-green-200' },
                    { stage: 'متقدم', desc: 'تطوير مهارات متقدمة والانتقال لأدوار قيادية.', color: 'bg-secondary-100 border-secondary-200' },
                    { stage: 'متخرج', desc: 'إكمال المسار البرامجي بالكامل.', color: 'bg-blue-50 border-blue-200' },
                    { stage: 'خريج', desc: 'الانضمام لشبكة الخريجين والمشاركة في توجيه الآخرين.', color: 'bg-primary-100 border-primary-200' },
                    { stage: 'سفير', desc: 'تمثيل الشبكة في المحافل ونقل الخبرة.', color: 'bg-secondary-100 border-secondary-200' },
                  ].map(({ stage, desc, color }) => (
                    <div key={stage} className={`flex gap-3 p-3 rounded-xl border ${color}`}>
                      <div className="w-8 h-8 rounded-full bg-white border border-neutral-200 flex items-center justify-center shrink-0 mt-0.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />
                      </div>
                      <div>
                        <h4 className="font-bold text-neutral-900 text-sm">{stage}</h4>
                        <p className="text-xs text-neutral-600 mt-0.5">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <ImagePlaceholder label="لقطة شاشة: نافذة مسار تطور العضو (Journey Timeline)" height="h-64" icon={Route} />

              <div>
                <h3 className="font-bold text-neutral-900 mb-3 text-sm">الميزات الرئيسية لإدارة الأعضاء</h3>
                <div className="grid sm:grid-cols-3 gap-3">
                  {[
                    { icon: Search, label: 'بحث متقدم', desc: 'ابحث بالاسم، الكود، البريد الإلكتروني، أو المنصة.' },
                    { icon: Filter, label: 'تصفية متعددة', desc: 'فلترة حسب المرحلة، الحالة، المنصة، والدولة.' },
                    { icon: Route, label: 'عرض رحلة العضو', desc: 'نافذة timeline تفاعلية تظهر مسار التطور الكامل.' },
                    { icon: Edit3, label: 'تعديل البيانات', desc: 'تحديث معلومات العضو وتسجيلاته في البرامج.' },
                    { icon: Download, label: 'تصدير البيانات', desc: 'تصدير قوائم الأعضاء بتنسيق CSV أو Excel.' },
                    { icon: Eye, label: 'ملف العضو الكامل', desc: 'صفحة تفصيلية بكل بيانات العضو وأنشطته.' },
                  ].map(item => (
                    <div key={item.label} className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-center">
                      <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center mx-auto mb-2">
                        <item.icon size={16} />
                      </div>
                      <h4 className="font-bold text-neutral-900 text-xs mb-0.5">{item.label}</h4>
                      <p className="text-[10px] text-neutral-500">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <InfoBox type="success" title="قاعدة خالية من التكرار">
                نظام Unified ID يضمن أن لكل مستفيد رقم تعريف واحد فقط عبر جميع المنصات.
                هذا يلغي التكرار ويتيح تتبعاً دقيقاً لرحلة العضو من البداية إلى النهاية.
              </InfoBox>
            </div>
          </GuideSection>

          {/* === 4. Platforms & Initiatives === */}
          <GuideSection id="platforms" icon={Blocks} title="المنصات والمبادرات" subtitle="إدارة المنصات والبرامج والمشاريع">
            <div className="space-y-5">
              <p className="text-sm text-neutral-700 leading-relaxed">
                تدير المنظومة منصات متعددة، كل منها يحتوي على برامج ومشاريع وأنشطة خاصة به.
                يمكنك من هنا إنشاء وتحرير المنصات، إدارة محتواها، وتتبع أدائها.
              </p>

              <ImagePlaceholder label="صورة توضيحية: صفحة إدارة المنصات" height="h-56" icon={Blocks} />

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                  <h4 className="font-bold text-neutral-900 text-sm flex items-center gap-2 mb-2">
                    <Blocks size={16} className="text-primary-600" />
                    إدارة المنصات
                  </h4>
                  <ul className="space-y-1.5 text-xs text-neutral-600">
                    {['إنشاء منصة جديدة بالشعار والغلاف والوصف', 'تحديد لون تمييزي لكل منصة', 'إضافة البرامج والمشاريع المرتبطة', 'تحديد المشرفين على المنصة', 'مراقبة مؤشرات أداء المنصة'].map((li, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle size={12} className="text-primary-500 mt-0.5 shrink-0" />
                        {li}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                  <h4 className="font-bold text-neutral-900 text-sm flex items-center gap-2 mb-2">
                    <Briefcase size={16} className="text-secondary-600" />
                    البرامج والمشاريع
                  </h4>
                  <ul className="space-y-1.5 text-xs text-neutral-600">
                    {['تصنيف البرامج ضمن المنصات', 'تحديد تواريخ ومدة البرامج', 'تسجيل الأعضاء في البرامج', 'متابعة تقدم المشاريع', 'توثيق مخرجات الأنشطة'].map((li, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle size={12} className="text-secondary-500 mt-0.5 shrink-0" />
                        {li}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <ImagePlaceholder label="لقطة شاشة: صفحة منصة مع البرامج والمشاريع" height="h-48" icon={Network} />
            </div>
          </GuideSection>

          {/* === 5. Tasks === */}
          <GuideSection id="tasks" icon={ListChecks} title="المهام والتنسيق" subtitle="نظام إدارة المهام والتنسيق المؤسسي بين الفرق">
            <div className="space-y-5">
              <p className="text-sm text-neutral-700 leading-relaxed">
                نظام المهام والتنسيق يمكّن الفرق من توزيع المهام، متابعة التنفيذ، والتنسيق بين
                منسقي المبادرات والمنصات بشكل فعّال. يظهر ملخص المهام في لوحة القيادة الرئيسية.
              </p>

              <ImagePlaceholder label="صورة توضيحية: صفحة التنسيق وإدارة المهام" height="h-56" icon={ListChecks} />

              <div>
                <h3 className="font-bold text-neutral-900 mb-3 text-sm">حالات المهام</h3>
                <div className="grid sm:grid-cols-4 gap-3">
                  {[
                    { label: 'قيد الانتظار', desc: 'مهمة جديدة لم تبدأ بعد', color: 'bg-amber-50 border-amber-200 text-amber-700' },
                    { label: 'قيد التنفيذ', desc: 'يجري العمل على المهمة حالياً', color: 'bg-blue-50 border-blue-200 text-blue-700' },
                    { label: 'مكتمل', desc: 'تم إنجاز المهمة بنجاح', color: 'bg-green-50 border-green-200 text-green-700' },
                    { label: 'ملغى', desc: 'ألغيت المهمة لسبب ما', color: 'bg-red-50 border-red-200 text-red-700' },
                  ].map(s => (
                    <div key={s.label} className={`p-3 rounded-xl border text-center ${s.color}`}>
                      <h4 className="font-bold text-sm">{s.label}</h4>
                      <p className="text-[10px] mt-1 opacity-80">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-neutral-900 mb-3 text-sm">خطوات إنشاء مهمة جديدة</h3>
                <div className="space-y-2">
                  {[
                    { title: 'اذهب إلى صفحة التنسيق', desc: 'من القائمة الجانبية اختر "التنسيق" للوصول إلى صفحة إدارة المهام.' },
                    { title: 'أنشئ مهمة جديدة', desc: 'اضغط على زر "مهمة جديدة" وأدخل عنوان المهمة ووصفها.' },
                    { title: 'حدد المسؤول والموعد', desc: 'اختر الشخص المسؤول عن المهمة وحدد تاريخ الاستحقاق.' },
                    { title: 'تابع التنفيذ', desc: 'يمكنك تحديث حالة المهمة وإضافة تعليقات وتحديثات.' },
                  ].map((step, i) => (
                    <StepCard key={i} number={i + 1} title={step.title} desc={step.desc} />
                  ))}
                </div>
              </div>

              <InfoBox type="tip" title="التنسيق المؤسسي">
                لوحة التنسيق تعرض جميع المهام النشطة مع إمكانية التصفية حسب المسؤول أو الحالة أو الأولوية.
                يمكن ربط المهام بمنصة أو برنامج معين لتسهيل التتبع.
              </InfoBox>
            </div>
          </GuideSection>

          {/* === 6. KPI === */}
          <GuideSection id="kpi" icon={Target} title="مؤشرات الأداء وقياس الأثر" subtitle="قياس أداء المنصات والبرامج وتقييم الأثر">
            <div className="space-y-5">
              <p className="text-sm text-neutral-700 leading-relaxed">
                نظام قياس الأداء يوفر مؤشرات دقيقة على مستوى المنظومة بأكملها. تشمل المؤشرات:
                أداء المنصات، رضا الأعضاء، معدلات الاحتفاظ، إكمال البرامج، وغيرها من المقاييس
                التي تدعم اتخاذ القرار.
              </p>

              <ImagePlaceholder label="صورة توضيحية: صفحة التحليلات ومؤشرات الأداء" height="h-64" icon={BarChart3} />

              <div>
                <h3 className="font-bold text-neutral-900 mb-3 text-sm">المؤشرات الرئيسية</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-sm border-collapse">
                    <thead>
                      <tr className="border-b-2 border-neutral-200 bg-neutral-50">
                        <th className="p-3 font-bold text-xs text-neutral-600">المؤشر</th>
                        <th className="p-3 font-bold text-xs text-neutral-600">الوصف</th>
                        <th className="p-3 font-bold text-xs text-neutral-600">طريقة القياس</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['معدل الاحتفاظ', 'نسبة الأعضاء المستمرين في البرامج', 'مقارنة الأعضاء النشطين بإجمالي المسجلين'],
                        ['رضا الأعضاء', 'مستوى رضا المستفيدين عن البرامج', 'استبيانات دورية (مقياس 1-10)'],
                        ['إكمال البرامج', 'نسبة إتمام البرامج المسجل فيها', 'المتخرجون ÷ إجمالي المسجلين × 100'],
                        ['نشاط المنصة', 'مستوى التفاعل والنشاط على المنصة', 'مؤشر مركب: تسجيلات + مشاركات + ساعات'],
                        ['جودة البيانات', 'دقة واكتمال بيانات الأعضاء', '% الحقول المكتملة من إجمالي المطلوبة'],
                      ].map((row, i) => (
                        <tr key={i} className="border-b border-neutral-100 hover:bg-neutral-50">
                          {row.map((cell, j) => (
                            <td key={j} className="p-3 text-xs text-neutral-700">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <ImagePlaceholder label="لقطة شاشة: مؤشرات قياس الأثر والفاعلية" height="h-48" icon={TrendingUp} />

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                  <h4 className="font-bold text-blue-800 text-sm mb-1 flex items-center gap-2">
                    <BarChart3 size={16} />
                    التحليلات
                  </h4>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    صفحة التحليلات توفر رسومات بيانية متقدمة ومقارنات بين الفترات
                    لدعم اتخاذ القرارات الاستراتيجية بناءً على بيانات دقيقة.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-secondary-50 border border-secondary-200">
                  <h4 className="font-bold text-secondary-800 text-sm mb-1 flex items-center gap-2">
                    <ClipboardCheck size={16} />
                    التقييم
                  </h4>
                  <p className="text-xs text-secondary-700 leading-relaxed">
                    آلية تقييم مستقلة كطرف ثالث لضمان جودة البرامج وموضوعية نتائج القياس.
                  </p>
                </div>
              </div>

              <InfoBox type="info" title="دعم اتخاذ القرار">
                بناءً على مؤشرات الأداء الحالية، يُنصح بتعزيز تطوير المناهج في قطاع التكنولوجيا
                والاستمرار في تطوير آليات التقييم المستقلة لضمان جودة المخرجات.
              </InfoBox>
            </div>
          </GuideSection>

          {/* === 7. Reports === */}
          <GuideSection id="reports" icon={FileText} title="التقارير والتحليلات" subtitle="إعداد وتصدير التقارير الدورية وتحليل البيانات">
            <div className="space-y-5">
              <p className="text-sm text-neutral-700 leading-relaxed">
                نظام التقارير يتيح للفريق إعداد تقارير دورية ومخصصة تغطي جميع جوانب المنظومة.
                يمكن تصدير التقارير ومشاركتها مع الجهات المعنية.
              </p>

              <ImagePlaceholder label="صورة توضيحية: صفحة التقارير" height="h-56" icon={FileText} />

              <div>
                <h3 className="font-bold text-neutral-900 mb-3 text-sm">أنواع التقارير المتاحة</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    { icon: PieChart, label: 'تقارير الأداء', desc: 'ملخص أداء المنصات والبرامج بشكل دوري.' },
                    { icon: Users, label: 'تقارير الأعضاء', desc: 'تحليل ديموغرافيا الأعضاء وتوزيعهم.' },
                    { icon: Activity, label: 'تقارير الأنشطة', desc: 'إحصائيات الأنشطة المنفذة والمشاركين.' },
                    { icon: TrendingUp, label: 'تقارير الأثر', desc: 'قياس أثر البرامج على المستفيدين.' },
                    { icon: Download, label: 'تصدير البيانات', desc: 'تصدير التقارير بصيغ PDF, Excel, CSV.' },
                    { icon: Calendar, label: 'تقارير دورية', desc: 'جدولة تقارير آلية ترسل للمعنيين.' },
                  ].map(item => (
                    <div key={item.label} className="flex gap-3 p-3 rounded-xl bg-neutral-50 border border-neutral-200">
                      <div className="w-8 h-8 rounded-lg bg-secondary-100 text-secondary-600 flex items-center justify-center shrink-0">
                        <item.icon size={16} />
                      </div>
                      <div>
                        <h4 className="font-bold text-neutral-900 text-xs">{item.label}</h4>
                        <p className="text-[10px] text-neutral-500 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <InfoBox type="tip" title="نصيحة: التقارير الدورية">
                استخدم ميزة "التقارير الدورية" لجداولة تقارير أسبوعية أو شهرية ترسل تلقائياً
                للإدارة والمنسقين. هذا يضمن اطلاع الجميع على آخر المستجدات دون الحاجة لإعداد التقارير يدوياً.
              </InfoBox>
            </div>
          </GuideSection>

          {/* === 8. Knowledge Library === */}
          <GuideSection id="library" icon={Library} title="المكتبة المعرفية" subtitle="إدارة المحتوى المعرفي والموارد الرقمية">
            <div className="space-y-5">
              <p className="text-sm text-neutral-700 leading-relaxed">
                المكتبة المعرفية هي مستودع مركزي للموارد الرقمية: الأدلة، القوالب، أفضل الممارسات،
                والمواد التدريبية. يمكن تصنيف المحتوى والبحث فيه بسهولة.
              </p>

              <ImagePlaceholder label="صورة توضيحية: المكتبة المعرفية" height="h-56" icon={Library} />

              <div>
                <h3 className="font-bold text-neutral-900 mb-3 text-sm">تصنيفات المحتوى</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'دليل (Manual)', color: 'bg-primary-100 text-primary-700 border-primary-200' },
                    { label: 'أفضل الممارسات', color: 'bg-green-100 text-green-700 border-green-200' },
                    { label: 'حقيبة أدوات', color: 'bg-secondary-100 text-secondary-700 border-secondary-200' },
                    { label: 'قوالب', color: 'bg-blue-100 text-blue-700 border-blue-200' },
                    { label: 'مواد تدريبية', color: 'bg-purple-100 text-purple-700 border-purple-200' },
                    { label: 'وثائق', color: 'bg-amber-100 text-amber-700 border-amber-200' },
                  ].map(cat => (
                    <span key={cat.label} className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${cat.color}`}>
                      {cat.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { icon: Upload, title: 'رفع المحتوى', desc: 'يمكنك رفع ملفات PDF, Word, صور، وروابط خارجية.' },
                  { icon: Search, title: 'بحث ذكي', desc: 'ابحث في عناوين وأوصاف المحتوى بسرعة.' },
                  { icon: Filter, title: 'تصفية حسب التصنيف', desc: 'فلترة المحتوى حسب النوع أو التصنيف.' },
                  { icon: Eye, title: 'معاينة الملفات', desc: 'معاينة الملفات مباشرة قبل التحميل.' },
                ].map(item => (
                  <div key={item.title} className="flex gap-3 p-3.5 rounded-xl bg-neutral-50 border border-neutral-200">
                    <div className="w-9 h-9 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
                      <item.icon size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-neutral-900 text-sm">{item.title}</h4>
                      <p className="text-xs text-neutral-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </GuideSection>

          {/* === 9. FAQ === */}
          <GuideSection id="faq" icon={HelpCircle} title="أسئلة شائعة" subtitle="إجابات لأكثر الأسئلة تكراراً عن النظام">
            <div className="space-y-4">
              {[
                {
                  q: 'كيف يمكنني إضافة عضو جديد؟',
                  a: 'اذهب إلى صفحة "الأعضاء" من القائمة الجانبية، ثم اضغط على زر "إضافة عضو جديد". أدخل البيانات المطلوبة (الاسم، البريد الإلكتروني، الدولة) واضغط "حفظ". سيتم إنشاء ملف موحد (Unified ID) تلقائياً.',
                },
                {
                  q: 'ما هو Unified ID ولماذا هو مهم؟',
                  a: 'Unified ID هو رقم تعريف فريد لكل مستفيد في المنظومة. يضمن عدم تكرار البيانات ويتيح تتبع رحلة العضو عبر جميع المنصات والبرامج. هو أساس جودة البيانات ودقة التقارير.',
                },
                {
                  q: 'كيف أعرض رحلة العضو الكاملة؟',
                  a: 'في صفحة "الأعضاء"، انقر على أيقونة المسار (Route) بجانب اسم العضو. ستظهر نافذة منبثقة (Modal) تعرض timeline تفاعلي لجميع مراحل الرحلة الثمانية مع حالة كل مرحلة.',
                },
                {
                  q: 'كيف أقوم بتحديث بيانات عضو؟',
                  a: 'اذهب إلى صفحة العضو بالضغط على "فتح الملف" من جدول الأعضاء. في صفحة الملف الشخصي، يمكنك تعديل جميع البيانات وإضافة تسجيلات في البرامج والأنشطة.',
                },
                {
                  q: 'ما الفرق بين المنصة والبرنامج والنشاط؟',
                  a: 'المنصة هي الإطار العام (مثل: منصة التقنية). تحتوي المنصة على برامج (مثل: برنامج تطوير الويب). البرنامج يحتوي على أنشطة (مثل: ورشة عمل React). كل مستوى له صفحات إدارة خاصة به.',
                },
                {
                  q: 'كيف أقوم بإنشاء تقرير مخصص؟',
                  a: 'اذهب إلى صفحة "التقارير" من القائمة الجانبية. يمكنك اختيار نوع التقرير، تحديد الفترة الزمنية، وتصفية البيانات حسب المنصة أو البرنامج. ثم اضغط "إنشاء تقرير" أو "تصدير".',
                },
                {
                  q: 'كيف يتم قياس رضا الأعضاء؟',
                  a: 'يتم قياس الرضا من خلال استبيانات دورية ترسل للأعضاء بعد إكمال البرامج والأنشطة. النتائج تظهر تلقائياً في لوحة القيادة تحت قسم "قياس الأثر والفاعلية".',
                },
                {
                  q: 'ماذا تعني ألوان المراحل في مسار الرحلة؟',
                  a: 'كل مرحلة لها لون مميز: الاكتشاف (رمادي)، التقديم والتأهيل (أخضر فاتح)، النشط (أخضر)، المتقدم (ذهبي)، التخرج (أزرق)، الخريج (أخضر)، السفير (ذهبي غامق). تساعد الألوان في التعرف البصري السريع على مرحلة العضو.',
                },
                {
                  q: 'كيف أضيف منصة جديدة؟',
                  a: 'اذهب إلى صفحة "المنصات"، اضغط على "إضافة منصة". أدخل اسم المنصة، وصفها، ارفع الشعار وصورة الغلاف، واختر لوناً مميزاً للمنصة. يمكنك بعد ذلك إضافة البرامج والمشاريع المرتبطة بها.',
                },
                {
                  q: 'هل يمكنني استيراد بيانات أعضاء من ملف؟',
                  a: 'نعم، في صفحة "الأعضاء" يوجد زر "استيراد" يسمح برفع ملف CSV أو Excel ببيانات الأعضاء. النظام يتحقق من التكرار تلقائياً ويدمج البيانات الجديدة مع الموجود.',
                },
              ].map((faq, i) => (
                <FaqItem key={i} question={faq.q} answer={faq.a} />
              ))}
            </div>
          </GuideSection>

        </div>

        {/* ─── Footer ─── */}
        <div className="mt-10 p-6 rounded-2xl bg-gradient-to-br from-neutral-50 to-neutral-100 border border-neutral-200 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <BookOpen size={20} className="text-primary-600" />
            <h3 className="font-bold text-neutral-900">هل تحتاج مساعدة إضافية؟</h3>
          </div>
          <p className="text-sm text-neutral-600 mb-4">
            إذا لم تجد الإجابة التي تبحث عنها، يمكنك التواصل مع فريق الدعم أو مراجعة الأقسام الأخرى في النظام.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/" className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-bold no-underline hover:bg-primary-700 transition-colors">
              العودة للصفحة الرئيسية
            </Link>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
