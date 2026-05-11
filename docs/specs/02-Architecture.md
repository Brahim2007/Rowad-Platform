# البنية التقنية (Architecture)
## منصة شبكة الرواد الإلكترونية

---

## 1. حزمة التقنيات (Tech Stack)

### Frontend
```yaml
Framework: Next.js 15 (App Router)
Language: TypeScript 5.4+
UI Library: React 19
Styling: Tailwind CSS 3.4+
Components: shadcn/ui
Icons: lucide-react
Fonts: 
  - IBM Plex Sans Arabic (Arabic - الخط الأساسي)
  - Inter (English)
Forms: react-hook-form + zod
Animations: framer-motion
i18n: next-intl
Date Picker: react-day-picker
Phone Input: react-phone-number-input
File Upload: react-dropzone
Toast: sonner
State Management: zustand (للحالات العامة)
HTTP Client: native fetch + SWR
```

### Backend
```yaml
Runtime: Node.js 20+ LTS
Framework: Next.js API Routes / Server Actions
Database: PostgreSQL 16
ORM: Prisma 5+
Authentication: NextAuth.js v5 (للوحة الإدارة)
File Storage: Cloudinary / Local (في التطوير)
Validation: Zod
Logging: Pino
```

### DevOps
```yaml
Hosting: Vercel (Frontend + API)
Database Hosting: Neon / Supabase / Railway
Storage: AWS S3 / Cloudinary
CDN: Vercel Edge Network
CI/CD: GitHub Actions
Environment: Vercel Environments (dev, staging, prod)
```

---

## 2. هيكل المجلدات (Folder Structure)

