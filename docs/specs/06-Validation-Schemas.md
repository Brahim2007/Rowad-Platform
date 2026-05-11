# مخططات التحقق (Validation Schemas)
## Zod Schemas للنماذج والـ APIs - منصة شبكة الرواد

---

## 1. الفلسفة

نستخدم **Zod** كمصدر واحد للحقيقة (Single Source of Truth):
- نفس المخطط يُستخدم في الواجهة (مع react-hook-form) والخادم (API routes)
- يضمن تطابق الأنواع بين Client و Server
- يُولّد رسائل خطأ متعددة اللغات

---

## 2. مخططات التحقق

ضع هذه الملفات في `src/lib/validations/`:

### `src/lib/validations/contact.ts`

```typescript
import { z } from 'zod'

export const ContactSchema = z.object({
  name: z.string()
    .min(1, 'الاسم مطلوب')
    .max(200, 'الاسم طويل جداً')
    .trim(),
  
  email: z.string()
    .min(1, 'البريد الإلكتروني مطلوب')
    .email('البريد الإلكتروني غير صحيح')
    .toLowerCase()
    .trim(),
  
  subject: z.string()
    .min(1, 'الموضوع مطلوب')
    .max(500, 'الموضوع طويل جداً')
    .trim(),
  
  message: z.string()
    .min(10, 'الرسالة قصيرة جداً (10 أحرف على الأقل)')
    .max(5000, 'الرسالة طويلة جداً')
    .trim(),
})

export type ContactFormData = z.infer<typeof ContactSchema>
```

### `src/lib/validations/platform.ts`

```typescript
import { z } from 'zod'

export const PlatformSchema = z.object({
  name: z.string()
    .min(1, 'اسم المنصة مطلوب')
    .max(255)
    .trim(),

  slug: z.string()
    .min(1, 'الرابط المختصر مطلوب')
    .max(255)
    .regex(/^[a-z0-9-]+$/, 'يجب أن يكون أحرف إنكليزية صغيرة وأرقام وشرطات')
    .trim(),

  description: z.string()
    .min(10, 'الوصف قصير جداً')
    .max(5000)
    .trim(),

  vision: z.string()
    .max(2000)
    .optional()
    .or(z.literal('')),

  logo: z.string()
    .max(500)
    .optional()
    .or(z.literal('')),

  coverImage: z.string()
    .max(500)
    .optional()
    .or(z.literal('')),

  color: z.string()
    .max(50)
    .optional()
    .or(z.literal('')),

  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
})

export type PlatformFormData = z.infer<typeof PlatformSchema>

// ─── مخطط البرنامج ───

export const ProgramSchema = z.object({
  name: z.string()
    .min(1, 'اسم البرنامج مطلوب')
    .max(255)
    .trim(),

  slug: z.string()
    .min(1, 'الرابط المختصر مطلوب')
    .max(255)
    .regex(/^[a-z0-9-]+$/, 'يجب أن يكون أحرف إنكليزية صغيرة وأرقام وشرطات')
    .trim(),

  description: z.string()
    .min(10, 'الوصف قصير جداً')
    .max(5000)
    .trim(),

  icon: z.string().max(500).optional().or(z.literal('')),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
  platformId: z.string().min(1, 'المنصة مطلوبة'),
})

export type ProgramFormData = z.infer<typeof ProgramSchema>

// ─── مخطط النشاط ───

export const ActivitySchema = z.object({
  name: z.string()
    .min(1, 'اسم النشاط مطلوب')
    .max(255)
    .trim(),

  slug: z.string()
    .min(1, 'الرابط المختصر مطلوب')
    .max(255)
    .regex(/^[a-z0-9-]+$/, 'يجب أن يكون أحرف إنكليزية صغيرة وأرقام وشرطات')
    .trim(),

  description: z.string()
    .min(10, 'الوصف قصير جداً')
    .max(5000)
    .trim(),

  icon: z.string().max(500).optional().or(z.literal('')),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
  programId: z.string().min(1, 'البرنامج مطلوب'),
})

export type ActivityFormData = z.infer<typeof ActivitySchema>
```

