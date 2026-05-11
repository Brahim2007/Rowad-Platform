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
