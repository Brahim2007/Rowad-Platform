# خارطة طريق التنفيذ
## Implementation Roadmap & Build Order - منصة شبكة الرواد

---

## مقدمة

هذا الملف يوجّه ترتيب بناء المنصة خطوة بخطوة. كل مرحلة تبني على السابقة. **اتبع الترتيب** ولا تقفز للخطوات اللاحقة قبل إكمال السابقة.

---

## المرحلة 0: التهيئة (Setup) — 1 يوم

### 0.1 إنشاء المشروع
```bash
npx create-next-app@latest rowad-platform \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*"

cd rowad-platform
```

### 0.2 تثبيت المكتبات الأساسية
```bash
# Forms & Validation
npm install react-hook-form zod @hookform/resolvers

# Database
npm install prisma @prisma/client
npm install -D tsx

# UI
npm install lucide-react framer-motion
npm install class-variance-authority clsx tailwind-merge
npm install tailwindcss-animate tailwindcss-rtl

# i18n
npm install next-intl

# State & Toast
npm install zustand sonner

# Auth & Security
npm install next-auth@beta bcryptjs
npm install -D @types/bcryptjs
```

### 0.3 إعداد shadcn/ui
```bash
npx shadcn@latest init
```

اختر الإعدادات التالية:
- Style: New York
- Base color: Stone
- CSS variables: Yes

ثم أضف المكونات الأساسية:
```bash
npx shadcn@latest add button input textarea select label form 
npx shadcn@latest add checkbox card badge separator
npx shadcn@latest add dropdown-menu popover sheet table
npx shadcn@latest add tabs toast tooltip
```

### 0.4 إعداد Prisma
```bash
npx prisma init
```

ثم انسخ المخطط من `03-Database-Schema.md` إلى `prisma/schema.prisma`.

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 0.5 ملفات التهيئة
- انسخ محتويات `tailwind.config.ts` من ملف 07
- انسخ محتويات `globals.css`
- انسخ ملفات i18n
- أنشئ `.env.local` بناءً على `.env.example`
- أنشئ `.cursorrules` في الجذر

### 0.6 هيكل المجلدات
أنشئ المجلدات حسب البنية الموضحة في `02-Architecture.md`.

### ✅ معايير الإكمال
- [ ] المشروع يعمل على `npm run dev`
- [ ] Prisma متصل بقاعدة البيانات
- [ ] Tailwind يعمل بالألوان المخصصة
- [ ] الخطوط العربية محملة
- [ ] التوجيه `/ar` و `/en` يعمل

---

## المرحلة 1: المكونات الأساسية (UI Foundation) — 2 يوم

### 1.1 Layout الأساسي
**ملفات للبناء**:
- `src/app/[locale]/layout.tsx`
- `src/components/shared/Navbar.tsx`
- `src/components/landing/Footer.tsx`
- `src/components/shared/LanguageSwitcher.tsx`

**Prompt for Cursor**:
> اقرأ ملف `04-Design-System.md` و `05-UI-Components.md`. ابنِ Navbar متجاوب مع دعم RTL، يحتوي على شعار، روابط تنقل، ومبدّل لغة. استخدم نفس الألوان والخطوط من نظام التصميم.

### 1.2 Motion Components
**ملفات للبناء**:
- `src/components/motion/FadeIn.tsx`
- `src/components/motion/StaggerContainer.tsx`

### 1.3 مكون Counter للإحصائيات
**ملف**: `src/components/motion/Counter.tsx`

### ✅ معايير الإكمال
- [ ] Navbar يعمل على جميع المقاسات
- [ ] مبدّل اللغة يبدّل بين `/ar` و `/en`
- [ ] جميع المكونات تدعم RTL/LTR

---

## المرحلة 2: الصفحة الرئيسية (Landing Page) — 3 أيام

### 2.1 Hero Section
**ملف**: `src/components/landing/Hero.tsx`

**Prompt for Cursor**:
> ابنِ Hero Section حسب مواصفات `05-UI-Components.md`. أضف عنوان شبكة الرواد، وصف الرؤية، و CTA. استخدم رسم شبكي متحرك باستخدام SVG و framer-motion كعنصر بصري جانبي.

### 2.2 الأقسام المتوسطة
ابنِ هذه الأقسام بترتيب:
1. `<AboutNetworkSection />` - حول الشبكة
2. `<FeaturedPlatformsSection />` - منصات الشبكة
3. `<FeaturedProjectsSection />` - المشاريع المميزة
4. `<StatsCounterSection />` - إحصائيات الأثر
5. `<TeamCarouselSection />` - فريق العمل
6. `<PartnersShowcase />` - الشركاء

**Prompt for Cursor**:
> ابنِ FeaturedProjectsSection. كل بطاقة مشروع تحتوي على صورة، عنوان، وصف مختصر، و badge الحالة. استخدم شبكة 3 أعمدة على الديسكتوب وعمود واحد على الموبايل. hover effect: رفع البطاقة مع ظل.

