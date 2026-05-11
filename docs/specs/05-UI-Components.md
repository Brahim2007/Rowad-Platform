# مواصفات مكونات الواجهة (UI Components Specs)
## منصة شبكة الرواد الإلكترونية

---

## 1. مكونات التخطيط (Layout Components)

### `<RootLayout />`
**الموقع**: `src/app/[locale]/layout.tsx`

**الوصف**: التخطيط الجذري للتطبيق

**المتطلبات**:
- يحدد `dir` بناءً على اللغة (`rtl` للعربية، `ltr` للإنجليزية)
- يحمّل الخطوط (IBM Plex Sans Arabic + Inter)
- يضع `<html lang>` بشكل ديناميكي
- يحتوي على `<NextIntlClientProvider>`
- يحتوي على `<Toaster>` من sonner

**Props**: `children`, `params: { locale }`

---

### `<Navbar />`
**الموقع**: `src/components/shared/Navbar.tsx`

**الوصف**: شريط التنقل العلوي

**العناصر**:
- شعار شبكة الرواد (يسار في LTR، يمين في RTL)
- روابط: الرئيسية، عن الشبكة، المنصات، المشاريع، الفريق، تواصل معنا
- مبدّل اللغة (AR/EN)

**السلوك**:
- ثابت في الأعلى مع شفافية متغيرة عند Scroll
- يصبح صلب أبيض عند Scroll > 50px
- على الموبايل: قائمة Hamburger

**التصميم**:
- ارتفاع: 72px (ديسكتوب) / 60px (موبايل)
- خلفية: شفافة → `white/95` مع backdrop-blur عند Scroll
- ظل خفيف عند Scroll: `shadow-sm`

---

### `<Footer />`
**الموقع**: `src/components/landing/Footer.tsx`

**الوصف**: تذييل الصفحة

**الأقسام**:
1. **عن شبكة الرواد**: شعار + وصف موجز
2. **روابط سريعة**: عن الشبكة، المنصات، المشاريع، الفريق
3. **تواصل معنا**: بريد إلكتروني، روابط التواصل الاجتماعي
4. **حقوق النشر**: في الأسفل

**التصميم**:
- خلفية: `neutral-900`
- نص: `neutral-300`
- ألوان مميزة: `secondary-400`

---

## 2. مكونات الصفحة الرئيسية (Landing Page)

### `<HeroSection />`
**الموقع**: `src/components/landing/Hero.tsx`

**العناصر**:
- شعار شبكة الرواد
- عنوان رئيسي: "شبكة الرواد الإلكترونية"
- عنوان فرعي: "منصة رقمية لتمكين الشباب العربي"
- وصف موجز للرؤية والرسالة
- CTA: "اكتشف المزيد" (primary)
- رسم شبكي متحرك (Network Graph) كخلفية أو عنصر جانبي

**الحركة**:
- Fade in + slide up للنصوص (stagger 100ms)
- رسم بياني تفاعلي خفيف

**Layout**:
```
ديسكتوب: عمودين (نص: 60% + رسم: 40%)
موبايل: عمود واحد، النص أولاً
```

---

### `<AboutNetworkSection />`
**الموقع**: `src/components/landing/AboutNetwork.tsx`

**العناصر**:
- عنوان: "حول شبكة الرواد"
- فقرات تعريفية: الرسالة، الرؤية، القيم
- 3 بطاقات قيم رئيسية:
  1. الانتماء
  2. الابتكار
  3. التأثير

**التصميم**:
- خلفية: `neutral-50`
- بطاقات: أيقونة + عنوان + وصف

---

### `<FeaturedPlatformsSection />`
**الموقع**: `src/components/landing/FeaturedPlatforms.tsx`

**العناصر**:
- عنوان: "منصاتنا"
- شبكة من بطاقات المنصات
- كل بطاقة: أيقونة/شعار المنصة، الاسم، وصف مختصر، عدد البرامج
- رابط "استكشف المنصات" في الأسفل

**Layout**:
```
ديسكتوب: 3-4 أعمدة
تابلت: 2 أعمدة
موبايل: عمود واحد
```

---

### `<FeaturedProjectsSection />`
**الموقع**: `src/components/landing/FeaturedProjects.tsx`

**العناصر**:
- عنوان: "مشاريعنا"
- شبكة من 3-6 بطاقات مشاريع مميزة
- كل بطاقة: صورة غلاف، عنوان، فئة، وصف مختصر، رابط "اقرأ المزيد"
- زر "عرض كل المشاريع" في الأسفل

**Layout**:
```
ديسكتوب: 3 أعمدة
تابلت: 2 أعمدة
موبايل: عمود واحد
```

**التصميم**:
- بطاقات: `rounded-xl` مع ظل، hover Effect رفع البطاقة
- الصورة: `aspect-video` مع overlay

