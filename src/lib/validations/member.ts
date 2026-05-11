import { z } from 'zod'

export const UnifiedMemberSchema = z.object({
  // Beneficiary fields
  code: z.string().min(1, 'الكود مطلوب').max(50).trim(),
  firstName: z.string().min(1, 'الاسم الأول مطلوب').max(100).trim(),
  lastName: z.string().min(1, 'اسم العائلة مطلوب').max(100).trim(),
  email: z.string().email('البريد الإلكتروني غير صحيح').max(255).optional().or(z.literal('')),
  phone: z.string().max(50).optional().or(z.literal('')),
  gender: z.enum(['MALE', 'FEMALE']).optional().or(z.literal('')),
  birthDate: z.string().optional().or(z.literal('')),
  nationality: z.string().max(100).optional().or(z.literal('')),
  country: z.string().max(100).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  educationLevel: z.enum(['HIGH_SCHOOL', 'DIPLOMA', 'BACHELOR', 'MASTER', 'DOCTORATE', 'OTHER']).optional().or(z.literal('')),
  bio: z.string().max(5000).optional().or(z.literal('')),
  avatar: z.string().url('الرابط غير صحيح').max(500).optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).default('ACTIVE'),

  // Team-specific fields
  type: z.enum(['BENEFICIARY', 'TEAM', 'BOTH']).default('BENEFICIARY'),
  role: z.string().max(200).optional().or(z.literal('')),
  slug: z.string().max(255).regex(/^[a-z0-9-]+$/, 'الرابط المختصر يجب أن يكون أحرف إنكليزية صغيرة وأرقام وشرطات').optional().or(z.literal('')),
  linkedinUrl: z.string().url('الرابط غير صحيح').max(500).optional().or(z.literal('')),
  sortOrder: z.coerce.number().int().default(0),
  interests: z.string().optional().or(z.literal('')),
})

export type UnifiedMemberFormData = z.infer<typeof UnifiedMemberSchema>

// ─── Schema for TEAM-only members (simplified) ───

export const TeamMemberSchema = z.object({
  firstName: z.string().min(1, 'الاسم الأول مطلوب').max(100).trim(),
  lastName: z.string().min(1, 'اسم العائلة مطلوب').max(100).trim(),
  slug: z.string().min(1, 'الرابط المختصر مطلوب').max(255).regex(/^[a-z0-9-]+$/, 'الرابط المختصر يجب أن يكون أحرف إنكليزية صغيرة وأرقام وشرطات').trim(),
  role: z.string().min(1, 'الدور مطلوب').max(200).trim(),
  bio: z.string().max(5000).optional().or(z.literal('')),
  avatar: z.string().url('الرابط غير صحيح').max(500).optional().or(z.literal('')),
  email: z.string().email('البريد الإلكتروني غير صحيح').max(255).optional().or(z.literal('')),
  linkedinUrl: z.string().url('الرابط غير صحيح').max(500).optional().or(z.literal('')),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
  code: z.string().max(50).optional(),
})

export type TeamMemberFormData = z.infer<typeof TeamMemberSchema>