### 2.3 CTA Section
**ملف**: `src/components/landing/CTASection.tsx`

ابنِ قسم CTA النهائي مع خلفية primary-700 وزر للتواصل.

### 2.4 صفحة الـ Landing الرئيسية
**ملف**: `src/app/[locale]/page.tsx`

اجمع كل الأقسام معاً.

### ✅ معايير الإكمال
- [ ] Lighthouse score > 90
- [ ] جميع الصور محسّنة (WebP/AVIF)
- [ ] Animations سلسة
- [ ] جميع النصوص من ملفات الترجمة
- [ ] الصفحة تعمل بسلاسة على الموبايل

---

## المرحلة 3: الصفحات الداخلية (Inner Pages) — 3 أيام

### 3.1 صفحة عن الشبكة
**ملف**: `src/app/[locale]/about/page.tsx`

- تاريخ الشبكة ونشأتها
- الرسالة والرؤية والقيم
- بطاقات القيم مع أيقونات

### 3.2 صفحة المنصات
**ملفات**:
- `src/app/[locale]/platforms/page.tsx`
- `src/components/platforms/PlatformCard.tsx`
- `src/components/platforms/PlatformGrid.tsx`

### 3.3 صفحة تفاصيل المنصة
**ملفات**:
- `src/app/[locale]/platforms/[slug]/page.tsx`
- `src/components/platforms/PlatformDetail.tsx`
- `src/components/platforms/ProgramCard.tsx`
- `src/components/platforms/ActivityCard.tsx`
- `src/components/platforms/ProgramsList.tsx`

**الوصف**: تعرض المنصة مع برامجها، وكل برنامج يمكن توسيعه لإظهار أنشطته.

### 3.4 صفحة المشاريع
**ملفات**:
- `src/app/[locale]/projects/page.tsx`
- `src/components/projects/ProjectCard.tsx`
- `src/components/projects/ProjectFilters.tsx`

### 3.5 صفحة تفاصيل المشروع
**ملفات**:
- `src/app/[locale]/projects/[id]/page.tsx`
- `src/components/projects/ProjectDetail.tsx`

### 3.6 صفحة الفريق
**ملف**: `src/app/[locale]/team/page.tsx`
- `src/components/team/MemberCard.tsx`

### 3.7 صفحة التواصل
**ملف**: `src/app/[locale]/contact/page.tsx`
- `src/components/contact/ContactForm.tsx`
- `src/components/contact/ContactInfo.tsx`

### ✅ معايير الإكمال
- [ ] جميع الصفحات الداخلية تعمل
- [ ] التنقل بين الصفحات سلس
- [ ] البيانات تظهر بشكل صحيح
- [ ] نموذج التواصل يعمل

---

## المرحلة 4: Backend & APIs — 2 يوم

### 4.1 Prisma Client
**ملف**: `src/lib/prisma.ts`

### 4.2 API Routes

**ملفات**:
- `src/app/api/contact/route.ts` - POST لإرسال رسالة
- `src/app/api/platforms/route.ts` - GET لجلب المنصات
- `src/app/api/platforms/[slug]/route.ts` - GET لتفاصيل المنصة مع برامجها وأنشطتها
- `src/app/api/projects/route.ts` - GET لجلب المشاريع
- `src/app/api/projects/[id]/route.ts` - GET للتفاصيل
- `src/app/api/team/route.ts` - GET لفريق العمل

**Prompt for Cursor**:
> ابنِ API endpoint `/api/contact` يقبل POST. تحقق بـ Zod، احفظ في Prisma، أرجع `{ success: true, data: { id } }`. عالج جميع الأخطاء.

### ✅ معايير الإكمال
- [ ] الـ API يعمل end-to-end
- [ ] البيانات تُحفظ بشكل صحيح في DB
- [ ] الأخطاء تُعالج بشكل ودود

---

## المرحلة 5: لوحة الإدارة (Admin Dashboard) — 3 أيام

