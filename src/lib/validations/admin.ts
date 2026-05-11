import { z } from 'zod'

export const AdminLoginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  password: z.string().min(8, 'كلمة المرور قصيرة جداً'),
})

export type AdminLoginData = z.infer<typeof AdminLoginSchema>