```
rowad-platform/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── public/
│   ├── fonts/
│   │   ├── IBMPlexSansArabic-Regular.woff2
│   │   ├── IBMPlexSansArabic-Medium.woff2
│   │   ├── IBMPlexSansArabic-SemiBold.woff2
│   │   └── IBMPlexSansArabic-Bold.woff2
│   ├── images/
│   │   ├── logo.svg
│   │   ├── hero-bg.jpg
│   │   └── partners/
│   ├── locales/
│   │   ├── ar.json
│   │   └── en.json
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx                    # الصفحة الرئيسية
│   │   │   ├── about/
│   │   │   │   └── page.tsx                # عن الشبكة
│   │   │   ├── projects/
│   │   │   │   ├── page.tsx                # قائمة المشاريع
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx            # تفاصيل المشروع
│   │   │   ├── platforms/
│   │   │   │   ├── page.tsx                # قائمة المنصات
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx            # تفاصيل المنصة ← برامج ← أنشطة
│   │   │   ├── team/
│   │   │   │   └── page.tsx                # فريق العمل
│   │   │   ├── contact/
│   │   │   │   └── page.tsx                # تواصل معنا
│   │   │   └── admin/
│   │   │       ├── layout.tsx
│   │   │       ├── login/
│   │   │       │   └── page.tsx
│   │   │       ├── dashboard/
│   │   │       │   └── page.tsx
│   │   │       ├── projects/
│   │   │       │   ├── page.tsx
│   │   │       │   └── [id]/
│   │   │       │       └── page.tsx
│   │   │       ├── platforms/
│   │   │       │   ├── page.tsx
│   │   │       │   └── [slug]/
│   │   │       │       └── page.tsx
│   │   │       ├── team/
│   │   │       │   └── page.tsx
│   │   │       └── content/
│   │   │           └── page.tsx
│   │   ├── api/
│   │   │   ├── projects/
│   │   │   │   └── route.ts
│   │   │   ├── platforms/
│   │   │   │   └── route.ts
│   │   │   ├── platforms/
│   │   │   │   └── [slug]/
│   │   │   │       └── route.ts
│   │   │   ├── team/
│   │   │   │   └── route.ts
│   │   │   ├── contact/
│   │   │   │   └── route.ts
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/
│   │   │   │       └── route.ts
│   │   │   └── admin/
│   │   │       ├── projects/
│   │   │       │   └── route.ts
│   │   │       ├── platforms/
│   │   │       │   └── route.ts
│   │   │       ├── team/
│   │   │       │   └── route.ts
│   │   │       └── content/
│   │   │           └── route.ts
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                             # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── ... (shadcn components)
│   │   ├── landing/
│   │   │   ├── Hero.tsx
│   │   │   ├── AboutNetwork.tsx
│   │   │   ├── FeaturedProjects.tsx
│   │   │   ├── StatsCounter.tsx
│   │   │   ├── TeamCarousel.tsx
│   │   │   ├── PartnersShowcase.tsx
│   │   │   ├── CTASection.tsx
│   │   │   └── Footer.tsx
│   │   ├── projects/
│   │   │   ├── ProjectCard.tsx
│   │   │   ├── ProjectDetail.tsx
│   │   │   └── ProjectFilters.tsx
│   │   ├── platforms/
│   │   │   ├── PlatformCard.tsx
│   │   │   ├── PlatformDetail.tsx
│   │   │   ├── ProgramCard.tsx
│   │   │   ├── ActivityCard.tsx
│   │   │   └── PlatformGrid.tsx
│   │   ├── team/
│   │   │   ├── MemberCard.tsx
│   │   │   └── MemberDetail.tsx
│   │   ├── admin/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── ContentEditor.tsx
│   │   │   ├── PlatformsManager.tsx
│   │   │   ├── ProgramsManager.tsx
│   │   │   ├── ProjectsManager.tsx
│   │   │   └── TeamManager.tsx
│   │   ├── shared/
│   │   │   ├── Navbar.tsx
│   │   │   ├── LanguageSwitcher.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   └── motion/
│   │       ├── FadeIn.tsx
│   │       └── StaggerContainer.tsx
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── auth.ts
│   │   ├── validations/
│   │   │   ├── project.ts
│   │   │   ├── platform.ts
│   │   │   ├── team.ts
│   │   │   └── contact.ts
│   │   ├── utils/
│   │   │   ├── cn.ts
│   │   │   ├── format-date.ts
│   │   │   └── slugify.ts
│   │   ├── constants/
│   │   │   └── site.ts
│   │   ├── rate-limit.ts
│   │   └── logger.ts
│   ├── hooks/
│   │   ├── useMediaQuery.ts
│   │   └── useDebounce.ts
│   ├── types/
│   │   ├── project.ts
│   │   ├── platform.ts
│   │   ├── team.ts
│   │   └── api.ts
│   ├── i18n/
│   │   ├── config.ts
│   │   ├── routing.ts
│   │   └── request.ts
│   └── middleware.ts                       # Locale + Auth middleware
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.example
├── .env.local
├── .eslintrc.json
├── .gitignore
├── .prettierrc
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## 3. تدفق البيانات (Data Flow)

### تدفق المحتوى العام

```
المستخدم → الواجهة (الصفحة الرئيسية)
         ↓
    Server Component (Next.js 15)
         ↓
    Prisma → PostgreSQL (استعلام)
         ↓
    Render (RSC + Client Components)
         ↓
    عرض المحتوى
```

### تدفق إدارة المحتوى (Admin)

```
Admin → /admin/login
       ↓
   NextAuth Credentials Provider
       ↓
   JWT Token (httpOnly cookie)
       ↓
   لوحة التحكم
       ↓
   CRUD Operations عبر API
       ↓
   Middleware: Verify JWT
       ↓
   Prisma Queries
       ↓
   Return Response