### `src/lib/validations/project.ts`

```typescript
import { z } from 'zod'

export const ProjectSchema = z.object({
  title: z.string()
    .min(1, 'عنوان المشروع مطلوب')
    .max(255)
    .trim(),
  
  slug: z.string()
    .min(1, 'الرابط المختصر مطلوب')
    .max(255)
    .regex(/^[a-z0-9-]+$/, 'الرابط المختصر يجب أن يكون أحرف إنكليزية صغيرة وأرقام وشرطات')
    .trim(),
  
  description: z.string()
    .min(10, 'الوصف قصير جداً')
    .max(2000)
    .trim(),
  
  fullContent: z.string()
    .max(50000)
    .optional()
    .or(z.literal('')),
  
  category: z.string()
    .min(1, 'التصنيف مطلوب'),
  
  status: z.enum(['ACTIVE', 'COMPLETED', 'ON_HOLD', 'PLANNING'])
    .default('ACTIVE'),
  
  coverImage: z.string()
    .url('الرابط غير صحيح')
    .max(500)
    .optional()
    .or(z.literal('')),
  
  startDate: z.string().optional().or(z.literal('')),
  endDate: z.string().optional().or(z.literal('')),
  partnerLogos: z.string().optional().or(z.literal('')),
  isFeatured: z.boolean().default(false),
  sortOrder: z.coerce.number().int().default(0),
})

export type ProjectFormData = z.infer<typeof ProjectSchema>
```

### `src/lib/validations/team.ts`

```typescript
import { z } from 'zod'

export const TeamMemberSchema = z.object({
  name: z.string()
    .min(1, 'الاسم مطلوب')
    .max(200)
    .trim(),
  
  slug: z.string()
    .min(1, 'الرابط المختصر مطلوب')
    .max(255)
    .regex(/^[a-z0-9-]+$/, 'الرابط المختصر يجب أن يكون أحرف إنكليزية صغيرة وأرقام وشرطات')
    .trim(),
  
  role: z.string()
    .min(1, 'الدور مطلوب')
    .max(200)
    .trim(),
  
  bio: z.string()
    .max(5000)
    .optional()
    .or(z.literal('')),
  
  avatar: z.string()
    .url('الرابط غير صحيح')
    .max(500)
    .optional()
    .or(z.literal('')),
  
  email: z.string()
    .email('البريد الإلكتروني غير صحيح')
    .max(255)
    .optional()
    .or(z.literal('')),
  
  linkedinUrl: z.string()
    .url('الرابط غير صحيح')
    .max(500)
    .optional()
    .or(z.literal('')),
  
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
})

export type TeamMemberFormData = z.infer<typeof TeamMemberSchema>
```

### `src/lib/validations/admin.ts`

```typescript
import { z } from 'zod'

export const AdminLoginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  password: z.string().min(8, 'كلمة المرور قصيرة جداً'),
})

export type AdminLoginData = z.infer<typeof AdminLoginSchema>
```

---

## 3. استخدام مع react-hook-form

```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ContactSchema, type ContactFormData } from '@/lib/validations/contact'

export function ContactForm() {
  const form = useForm<ContactFormData>({
    resolver: zodResolver(ContactSchema),
    mode: 'onBlur',
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
    }
  })

  const onSubmit = (data: ContactFormData) => {
    console.log(data)
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* الحقول */}
    </form>
  )
}
```

---

## 4. استخدام في API Route

```typescript
// src/app/api/contact/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { ContactSchema } from '@/lib/validations/contact'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = ContactSchema.parse(body)
    
    const message = await prisma.contactMessage.create({
      data: validated
    })
    
    return NextResponse.json({
      success: true,
      data: { id: message.id }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: error.flatten() },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, message: 'خطأ في الخادم' },
      { status: 500 }
    )
  }
}
```
