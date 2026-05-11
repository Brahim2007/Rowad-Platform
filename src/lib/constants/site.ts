export const SITE = {
  name: 'شبكة الرواد الإلكترونية',
  url: 'https://rowad-network.org',
  email: 'info@rowad-network.org',
  location: 'Amman, Jordan',
  social: {
    linkedin: 'https://www.linkedin.com/company/rowad-network',
    facebook: 'https://www.facebook.com/rowadnetwork',
    twitter: 'https://twitter.com/rowadnetwork',
  },
  description: 'منصة رقمية لتمكين الشباب العربي',
} as const

export const ROUTES = {
  home: '/',
  about: '/about',
  platforms: '/platforms',
  projects: '/projects',
  team: '/team',
  contact: '/contact',
  admin: {
    login: '/admin/login',
    dashboard: '/admin/dashboard',
    members: '/admin/members',
    platforms: '/admin/platforms',
    projects: '/admin/projects',
    team: '/admin/members?type=team',
    content: '/admin/content',
  },
} as const

export const PROJECT_CATEGORIES = ['تقنية', 'تعليم', 'ثقافة', 'فعاليات', 'إعلام', 'ريادة'] as const
export const PROJECT_STATUSES = ['ACTIVE', 'COMPLETED', 'ON_HOLD', 'PLANNING'] as const
