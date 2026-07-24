# منصة رواد — Rowad Platform

نظام إدارة شبكة رواد الإلكترونية — إدارة المنصات، الأعضاء، وقياس الأثر.

## البنية

- **Next.js 15** (App Router) + **TypeScript** · **Prisma** + **PostgreSQL**
- **NextAuth.js** (الإدارة) · **JWT** (بوابة العضو) · **Nodemailer** (البريد)
- **Gemini API** (مساعد ذكي — اختياري)
- **CI/CD:** GitHub Actions — type-check + build تلقائي

## الأدوار

| الدور | الصلاحية |
|-------|----------|
| `SUPER_ADMIN` | رؤية كاملة + إعدادات + AI |
| `PLATFORM_MANAGER` | مقيّد بمنصته — يدير أعضاءه وأنشطتهم |
| `MEMBER` | بوابة خاصة — إدخال أنشطة ومتابعة النقاط |

## تشغيل محلي

```bash
npm install
# عدّل .env بمتغيرات البيئة
npx prisma generate && npx prisma db push
npm run dev
```

**متغيرات أساسية:** `AUTH_SECRET`, `ROWAD_DATABASE_URL`, `SMTP_*`, `EMAIL_FROM`
**AI (اختياري):** `GEMINI_API_KEY`, `GEMINI_MODEL`, `AI_MONTHLY_BUDGET`

## الدخول

| البوابة | الرابط |
|---------|--------|
| الإدارة | `http://localhost:3002/ar/admin/login` |
| العضو | `http://localhost:3002/ar/member/login` |

لا يوجد حساب مدير افتراضي في الإنتاج. أنشئ المستخدمين الإداريين من قاعدة البيانات أو سكربت seed آمن.

للتطوير المحلي فقط يمكن ضبط `DEV_ADMIN_EMAIL` و`DEV_ADMIN_PASSWORD` في `.env.local`. هذه القيم لا تعمل إلا عندما يكون `NODE_ENV=development`.

## بناء للإنتاج

```bash
NODE_OPTIONS='--max-old-space-size=4096' npm run build && npm start
```

## سكربتات

| الأمر | الوصف |
|-------|-------|
| `npm run dev` | تشغيل تطويري |
| `npm run build` | بناء للإنتاج |
| `npm run verify` | فحص TypeScript |
| `npm run lint` | فحص الـ Lint |
| `npm run db:studio` | فتح Prisma Studio |

## خطة الاختبار اليدوي

بعد كل تحديث كبير، نفّذ هذه السيناريوهات:

1. **تسجيل الدخول** — `SUPER_ADMIN`، `PLATFORM_MANAGER`، `MEMBER`
2. **إضافة عضو** — من لوحة الإدارة ومن لوحة مدير المنصة
3. **تسجيل نشاط** — من لوحة الإدارة ومن بوابة العضو
4. **اعتماد ورفض** — مع سبب رفض + تحقق من البريد والإشعار
5. **تقرير شهري** — تحقق من الأرقام بعد إضافة نشاط معتمد
6. **بوابة شهرية** — تعطيل البوابة والتحقق من تأثيرها على الاستحقاق
7. **صلاحيات** — التحقق من أن كل دور لا يرى بيانات الأدوار الأخرى
8. **AI** — التحقق من رفض APIs الذكاء لغير `SUPER_ADMIN` (403)
