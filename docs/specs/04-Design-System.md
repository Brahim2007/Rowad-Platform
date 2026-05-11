# نظام التصميم (Design System)
## منصة شبكة الرواد الإلكترونية

---

## 1. الفلسفة التصميمية

### المبادئ الأساسية
1. **الاحتراف**: تصميم يعكس مكانة منظمة دولية شبابية
2. **الانتماء**: عناصر بصرية مستوحاة من التراث العربي بشكل عصري
3. **الوضوح**: أولوية للمحتوى والقراءة، خاصة باللغة العربية
4. **الدينامية**: إحساس بالحركة والشبكية يعكس طبيعة المشروع
5. **الإنسانية**: ألوان دافئة وعناصر تحاكي الطابع الإنساني

### الإلهام البصري
- الفسيفساء الروادية الحديثة
- خرائط البيانات والشبكات
- الخط العربي الحر
- ألوان الأرض والشمس في بلاد الشام

---

## 2. الألوان (Color Palette)

### الألوان الأساسية (Primary)
الأخضر الزيتوني — مستوحى من شجرة الزيتون رمز بلاد الشام

```css
--primary-50:  #F2F7F1;
--primary-100: #DEEADC;
--primary-200: #BFD5BA;
--primary-300: #95B98C;
--primary-400: #6E9C62;
--primary-500: #527F47;  /* اللون الأساسي */
--primary-600: #3F6336;
--primary-700: #324E2C;
--primary-800: #283E24;
--primary-900: #20321E;
--primary-950: #101A0F;
```

### الألوان الثانوية (Secondary)
الذهبي الترابي — يعكس الدفء والتراث

```css
--secondary-50:  #FBF7F0;
--secondary-100: #F4ECD6;
--secondary-200: #E8D5A8;
--secondary-300: #D9B872;
--secondary-400: #CB9D4A;
--secondary-500: #B8853A;  /* اللون الثانوي */
--secondary-600: #9B6E2F;
--secondary-700: #7C5728;
--secondary-800: #634626;
--secondary-900: #503923;
```

### الألوان المحايدة (Neutral)
رمادي دافئ مائل قليلاً للبيج

```css
--neutral-50:  #FAFAF9;
--neutral-100: #F5F4F1;
--neutral-200: #E8E6E0;
--neutral-300: #D4D1C8;
--neutral-400: #A8A496;
--neutral-500: #7C7868;
--neutral-600: #5C5849;
--neutral-700: #45423A;
--neutral-800: #2D2B26;
--neutral-900: #1A1916;
--neutral-950: #0F0E0C;
```

### ألوان الحالة (Semantic)
```css
/* Success */
--success-50:  #F0FDF4;
--success-500: #22C55E;
--success-700: #15803D;

/* Warning */
--warning-50:  #FFFBEB;
--warning-500: #F59E0B;
--warning-700: #B45309;

/* Error */
--error-50:  #FEF2F2;
--error-500: #EF4444;
--error-700: #B91C1C;

/* Info */
--info-50:  #EFF6FF;
--info-500: #3B82F6;
--info-700: #1D4ED8;
```

### قواعد استخدام الألوان
- **النصوص الأساسية**: `neutral-900` على خلفية فاتحة
- **النصوص الثانوية**: `neutral-600`
- **النصوص اللطيفة**: `neutral-500`
- **الأزرار الأساسية**: `primary-600` مع نص أبيض
- **الأزرار الثانوية**: `secondary-500` مع نص أبيض
- **الحدود**: `neutral-200` أو `neutral-300`
- **الخلفيات الفاتحة**: `neutral-50` أو `primary-50`

---

## 3. الطباعة (Typography)

### الخطوط
```css
/* العربية - الخط الأساسي */
--font-arabic: 'IBM Plex Sans Arabic', system-ui, sans-serif;

/* الإنجليزية */
--font-english: 'Inter', 'IBM Plex Sans', system-ui, sans-serif;

/* الأرقام (Tabular) */
--font-mono: 'IBM Plex Mono', monospace;
```

### المقاييس (Type Scale)
```css
/* Display - للعناوين الكبيرة جداً */
--text-display-2xl: 4.5rem;   /* 72px */ - line-height: 1.1
--text-display-xl:  3.75rem;  /* 60px */ - line-height: 1.1
--text-display-lg:  3rem;     /* 48px */ - line-height: 1.15

/* Headings */
--text-h1: 2.25rem;   /* 36px */ - line-height: 1.2  - weight: 700
--text-h2: 1.875rem;  /* 30px */ - line-height: 1.25 - weight: 700
--text-h3: 1.5rem;    /* 24px */ - line-height: 1.3  - weight: 600
--text-h4: 1.25rem;   /* 20px */ - line-height: 1.4  - weight: 600
--text-h5: 1.125rem;  /* 18px */ - line-height: 1.4  - weight: 600
--text-h6: 1rem;      /* 16px */ - line-height: 1.5  - weight: 600

/* Body */
--text-lg:    1.125rem; /* 18px */ - line-height: 1.7
--text-base:  1rem;     /* 16px */ - line-height: 1.7
--text-sm:    0.875rem; /* 14px */ - line-height: 1.6
--text-xs:    0.75rem;  /* 12px */ - line-height: 1.5
```