```

---

## 4. تصميم الـ API

### Public APIs

#### `GET /api/projects`
**الوصف**: الحصول على قائمة المشاريع

**Query**:
- `page`: number (default 1)
- `limit`: number (default 20)
- `category`: string (optional)

**Response**:
```typescript
{
  success: true,
  data: {
    projects: Project[],
    total: number,
    page: number
  }
}
```

#### `GET /api/projects/:id`
**الوصف**: الحصول على تفاصيل مشروع محدد

#### `GET /api/platforms`
**الوصف**: الحصول على قائمة المنصات مع برامجها

**Response**:
```typescript
{
  success: true,
  data: {
    platforms: Platform[]  // كل منصة تتضمن برامجها
  }
}
```

#### `GET /api/platforms/:slug`
**الوصف**: الحصول على تفاصيل منصة محددة مع برامجها وأنشطتها

**Response**:
```typescript
{
  success: true,
  data: {
    platform: Platform,
    programs: Program[]  // كل برنامج يتضمن أنشطته
  }
}
```

#### `GET /api/team`
**الوصف**: الحصول على قائمة فريق العمل

#### `POST /api/contact`
**الوصف**: إرسال رسالة تواصل

**Request Body**:
```typescript
{
  name: string
  email: string
  subject: string
  message: string
}
```

### Admin APIs (Protected)

#### `GET /api/admin/projects`
إدارة المشاريع (CRUD)

#### `POST /api/admin/projects`
إنشاء مشروع جديد

#### `PATCH /api/admin/projects/:id`
تحديث مشروع

#### `DELETE /api/admin/projects/:id`
حذف مشروع

#### `GET/POST /api/admin/platforms`
إدارة المنصات (CRUD)

#### `PATCH/DELETE /api/admin/platforms/:id`
تحديث/حذف منصة

#### `POST /api/admin/platforms/:id/programs`
إضافة برنامج إلى منصة

#### `PATCH/DELETE /api/admin/programs/:id`
تحديث/حذف برنامج

#### `POST /api/admin/programs/:id/activities`
إضافة نشاط إلى برنامج

#### `PATCH/DELETE /api/admin/activities/:id`
تحديث/حذف نشاط

#### `GET/POST /api/admin/team`
إدارة فريق العمل

#### `GET/POST /api/admin/content`
إدارة المحتوى العام للمنصة

---

## 5. اعتبارات الأمان

### Authentication & Authorization
- **Public Endpoints**: `/api/*` → Rate limited للنماذج
- **Admin Endpoints**: `/api/admin/*` → JWT verification + Role check
- **Middleware**: حماية مسارات `/admin/*`

### Input Validation
- Client-side: Zod schemas مع react-hook-form
- Server-side: نفس Zod schemas (single source of truth)
- File validation: نوع الملف، الحجم، Magic numbers

### Rate Limiting
```typescript
- Admin login: 5 attempts / 15 minutes per IP
- Contact form: 3 submissions / 10 minutes per IP
```

### CORS
```typescript
- Production: domain whitelist only
- Development: localhost allowed
```

### Headers
```typescript
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security: max-age=31536000
- Content-Security-Policy: configured strictly
```

---

## 6. استراتيجية النشر (Deployment Strategy)

### Environments
1. **Development** (local): `npm run dev`
2. **Preview** (Vercel): كل PR يحصل على preview URL
3. **Production** (Vercel): main branch

### Database Migrations
```bash
# Development
npx prisma migrate dev --name <migration_name>

# Production
npx prisma migrate deploy
```

### Environment Variables
```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
NEXT_PUBLIC_APP_URL=...
```

---

## 7. مراقبة الأداء (Monitoring)

- **Vercel Analytics**: Web Vitals
- **Pino Logger**: Structured logs
- **Database Monitoring**: Neon/Supabase dashboard

---

## 8. خطة التوسع (Scalability)

### قصير المدى
- Vercel Hobby/Pro
- Neon Free Tier
- Cloudinary Free Tier

### متوسط المدى
- Vercel Pro
- Neon Launch Plan
- CDN للصور (Cloudinary)
- Redis caching

### طويل المدى
- Database read replicas
- Edge caching للصفحة الرئيسية
- إضافة CDN عالمي
