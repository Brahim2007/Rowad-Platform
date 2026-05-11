// Database model types (matching Prisma schema)
export interface Project {
  id: string
  title: string
  slug: string
  description: string
  fullContent: string | null
  category: string
  status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'PLANNING'
  coverImage: string | null
  startDate: Date | null
  endDate: Date | null
  partnerLogos: string | null
  isFeatured: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

export interface Platform {
  id: string
  name: string
  slug: string
  description: string
  vision: string | null
  logo: string | null
  coverImage: string | null
  color: string | null
  sortOrder: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  programs: Program[]
}

export interface Program {
  id: string
  name: string
  slug: string
  description: string
  icon: string | null
  sortOrder: number
  isActive: boolean
  platformId: string
  activities: Activity[]
}

export interface Activity {
  id: string
  name: string
  slug: string
  description: string
  icon: string | null
  sortOrder: number
  isActive: boolean
  programId: string
}

export interface UnifiedMember {
  id: string
  code: string
  firstName: string
  lastName: string
  name?: string  // computed: firstName + lastName
  email: string | null
  phone: string | null
  gender: 'MALE' | 'FEMALE' | null
  birthDate: Date | null
  nationality: string | null
  country: string | null
  city: string | null
  educationLevel: string | null
  bio: string | null
  avatar: string | null
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  registeredAt: Date
  type: 'BENEFICIARY' | 'TEAM' | 'BOTH'
  role: string | null
  slug: string | null
  linkedinUrl: string | null
  memberSince: Date | null
  sortOrder: number
  interests: string | null
}

// @deprecated Use UnifiedMember instead
export interface TeamMember {
  id: string
  name: string
  slug: string
  role: string
  bio: string | null
  avatar: string | null
  email: string | null
  linkedinUrl: string | null
  memberSince: Date
  sortOrder: number
  isActive: boolean
}

export interface ContactMessage {
  id: string
  name: string
  email: string
  subject: string
  message: string
  isRead: boolean
  repliedAt: Date | null
  createdAt: Date
}

export interface ContentPage {
  id: string
  title: string
  slug: string
  content: string
  metaDesc: string | null
  isPublished: boolean
  createdAt: Date
  updatedAt: Date
}

export interface AdminUser {
  id: string
  email: string
  fullName: string
  role: 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR'
  isActive: boolean
  lastLoginAt: Date | null
}

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  errors?: Record<string, string[]>
}

export interface PaginatedData<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface PaginatedResponse<T> extends ApiResponse<PaginatedData<T>> {
  data: PaginatedData<T>
}