### الأوزان (Font Weights)
```css
--font-light:    300
--font-regular:  400
--font-medium:   500
--font-semibold: 600
--font-bold:     700
```

### قواعد الطباعة العربية
- **ارتفاع السطر للعربية**: استخدم `line-height: 1.8` للنصوص الطويلة
- **التباعد بين الحروف**: `letter-spacing: 0` (لا تستخدم تباعد للعربية)
- **محاذاة النص**: `text-align: start` (تتكيف تلقائياً مع RTL)
- **التشكيل**: لا تستخدمه إلا في النصوص الدينية أو الشعرية

---

## 4. المسافات (Spacing)

نظام مبني على وحدة 4px

```css
--space-0:    0;
--space-0.5:  0.125rem;  /* 2px */
--space-1:    0.25rem;   /* 4px */
--space-2:    0.5rem;    /* 8px */
--space-3:    0.75rem;   /* 12px */
--space-4:    1rem;      /* 16px */
--space-5:    1.25rem;   /* 20px */
--space-6:    1.5rem;    /* 24px */
--space-8:    2rem;      /* 32px */
--space-10:   2.5rem;    /* 40px */
--space-12:   3rem;      /* 48px */
--space-16:   4rem;      /* 64px */
--space-20:   5rem;      /* 80px */
--space-24:   6rem;      /* 96px */
--space-32:   8rem;      /* 128px */
```

### المسافات بين الأقسام
- **داخل المكونات**: 16-24px
- **بين المكونات**: 32-48px
- **بين الأقسام**: 64-96px على الديسكتوب، 48-64px على الموبايل

---

## 5. الحدود والزوايا (Borders & Radius)

### Border Radius
```css
--radius-none: 0;
--radius-sm:   0.25rem;  /* 4px */
--radius-md:   0.5rem;   /* 8px - الافتراضي */
--radius-lg:   0.75rem;  /* 12px */
--radius-xl:   1rem;     /* 16px */
--radius-2xl:  1.5rem;   /* 24px */
--radius-full: 9999px;
```

### Border Width
```css
--border-thin:   1px;
--border-medium: 2px;
--border-thick:  3px;
```

---

## 6. الظلال (Shadows)

```css
--shadow-xs:  0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-sm:  0 1px 3px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.07);
--shadow-md:  0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.08);
--shadow-lg:  0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.08);
--shadow-xl:  0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.08);
--shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.15);

/* ظلال مخصصة */
--shadow-glow-primary: 0 0 30px -5px rgb(82 127 71 / 0.4);
--shadow-card-hover: 0 12px 24px -8px rgb(0 0 0 / 0.12);
```

---

## 7. الحركة (Motion)

### Durations
```css
--duration-fast:    150ms;
--duration-normal:  250ms;
--duration-slow:    400ms;
--duration-slower:  600ms;
```

### Easings
```css
--ease-linear:   linear;
--ease-in:       cubic-bezier(0.4, 0, 1, 1);
--ease-out:      cubic-bezier(0, 0, 0.2, 1);
--ease-in-out:   cubic-bezier(0.4, 0, 0.2, 1);
--ease-spring:   cubic-bezier(0.34, 1.56, 0.64, 1);  /* للحركات المرحة */
```

### قواعد الحركة
- **الأزرار**: 150ms ease-out على hover
- **التحولات بين الخطوات**: 300ms ease-in-out
- **ظهور المحتوى**: 400ms ease-out مع slide-up خفيف
- **Stagger**: 50-100ms بين العناصر

---

## 8. مكونات الواجهة (UI Components)

### الأزرار (Buttons)

#### Primary Button
```tsx
className="
  inline-flex items-center justify-center
  px-6 py-3 
  bg-primary-600 hover:bg-primary-700 active:bg-primary-800
  text-white font-semibold 
  rounded-lg 
  shadow-md hover:shadow-lg
  transition-all duration-200
  focus:outline-none focus:ring-4 focus:ring-primary-200
  disabled:opacity-50 disabled:cursor-not-allowed
"
```

#### Secondary Button
```tsx
className="
  inline-flex items-center justify-center
  px-6 py-3 
  bg-secondary-500 hover:bg-secondary-600
  text-white font-semibold 
  rounded-lg
  transition-all duration-200
  focus:ring-4 focus:ring-secondary-200
"
```

#### Outline Button
```tsx
className="
  inline-flex items-center justify-center
  px-6 py-3 
  bg-transparent
  border-2 border-primary-600 hover:bg-primary-50
  text-primary-700 font-semibold 
  rounded-lg
  transition-all duration-200
"
```

### حقول الإدخال (Inputs)