### 5.1 Authentication
**ملفات**:
- `src/lib/auth.ts` - NextAuth config
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/app/[locale]/admin/login/page.tsx`

استخدم Credentials Provider مع bcrypt.

### 5.2 Middleware
**ملف**: `src/middleware.ts`

حماية مسارات `/admin/*`.

### 5.3 لوحة التحكم الرئيسية
**ملفات**:
- `src/app/[locale]/admin/layout.tsx`
- `src/app/[locale]/admin/dashboard/page.tsx`

KPI cards + روابط سريعة.

### 5.4 إدارة المنصات
**ملف**: `src/app/[locale]/admin/platforms/page.tsx`

- جدول المنصات مع Sort وبحث
- إضافة/تعديل/حذف منصة
- إدارة البرامج ضمن كل منصة
- إدارة الأنشطة ضمن كل برنامج
- ترتيب المنصات والبرامج والأنشطة
- رفع شعار المنصة ولونها المميز
- هيكل هرمي: منصة ← برامج ← أنشطة

### 5.5 إدارة المشاريع
**ملف**: `src/app/[locale]/admin/projects/page.tsx`

- جدول مع Sort وبحث
- إضافة/تعديل/حذف مشروع
- رفع صورة الغلاف

### 5.6 إدارة الفريق
**ملف**: `src/app/[locale]/admin/team/page.tsx`

- قائمة أعضاء الفريق
- إضافة/تعديل/حذف عضو

### 5.7 صفحة المحتوى
**ملف**: `src/app/[locale]/admin/content/page.tsx`

- إدارة المحتوى الثابت للمنصة
- تعديل نصوص الصفحات

### 5.8 Admin APIs
**ملفات**:
- `src/app/api/admin/platforms/route.ts`
- `src/app/api/admin/projects/route.ts`
- `src/app/api/admin/team/route.ts`
- `src/app/api/admin/content/route.ts`

### ✅ معايير الإكمال
- [ ] تسجيل الدخول آمن
- [ ] إدارة المنصات تعمل مع البرامج والأنشطة (CRUD)
- [ ] إدارة المشاريع تعمل (CRUD)
- [ ] إدارة الفريق تعمل
- [ ] المحتوى قابل للتعديل

---

## المرحلة 6: التحسينات والاختبار — 2 يوم

### 6.1 الأداء
- تشغيل Lighthouse على الصفحات الرئيسية
- تحسين الصور
- إضافة `loading.tsx` للصفحات
- تحسين bundle size

### 6.2 SEO
- إضافة `metadata` لكل صفحة
- `sitemap.xml`
- `robots.txt`
- Open Graph tags

### 6.3 الاختبار
- اختبار على iOS Safari
- اختبار على Chrome Android
- اختبار على Desktop Chrome/Firefox/Safari/Edge
- اختبار التنقل بلوحة المفاتيح
- اختبار قارئ الشاشة

### 6.4 الترجمة
- مراجعة جميع النصوص العربية
- مراجعة جميع النصوص الإنجليزية
- تأكيد الـ RTL في جميع المكونات

### ✅ معايير الإكمال
- [ ] Lighthouse Performance > 90
- [ ] Lighthouse Accessibility > 95
- [ ] Lighthouse SEO > 95
- [ ] لا أخطاء في Console
- [ ] جميع الـ links تعمل
- [ ] تجربة سلسة على الموبايل

---

## المرحلة 7: النشر (Deployment) — 1 يوم

### 7.1 إعداد Vercel
1. ربط الـ GitHub repo
2. إضافة environment variables
3. تشغيل أول deployment

### 7.2 إعداد قاعدة البيانات
- إنشاء Neon أو Supabase project
- تشغيل migrations: `npx prisma migrate deploy`
- تشغيل seed: `npx prisma db seed`

### 7.3 إعداد الخدمات الخارجية
- Resend: للتواصل (اختياري)
- Cloudinary: للصور (اختياري)

### 7.4 الدومين والـ DNS
- ربط الدومين الرسمي
- إعداد SSL
- اختبار جميع الروابط

### ✅ معايير الإكمال
- [ ] الموقع يعمل على الدومين الرسمي
- [ ] HTTPS مفعّل
- [ ] جميع البيئات (env vars) صحيحة

---

## ملخص الإطار الزمني

| المرحلة | المدة | المخرجات |
|---------|------|----------|
| 0. التهيئة | 1 يوم | مشروع جاهز للتطوير |
| 1. UI Foundation | 2 يوم | مكونات أساسية |
| 2. Landing Page | 3 أيام | صفحة رئيسية كاملة |
| 3. الصفحات الداخلية | 3 أيام | المنصات، المشاريع، الفريق، التواصل |
| 4. Backend & APIs | 2 يوم | API كامل + DB |
| 5. Admin Dashboard | 3 أيام | لوحة إدارة كاملة |
| 6. التحسينات | 2 يوم | جودة عالية |
| 7. النشر | 1 يوم | الموقع لايف |
| **المجموع** | **17 يوم عمل** | **منصة كاملة** |

---

## نصائح للعمل

### 1. ابدأ كل جلسة بقراءة السياق
```
@01-PRD.md @04-Design-System.md @.cursorrules
ساعدني في بناء [اسم المكون]
```

### 2. اجعل المهام صغيرة
بدلاً من: "ابنِ كل الصفحات"
استخدم: "ابنِ ProjectCard مع صورة، عنوان، وصف، وحالة"

### 3. راجع كل خطوة
بعد كل مكون:
- اختبره يدوياً
- تحقق من تطابقه مع المواصفات

### 4. احفظ الـ context
ضع الملفات المرجعية في `.cursor/` لإعادة الاستخدام.
