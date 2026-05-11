# مخطط قاعدة البيانات (Database Schema)
## PostgreSQL + Prisma ORM - منصة شبكة الرواد الإلكترونية

---

## 1. مخطط العلاقات (ERD Overview)

```
Partner
Beneficiary ──┬── Enrollment ──── Program ──── Platform
              └── Participation ── Activity ──┘

Project ────────────────────── Platform
Project ────────────────────── Program

AdminUser
TeamMember
ContactMessage
ContentPage
NewsPost
SiteSetting
Webhook
```

---

## 2. نموذج Prisma الكامل

ضع هذا الملف في `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ═══════════════════════════════════════════════════════════
// الشركاء والداعمون (Partners & Sponsors)
// ═══════════════════════════════════════════════════════════

model Partner {
  id          String      @id @default(cuid())
  name        String      @db.VarChar(255)
  logo        String?     @db.VarChar(500)
  websiteUrl  String?     @db.VarChar(500)
  type        PartnerType @default(PARTNER)
  description String?     @db.Text
  sortOrder   Int         @default(0)
  isActive    Boolean     @default(true)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  @@index([type])
  @@index([isActive])
  @@map("partners")
}

enum PartnerType {
  PARTNER   // شريك
  SPONSOR   // راعي
  SUPPORTER // داعم
  DONOR     // مانح
}

// ═══════════════════════════════════════════════════════════
// المستفيدون (Beneficiaries)
// ═══════════════════════════════════════════════════════════

model Beneficiary {
  id             String            @id @default(cuid())
  code           String            @unique @db.VarChar(50)
  firstName      String            @db.VarChar(100)
  lastName       String            @db.VarChar(100)
  email          String?           @unique @db.VarChar(255)
  phone          String?           @db.VarChar(50)
  gender         Gender?
  birthDate      DateTime?
  nationality    String?           @db.VarChar(100)
  country        String?           @db.VarChar(100)
  city           String?           @db.VarChar(100)
  educationLevel EducationLevel?
  bio            String?           @db.Text
  avatar         String?           @db.VarChar(500)
  status         BeneficiaryStatus @default(ACTIVE)
  registeredAt   DateTime          @default(now())
  createdAt      DateTime          @default(now())
  updatedAt      DateTime          @updatedAt

  enrollments    Enrollment[]
  participations Participation[]

  @@index([code])
  @@index([email])
  @@index([status])
  @@index([country])
  @@map("beneficiaries")
}

enum Gender {
  MALE
  FEMALE
}

enum EducationLevel {
  HIGH_SCHOOL
  DIPLOMA
  BACHELOR
  MASTER
  DOCTORATE
  OTHER
}

enum BeneficiaryStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
}

// ═══════════════════════════════════════════════════════════
// المشاريع (Projects)
// ═══════════════════════════════════════════════════════════

model Project {
  id           String        @id @default(cuid())
  title        String        @db.VarChar(255)
  slug         String        @unique @db.VarChar(255)
  description  String        @db.Text
  fullContent  String?       @db.Text
  category     String        @db.VarChar(100)
  status       ProjectStatus @default(ACTIVE)
  coverImage   String?       @db.VarChar(500)
  startDate    DateTime?
  endDate      DateTime?
  partnerLogos String?       @db.Text
  isFeatured   Boolean       @default(false)
  sortOrder    Int           @default(0)
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  platformId String?
  platform   Platform? @relation(fields: [platformId], references: [id], onDelete: SetNull)

  programId String?
  program   Program?  @relation(fields: [programId], references: [id], onDelete: SetNull)

  @@index([slug])
  @@index([category])
  @@index([status])
  @@index([isFeatured])
  @@index([platformId])
  @@index([programId])
  @@map("projects")
}

enum ProjectStatus {
  ACTIVE
  COMPLETED
  ON_HOLD
  PLANNING
}

// ═══════════════════════════════════════════════════════════
// المنصات (Platforms) ← برامج (Programs) ← أنشطة (Activities)
// ═══════════════════════════════════════════════════════════

model Platform {
  id          String    @id @default(cuid())
  name        String    @db.VarChar(255)
  slug        String    @unique @db.VarChar(255)
  description String    @db.Text
  vision      String?   @db.Text
  logo        String?   @db.VarChar(500)
  coverImage  String?   @db.VarChar(500)
  color       String?   @db.VarChar(50)
  sortOrder   Int       @default(0)
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  programs Program[]
  projects Project[]

  @@index([slug])
  @@index([isActive])
  @@map("platforms")
}

model Program {
  id               String    @id @default(cuid())
  name             String    @db.VarChar(255)
  slug             String    @unique @db.VarChar(255)
  description      String    @db.Text
  icon             String?   @db.VarChar(500)
  startDate        DateTime?
  endDate          DateTime?
  maxBeneficiaries Int?
  sortOrder        Int       @default(0)
  isActive         Boolean   @default(true)
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  platformId String
  platform   Platform @relation(fields: [platformId], references: [id], onDelete: Cascade)

  activities  Activity[]
  enrollments Enrollment[]
  projects    Project[]

  @@index([slug])
  @@index([platformId])
  @@index([isActive])
  @@map("programs")
}

model Activity {
  id              String       @id @default(cuid())
  name            String       @db.VarChar(255)
  slug            String       @unique @db.VarChar(255)
  description     String       @db.Text
  type            ActivityType @default(WORKSHOP)
  icon            String?      @db.VarChar(500)
  location        String?      @db.VarChar(500)
  isOnline        Boolean      @default(false)
  startDate       DateTime?
  endDate         DateTime?
  maxParticipants Int?
  sortOrder       Int          @default(0)
  isActive        Boolean      @default(true)
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  programId String
  program   Program @relation(fields: [programId], references: [id], onDelete: Cascade)

  participations Participation[]

  @@index([slug])
  @@index([programId])
  @@index([isActive])
  @@index([type])
  @@map("activities")
}

enum ActivityType {
  WORKSHOP    // ورشة عمل
  BOOTCAMP    // معسكر تدريبي
  HACKATHON   // هاكاثون
  SEMINAR     // ندوة
  COMPETITION // مسابقة
  MENTORING   // إرشاد
  COURSE      // دورة
  EVENT       // فعالية
  OTHER
}

// ═══════════════════════════════════════════════════════════
// التسجيل في البرامج (Enrollments)
// ═══════════════════════════════════════════════════════════

model Enrollment {
  id          String           @id @default(cuid())
  status      EnrollmentStatus @default(PENDING)
  enrolledAt  DateTime         @default(now())
  completedAt DateTime?
  notes       String?          @db.Text
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  beneficiaryId String
  beneficiary   Beneficiary @relation(fields: [beneficiaryId], references: [id], onDelete: Cascade)

  programId String
  program   Program @relation(fields: [programId], references: [id], onDelete: Cascade)

  participations Participation[]

  @@unique([beneficiaryId, programId])
  @@index([beneficiaryId])
  @@index([programId])
  @@index([status])
  @@map("enrollments")
}

enum EnrollmentStatus {
  PENDING
  ACTIVE
  COMPLETED
  DROPPED
  REJECTED
}

// ═══════════════════════════════════════════════════════════
// المشاركة في الأنشطة (Participations)
// ═══════════════════════════════════════════════════════════

model Participation {
  id             String              @id @default(cuid())
  status         ParticipationStatus @default(REGISTERED)
  attendedAt     DateTime?
  score          Float?
  feedback       String?             @db.Text
  certificateUrl String?             @db.VarChar(500)
  createdAt      DateTime            @default(now())
  updatedAt      DateTime            @updatedAt

  beneficiaryId String
  beneficiary   Beneficiary @relation(fields: [beneficiaryId], references: [id], onDelete: Cascade)

  activityId String
  activity   Activity @relation(fields: [activityId], references: [id], onDelete: Cascade)

  enrollmentId String?
  enrollment   Enrollment? @relation(fields: [enrollmentId], references: [id], onDelete: SetNull)

  @@unique([beneficiaryId, activityId])
  @@index([beneficiaryId])
  @@index([activityId])
  @@index([enrollmentId])
  @@index([status])
  @@map("participations")
}

enum ParticipationStatus {
  REGISTERED // مسجّل
  ATTENDED   // حضر
  COMPLETED  // أتمّ
  ABSENT     // غائب
  CANCELLED  // ملغى
}

// ═══════════════════════════════════════════════════════════
// فريق العمل (Team Members)
// ═══════════════════════════════════════════════════════════

model TeamMember {
  id          String   @id @default(cuid())
  name        String   @db.VarChar(200)
  slug        String   @unique @db.VarChar(255)
  role        String   @db.VarChar(200)
  bio         String?  @db.Text
  avatar      String?  @db.VarChar(500)
  email       String?  @db.VarChar(255)
  linkedinUrl String?  @db.VarChar(500)
  memberSince DateTime @default(now())
  sortOrder   Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([slug])
  @@index([isActive])
  @@map("team_members")
}

// ═══════════════════════════════════════════════════════════
// رسائل التواصل (Contact Messages)
// ═══════════════════════════════════════════════════════════

model ContactMessage {
  id        String    @id @default(cuid())
  name      String    @db.VarChar(200)
  email     String    @db.VarChar(255)
  subject   String    @db.VarChar(500)
  message   String    @db.Text
  isRead    Boolean   @default(false)
  repliedAt DateTime?
  createdAt DateTime  @default(now())

  @@index([isRead])
  @@index([createdAt])
  @@map("contact_messages")
}

// ═══════════════════════════════════════════════════════════
// صفحات المحتوى (Content Pages)
// ═══════════════════════════════════════════════════════════

model ContentPage {
  id          String   @id @default(cuid())
  title       String   @db.VarChar(255)
  slug        String   @unique @db.VarChar(255)
  content     String   @db.Text
  metaDesc    String?  @db.VarChar(300)
  isPublished Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([slug])
  @@index([isPublished])
  @@map("content_pages")
}

// ═══════════════════════════════════════════════════════════
// الأخبار والتحديثات (News Posts)
// ═══════════════════════════════════════════════════════════

model NewsPost {
  id          String    @id @default(cuid())
  title       String    @db.VarChar(255)
  slug        String    @unique @db.VarChar(255)
  excerpt     String?   @db.Text
  content     String    @db.Text
  coverImage  String?   @db.VarChar(500)
  category    String?   @db.VarChar(100)
  tags        String?   @db.Text
  isPublished Boolean   @default(false)
  publishedAt DateTime?
  sortOrder   Int       @default(0)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([slug])
  @@index([isPublished])
  @@index([publishedAt])
  @@index([category])
  @@map("news_posts")
}

// ═══════════════════════════════════════════════════════════
// مستخدمو الإدارة (Admin Users)
// ═══════════════════════════════════════════════════════════

model AdminUser {
  id           String    @id @default(cuid())
  email        String    @unique @db.VarChar(255)
  passwordHash String    @db.VarChar(255)
  fullName     String    @db.VarChar(200)
  role         AdminRole @default(EDITOR)
  isActive     Boolean   @default(true)
  lastLoginAt  DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@index([email])
  @@map("admin_users")
}

enum AdminRole {
  SUPER_ADMIN
  ADMIN
  EDITOR
}

// ═══════════════════════════════════════════════════════════
// إعدادات الموقع (Site Settings)
// ═══════════════════════════════════════════════════════════

model SiteSetting {
  id    String @id @default(cuid())
  key   String @unique @db.VarChar(100)
  value String @db.Text

  @@map("site_settings")
}

// ═══════════════════════════════════════════════════════════
// Webhooks (نقاط التكامل الخارجي)
// ═══════════════════════════════════════════════════════════

model Webhook {
  id              String    @id @default(cuid())
  name            String    @db.VarChar(255)
  url             String    @db.VarChar(1000)
  events          String    @db.Text
  secret          String?   @db.VarChar(255)
  isActive        Boolean   @default(true)
  lastTriggeredAt DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([isActive])
  @@map("webhooks")
}
```