```tsx
className="
  w-full px-4 py-3
  bg-white
  border border-neutral-300 
  rounded-lg
  text-neutral-900 placeholder:text-neutral-400
  focus:border-primary-500 focus:ring-4 focus:ring-primary-100
  transition-colors duration-200
  disabled:bg-neutral-50 disabled:text-neutral-500
"

/* حالة الخطأ */
className="border-error-500 focus:ring-error-100"
```

### البطاقات (Cards)

```tsx
className="
  bg-white
  border border-neutral-200
  rounded-xl
  p-6
  shadow-sm hover:shadow-md
  transition-shadow duration-200
"
```

### Badges

```tsx
/* Primary */
"inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"

/* Success */
"bg-success-50 text-success-700"

/* Warning */
"bg-warning-50 text-warning-700"

/* Error */
"bg-error-50 text-error-700"
```

---

## 9. شبكة التصميم (Grid System)

### Container
```css
.container-app {
  max-width: 1280px;
  margin-left: auto;
  margin-right: auto;
  padding-left: 1rem;
  padding-right: 1rem;
}

@media (min-width: 768px) {
  .container-app {
    padding-left: 2rem;
    padding-right: 2rem;
  }
}

@media (min-width: 1280px) {
  .container-app {
    padding-left: 3rem;
    padding-right: 3rem;
  }
}
```

### Breakpoints
```css
--bp-sm:  640px;
--bp-md:  768px;
--bp-lg:  1024px;
--bp-xl:  1280px;
--bp-2xl: 1536px;
```

---

## 10. أيقونات وعناصر بصرية

### مكتبة الأيقونات
**lucide-react** هي المكتبة الأساسية:
```tsx
import { Database, Users, Network, BarChart3, FileSpreadsheet, ArrowLeft } from 'lucide-react'
```

### حجم الأيقونات
- صغير: 16px
- متوسط: 20px
- كبير: 24px
- كبير جداً: 32-48px

### أنماط الأيقونات
- استخدم `stroke-width: 1.5` للأيقونات الكبيرة
- استخدم `stroke-width: 2` للأيقونات الصغيرة (الافتراضي)

---

## 11. الصور والوسائط

### نسب الصور
- Hero: 16:9 أو 21:9
- Cards: 4:3 أو 1:1
- Avatars: 1:1 (دائرية)
- Banners: 3:1

### تحسين الصور
- استخدم `next/image` دائماً
- صيغ: WebP/AVIF أساسية، JPG fallback
- Lazy loading للصور غير المرئية

---

## 12. RTL Support

### قواعد عامة
- استخدم `dir="rtl"` على `<html>` للعربية
- استخدم منطق Tailwind المنطقي:
  - `ms-` بدلاً من `ml-` (margin-start)
  - `me-` بدلاً من `mr-` (margin-end)
  - `ps-` بدلاً من `pl-`
  - `pe-` بدلاً من `pr-`
  - `start-` بدلاً من `left-`
  - `end-` بدلاً من `right-`
- الأيقونات الاتجاهية: استخدم `rtl:rotate-180` للأسهم

### مثال عملي
```tsx
<div className="flex items-center gap-3">
  <ArrowLeft className="rtl:rotate-180" />
  <span>السابق</span>
</div>
```

---

## 13. أمثلة مرئية للأقسام

### Hero Section
- خلفية: تدرج من `primary-50` إلى `secondary-50` مع نمط فسيفساء خفيف
- العنوان الرئيسي: `text-display-xl` بـ `font-bold` بلون `neutral-900`
- العنوان الفرعي: `text-lg` بلون `neutral-600`
- CTA: زر primary كبير

### قسم المسؤوليات
- شبكة من البطاقات (3 أعمدة على ديسكتوب)
- كل بطاقة: أيقونة دائرية بلون `primary-100` + عنوان + وصف
- Hover: رفع البطاقة + تغير لون الأيقونة

### قسم الـ CTA النهائي
- خلفية: `primary-700` 
- نص: أبيض
- زر: `secondary-500` بارز

---

## 14. الوصول (Accessibility)

### تباين الألوان (الحد الأدنى)
- نص عادي: 4.5:1
- نص كبير (18px+): 3:1
- عناصر UI: 3:1

### Focus States
استخدم دائماً:
```css
focus:outline-none focus:ring-4 focus:ring-primary-200
```

### ARIA Labels
- جميع الأزرار الأيقونية يجب أن يكون لها `aria-label`
- النماذج يجب أن تستخدم `<label>` صريحة
- رسائل الخطأ: `aria-describedby` و `role="alert"`

---

## 15. الصوت البصري للعلامة (Brand Voice)

### الكلمات المفتاحية
- **عميق**: لا تكتفِ بالسطحية
- **شبكي**: روابط وعلاقات
- **تراكمي**: نمو مستمر
- **شبابي**: حيوي بدون استهتار
- **استراتيجي**: مدروس وواعٍ

### الكلمات التي نتجنبها
- "ثوري" / "خارق" / "رهيب"
- المبالغات والتعميمات
- الخطاب الفوقي

---

## 16. Tokens للـ Tailwind Config

سيتم تطبيق هذه القيم في ملف `tailwind.config.ts` (موجود في الملفات التقنية).
