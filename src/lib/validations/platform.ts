import { z } from 'zod'

export const PlatformSchema = z.object({
  name: z.string().min(1, 'اسم المنصة مطلوب').max(255).trim(),
  slug: z.string().min(1, 'الرابط المختصر مطلوب').max(255).regex(/^[a-z0-9-]+$/, 'يجب أن يكون أحرف إنكليزية صغيرة وأرقام وشرطات').trim(),
  description: z.string().min(10, 'الوصف قصير جداً').max(5000).trim(),
  vision: z.string().max(2000).optional().or(z.literal('')),
  logo: z.string().max(500).optional().or(z.literal('')),
  coverImage: z.string().max(500).optional().or(z.literal('')),
  color: z.string().max(50).optional().or(z.literal('')),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
})

export type PlatformFormData = z.infer<typeof PlatformSchema>

export const ProgramSchema = z.object({
  name: z.string().min(1, 'اسم البرنامج مطلوب').max(255).trim(),
  slug: z.string().min(1, 'الرابط المختصر مطلوب').max(255).regex(/^[a-z0-9-]+$/, 'يجب أن يكون أحرف إنكليزية صغيرة وأرقام وشرطات').trim(),
  description: z.string().min(10, 'الوصف قصير جداً').max(5000).trim(),
  icon: z.string().max(500).optional().or(z.literal('')),
  image: z.string().max(500).optional().or(z.literal('')),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
  platformId: z.string().min(1, 'المنصة مطلوبة'),
})

export type ProgramFormData = z.infer<typeof ProgramSchema>

export const ActivitySchema = z.object({
  name: z.string().min(1, 'اسم النشاط مطلوب').max(255).trim(),
  slug: z.string().min(1, 'الرابط المختصر مطلوب').max(255).regex(/^[a-z0-9-]+$/, 'يجب أن يكون أحرف إنكليزية صغيرة وأرقام وشرطات').trim(),
  description: z.string().min(10, 'الوصف قصير جداً').max(5000).trim(),
  type: z.enum(['WORKSHOP', 'BOOTCAMP', 'HACKATHON', 'SEMINAR', 'COMPETITION', 'MENTORING', 'COURSE', 'EVENT', 'OTHER']).default('WORKSHOP'),
  icon: z.string().max(500).optional().or(z.literal('')),
  location: z.string().max(500).optional().or(z.literal('')),
  isOnline: z.boolean().default(false),
  maxParticipants: z.coerce.number().int().positive().optional(),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
  programId: z.string().min(1, 'البرنامج مطلوب'),
})

export type ActivityFormData = z.infer<typeof ActivitySchema>