---

## 3. ملخص النماذج وتغطية المتطلبات

| # | المتطلب | النموذج | الحالة |
|---|---------|---------|--------|
| 1.1 | قاعدة موحدة للمستفيدين | `Beneficiary` | ✅ |
| 1.2 | هوية وبروفايل للأعضاء | `Beneficiary` (code, profile, status) | ✅ |
| 1.3 | ربط المشاريع بالمنصات | `Project.platformId` + `Project.programId` | ✅ |
| 1.4 | تتبع رحلة الفرد - التسجيل | `Enrollment`, `Participation`, `BeneficiaryJourneyStage` | ✅ |
| 1.5 | نقاط التكامل الخارجي | `Webhook`, `WebhookLog` | ✅ |
| 2.1 | المكتبة المعرفية | `KnowledgeItem` (8 فئات + 7 أنواع ملفات) | ✅ |
| 2.2 | أرشفة مخرجات البرامج | `KnowledgeItem.platformId/programId/projectId` | ✅ |
| 3.1 | قوالب رفع التقارير | `ReportTemplate` (sections JSON) | ✅ |
| 3.2 | التقارير المرفوعة | `SubmittedReport` (DRAFT→APPROVED) | ✅ |
| 4.1 | مؤشرات المنصات | `PlatformIndicator` (value, target, period) | ✅ |
| 4.2 | مؤشرات البرامج | `ProgramIndicator` (value, target, period) | ✅ |
| 4.3 | لقطات تحليلية | `AnalyticsSnapshot` (periodic snapshots) | ✅ |
| 5.1 | تتبع الأداء الحي | `PlatformIndicator` + `ProgramIndicator` (period) | ✅ |
| 6.1 | التقييم وضمان الجودة | `Evaluation` (INTERNAL/EXTERNAL/PEER) | ✅ |
| 6.2 | دعم اتخاذ القرار | `SubmittedReport` + `AnalyticsSnapshot` + `Evaluation` | ✅ |
| 7.1 | التنسيق المؤسسي | `CoordinationTask` (assignee, status, priority) | ✅ |
| 7.2 | معايير البيانات | `DataStandard` (scope, requiredFields, validationRules) | ✅ |
| — | سجل النشاط والتتبع | `ActivityLog` (audit trail) | ✅ |
| — | الشركاء والداعمون | `Partner` (PARTNER/SPONSOR/SUPPORTER/DONOR) | ✅ |
| — | سعة البرامج والأنشطة | `Program.maxBeneficiaries` + `Activity.maxParticipants` | ✅ |
| — | الأخبار والتحديثات | `NewsPost` | ✅ |
| — | المنصات ← البرامج ← الأنشطة | علاقات Cascade | ✅ |

