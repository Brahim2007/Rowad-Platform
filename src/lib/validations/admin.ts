import { z } from 'zod'

export const AdminLoginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  password: z.string().min(8, 'كلمة المرور قصيرة جداً'),
})

export const AdminUserSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صحيح').trim().toLowerCase(),
  fullName: z.string().min(2, 'الاسم مطلوب').max(200, 'الاسم طويل جداً').trim(),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'PLATFORM_MANAGER']),
  isActive: z.boolean().default(true),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل').optional().or(z.literal('')),
  platformId: z.string().optional().or(z.literal('')).nullable(),
})

export type AdminLoginData = z.infer<typeof AdminLoginSchema>
export type AdminUserData = z.infer<typeof AdminUserSchema>
