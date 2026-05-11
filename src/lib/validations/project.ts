import { z } from 'zod'

export const ProjectSchema = z.object({
  title: z.string().min(1, 'عنوان المشروع مطلوب').max(255).trim(),
  slug: z.string().min(1, 'الرابط المختصر مطلوب').max(255).regex(/^[a-z0-9-]+$/, 'الرابط المختصر يجب أن يكون أحرف إنكليزية صغيرة وأرقام وشرطات').trim(),
  description: z.string().min(10, 'الوصف قصير جداً').max(2000).trim(),
  fullContent: z.string().max(50000).optional().or(z.literal('')),
  category: z.string().min(1, 'التصنيف مطلوب'),
  status: z.enum(['ACTIVE', 'COMPLETED', 'ON_HOLD', 'PLANNING']).default('ACTIVE'),
  coverImage: z.string().url('الرابط غير صحيح').max(500).optional().or(z.literal('')),
  startDate: z.string().optional().or(z.literal('')),
  endDate: z.string().optional().or(z.literal('')),
  partnerLogos: z.string().optional().or(z.literal('')),
  isFeatured: z.boolean().default(false),
  sortOrder: z.coerce.number().int().default(0),
  platformId: z.string().optional().or(z.literal('')),
  programId: z.string().optional().or(z.literal('')),
})

export type ProjectFormData = z.infer<typeof ProjectSchema>