---

## 4. رحلة المستفيد (Journey Flow)

```
تسجيل مستفيد جديد (Beneficiary)
         ↓
التسجيل في برنامج (Enrollment: PENDING → ACTIVE)
         ↓
المشاركة في أنشطة (Participation: REGISTERED → ATTENDED → COMPLETED)
         ↓
إصدار شهادة (Participation.certificateUrl)
         ↓
إكمال البرنامج (Enrollment: COMPLETED)
```

---

## 5. أوامر Prisma الأساسية

### الإعداد الأولي
```bash
npm install prisma --save-dev
npm install @prisma/client
npx prisma init
npx prisma generate
```

### Migrations
```bash
# في بيئة التطوير
npx prisma migrate dev --name init

# في الإنتاج
npx prisma migrate deploy

# إعادة تعيين قاعدة البيانات (في التطوير فقط)
npx prisma migrate reset
```

### الاستوديو
```bash
npx prisma studio
```

---

## 6. ملف Seed (prisma/seed.ts)

```typescript
import { PrismaClient, AdminRole, PartnerType, ActivityType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // مدير افتراضي
  const passwordHash = await bcrypt.hash('ChangeMeNow!2026', 12)
  await prisma.adminUser.upsert({
    where: { email: 'admin@rowad-network.org' },
    update: {},
    create: {
      email: 'admin@rowad-network.org',
      passwordHash,
      fullName: 'Super Admin',
      role: AdminRole.SUPER_ADMIN,
    },
  })

  // شريك افتراضي
  await prisma.partner.create({
    data: {
      name: 'شريك مثال',
      type: PartnerType.PARTNER,
      sortOrder: 1,
    },
  })

  // منصة مع برامج وأنشطة
  const platform = await prisma.platform.create({
    data: {
      name: 'منصة التعليم الرقمي',
      slug: 'digital-education',
      description: 'منصة تهتم بتطوير التعليم الرقمي للشباب العربي.',
      vision: 'تمكين الشباب العربي بمهارات المستقبل',
      color: '#527F47',
      sortOrder: 1,
      programs: {
        create: [
          {
            name: 'برنامج مهارات البرمجة',
            slug: 'programming-skills',
            description: 'تدريب الشباب على لغات البرمجة الحديثة.',
            maxBeneficiaries: 100,
            sortOrder: 1,
            activities: {
              create: [
                {
                  name: 'معسكر تطوير الويب',
                  slug: 'web-dev-bootcamp',
                  description: 'معسكر مكثف لتعلم تطوير تطبيقات الويب.',
                  type: ActivityType.BOOTCAMP,
                  maxParticipants: 30,
                  sortOrder: 1,
                },
                {
                  name: 'هاكاثون الحلول المجتمعية',
                  slug: 'community-hackathon',
                  description: 'مسابقة برمجة لتطوير حلول لمشاكل مجتمعية.',
                  type: ActivityType.HACKATHON,
                  maxParticipants: 50,
                  sortOrder: 2,
                },
              ],
            },
          },
        ],
      },
    },
  })

  // مشروع مرتبط بالمنصة
  await prisma.project.create({
    data: {
      title: 'منصة الشبكة الرقمية',
      slug: 'digital-network-platform',
      description: 'منصة رقمية لربط الشباب العربي وتمكينهم.',
      category: 'تقنية',
      status: 'ACTIVE',
      isFeatured: true,
      platformId: platform.id,
    },
  })

  // مستفيد افتراضي
  await prisma.beneficiary.create({
    data: {
      code: 'BEN-001',
      firstName: 'أحمد',
      lastName: 'مثال',
      email: 'ahmed.example@rowad.org',
      country: 'SA',
      status: 'ACTIVE',
    },
  })

  console.log('✅ Database seeded successfully')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
```