---

### `<StatsCounterSection />`
**الموقع**: `src/components/landing/StatsCounter.tsx`

**العناصر**:
- 4 إحصائيات رئيسية (أرقام متحركة):
  - عدد المشاريع
  - عدد المستفيدين
  - عدد الشركاء
  - سنوات العمل

**التصميم**:
- خلفية: `primary-700`
- النص: أبيض
- الأرقام: `text-display-lg` بألوان `secondary-300`
- حركة: عد تصاعدي عند الظهور

---

### `<TeamCarouselSection />`
**الموقع**: `src/components/landing/TeamCarousel.tsx`

**العناصر**:
- عنوان: "فريق العمل"
- Carousel / شبكة من بطاقات الأعضاء
- كل بطاقة: صورة دائرية، الاسم، الدور، رابط السيرة

**Layout**:
- 4 أعضاء في الصف على ديسكتوب
- Carousel على الموبايل

---

### `<PartnersShowcase />`
**الموقع**: `src/components/landing/PartnersShowcase.tsx`

**العناصر**:
- عنوان: "شركاؤنا"
- شريط شعارات متحرك (أوتوماتيكي) أو شبكة شعارات
- كل شعار في بطاقة بيضاء

---

### `<CTASection />`
**الموقع**: `src/components/landing/CTASection.tsx`

**العناصر**:
- خلفية ملونة (`primary-700`) مع نمط فسيفسائي
- عنوان: "انضم إلى مسيرتنا"
- نص قصير عن المشاركة
- زر: "تواصل معنا"

---

## 3. مكونات المشاريع (Projects)

### `<ProjectCard />`
**الموقع**: `src/components/projects/ProjectCard.tsx`

**Props**:
```typescript
{
  title: string
  slug: string
  description: string
  category: string
  coverImage?: string
  status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'PLANNING'
  isFeatured?: boolean
}
```

**العناصر**:
- صورة غلاف (إن وجدت)
- شارة الحالة (نشط، مكتمل، إلخ)
- العنوان
- وصف مختصر (سطرين)
- الفئة (Badge)
- رابط "اقرأ المزيد"

---

### `<ProjectDetail />`
**الموقع**: `src/components/projects/ProjectDetail.tsx`

**العناصر**:
- صورة غلاف كبيرة
- العنوان + الحالة + الفئة
- وصف كامل
- شركاء المشروع (شعارات)
- تواريخ البداية والنهاية
- معرض صور (اختياري)

---

### `<ProjectFilters />`
**الموقع**: `src/components/projects/ProjectFilters.tsx`

**العناصر**:
- فلترة حسب الفئة
- فلترة حسب الحالة
- ترتيب (الأحدث، الأقدم)

---

## 4. مكونات المنصات (Platforms)

### `<PlatformCard />`
**الموقع**: `src/components/platforms/PlatformCard.tsx`

**Props**:
```typescript
{
  name: string
  slug: string
  description: string
  logo?: string
  color?: string
  programsCount?: number
}
```

**العناصر**:
- شعار أو أيقونة المنصة (دائرة ملونة)
- اسم المنصة
- وصف مختصر
- عدد البرامج
- رابط "استكشف المنصة"

**التصميم**:
- بطاقة مع ظل خفيف
- شريط علوي بلون المنصة المميز
- Hover: رفع البطاقة مع تغير الظل

---

### `<PlatformGrid />`
**الموقع**: `src/components/platforms/PlatformGrid.tsx`

**الوصف**: شبكة من بطاقات المنصات

**Layout**:
```
ديسكتوب: 3 أعمدة
تابلت: 2 أعمدة
موبايل: عمود واحد
```

---

### `<PlatformDetail />`
**الموقع**: `src/components/platforms/PlatformDetail.tsx`

**العناصر**:
- Header: اسم المنصة، الشعار، الوصف، الرؤية
- قائمة البرامج (Programs)

### `<ProgramCard />`
**الموقع**: `src/components/platforms/ProgramCard.tsx`

**Props**:
```typescript
{
  name: string
  description: string
  icon?: string
  activitiesCount?: number
}
```

**العناصر**:
- أيقونة
- اسم البرنامج
- وصف مختصر
- عدد الأنشطة
- Expandable لعرض الأنشطة

---

### `<ActivityCard />`
**الموقع**: `src/components/platforms/ActivityCard.tsx`

**Props**:
```typescript
{
  name: string
  description: string
  icon?: string
}
```

**العناصر**:
- أيقونة صغيرة
- اسم النشاط
- وصف مختصر

---

### `<ProgramsList />` (اختياري)
**الموقع**: `src/components/platforms/ProgramsList.tsx`

**الوصف**: عرض قائمة البرامج داخل منصة مع إمكانية التوسيع لإظهار الأنشطة