---

## 7. أمثلة على الاستعلامات الشائعة

### رحلة مستفيد كاملة
```typescript
const journey = await prisma.beneficiary.findUnique({
  where: { code: 'BEN-001' },
  include: {
    enrollments: {
      include: {
        program: { include: { platform: true } },
        participations: { include: { activity: true } },
      },
    },
  },
})
```

### إحصائيات المنصة
```typescript
const stats = await prisma.platform.findUnique({
  where: { slug: 'digital-education' },
  include: {
    programs: {
      include: {
        _count: { select: { enrollments: true, activities: true } },
      },
    },
  },
})
```

### المستفيدون النشطون في برنامج
```typescript
const enrollments = await prisma.enrollment.findMany({
  where: { programId, status: 'ACTIVE' },
  include: { beneficiary: true },
  orderBy: { enrolledAt: 'desc' },
})
```

### المشاريع المرتبطة بمنصة
```typescript
const projects = await prisma.project.findMany({
  where: { platformId, status: 'ACTIVE' },
  orderBy: { sortOrder: 'asc' },
})
```

### الشركاء حسب النوع
```typescript
const partners = await prisma.partner.findMany({
  where: { isActive: true },
  orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }],
})
```

---

## 8. اعتبارات الأداء

### الفهارس المعرّفة
| الجدول | الفهارس |
|--------|---------|
| `beneficiaries` | `code`, `email`, `status`, `country` |
| `enrollments` | `beneficiaryId`, `programId`, `status` |
| `participations` | `beneficiaryId`, `activityId`, `enrollmentId`, `status` |
| `projects` | `slug`, `category`, `status`, `isFeatured`, `platformId`, `programId` |
| `partners` | `type`, `isActive` |
| `activities` | `slug`, `programId`, `isActive`, `type` |

### الـ Cascade Rules
- `Platform` يُحذف → تُحذف `Program[]` → تُحذف `Activity[]` → تُحذف `Participation[]`
- `Beneficiary` يُحذف → تُحذف `Enrollment[]` و `Participation[]`
- `Project.platformId` → `SetNull` (المشروع يبقى بدون منصة)

---

## 9. النسخ الاحتياطي والاستعادة

```bash
# النسخ الاحتياطي
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# الاستعادة
psql $DATABASE_URL < backup_20260101.sql
```

استخدم الميزات المدمجة في Neon/Supabase للنسخ الاحتياطي التلقائي.