**السلوك**:
- كل برنامج يُعرض كبطاقة قابلة للضغط
- عند الضغط: يتم توسيع البرنامج لإظهار الأنشطة التابعة له
- Accordion-style

---

## 5. مكونات الفريق (Team)

### `<MemberCard />`
**الموقع**: `src/components/team/MemberCard.tsx`

**Props**:
```typescript
{
  name: string
  role: string
  avatar?: string
  bio?: string
  linkedinUrl?: string
}
```

**العناصر**:
- صورة دائرية (أو placeholder بالأحرف الأولى)
- الاسم الكامل
- الدور
- سيرة مختصرة (hover أو expand)
- رابط LinkedIn

---

### `<MemberDetail />` (اختياري)
**الموقع**: `src/components/team/MemberDetail.tsx`

- عرض موسع لسيرة العضو
- صورة أكبر
- سيرة كاملة
- روابط التواصل

---

## 6. صفحة التواصل

### `<ContactForm />`
**الموقع**: `src/components/contact/ContactForm.tsx`

**الحقول**:
- الاسم الكامل (Input)
- البريد الإلكتروني (EmailInput)
- الموضوع (Input)
- الرسالة (Textarea)

**الميزات**:
- تحقق فوري (Zod)
- زر إرسال مع حالة التحميل
- رسالة نجاح بعد الإرسال
- Rate limiting

**التصميم**:
- شبكة عمودين (الاسم + البريد)
- العرض الكامل للموضوع والرسالة

---

### `<ContactInfo />`
**العناصر**:
- البريد الإلكتروني
- مواقع التواصل (أيقونات)
- ساعات العمل (اختياري)

---

## 7. لوحة الإدارة (Admin Components)

### `<AdminLogin />`
**الحقول**:
- البريد الإلكتروني
- كلمة المرور
- زر تسجيل الدخول

**ميزات**:
- Rate limiting بصري
- رسائل خطأ واضحة

---

### `<AdminDashboard />`
**العناصر**:
- KPI Cards: عدد المشاريع، أعضاء الفريق، رسائل التواصل
- روابط سريعة للإدارة
- آخر الرسائل غير المقروءة

---

### `<PlatformsManager />`
**الميزات**:
- جدول المنصات مع Sort وبحث
- إضافة/تعديل/حذف منصة
- إدارة البرامج ضمن كل منصة (إضافة، ترتيب، تعديل، حذف)
- إدارة الأنشطة ضمن كل برنامج
- ترتيب المنصات والبرامج والأنشطة (Drag & Drop)
- رفع شعار المنصة ولونها المميز

---

### `<ProjectsManager />`
**الميزات**:
- جدول المشاريع مع Sort وبحث
- إضافة/تعديل/حذف مشروع
- تحرير المحتوى (Title, Description, Status, Category)
- رفع صورة الغلاف
- ترتيب المشاريع (Drag & Drop)

---

### `<TeamManager />`
**الميزات**:
- قائمة أعضاء الفريق
- إضافة/تعديل/حذف عضو
- رفع الصورة الشخصية
- ترتيب الأعضاء

---

## 8. Shared Components

### `<LanguageSwitcher />`
- زر بسيط: "AR | EN"
- يبدّل بين `/ar` و `/en` في الـ URL
- يحفظ التفضيل في localStorage

### `<LoadingSpinner />`
- Spinner دائري بسيط
- بألوان primary
- 3 أحجام: sm, md, lg

### `<ErrorBoundary />`
- يلتقط أخطاء React
- يعرض شاشة خطأ ودودة
- زر "إعادة المحاولة"

---

## 9. Motion Components

### `<FadeIn />`
```typescript
{
  children: ReactNode
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right'
  duration?: number
}
```

### `<StaggerContainer />`
- يطبق staggerChildren على الأبناء
- مفيد للقوائم والشبكات

### `<Counter />` (مخصص)
```typescript
{
  end: number
  duration?: number
  prefix?: string
  suffix?: string
}
```
- عد تصاعدي من 0 إلى الرقم المستهدف
- يستخدم مع إحصائيات الأثر
- يبدأ عند الظهور فيviewport

---

## 10. أمثلة على Variants

### Button Variants
- `variant="primary"` - الزر الأساسي
- `variant="secondary"` - الزر الثانوي
- `variant="outline"` - زر بإطار
- `variant="ghost"` - زر شفاف
- `variant="link"` - يبدو كرابط

### Card Variants
- `variant="default"` - بطاقة عادية
- `variant="featured"` - بطاقة مميزة (بحدود ملونة)
- `variant="interactive"` - بطاقة قابلة للضغط (hover effects)

### Sizes
- `size="sm"` - صغير
- `size="md"` - متوسط (افتراضي)
- `size="lg"` - كبير
- `size="xl"` - كبير جداً
