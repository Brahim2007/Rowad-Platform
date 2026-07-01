/**
 * مساعدات الجلسة والصلاحيات — الهيكل الثلاثي
 *
 * SUPER_ADMIN       — صلاحية مطلقة
 * ADMIN             — صلاحية كاملة (للتوافق مع الحالي)
 * EDITOR            — صلاحية محدودة (محتوى فقط)
 * PLATFORM_MANAGER  — مقيد بمنصته فقط
 *
 * مبدأ العزل: PLATFORM_MANAGER لا يرى بيانات غير منصته في أي API.
 * كل API حساس يجب أن يستدعي إحدى هذه الدوال قبل معالجة الطلب.
 *
 * ملاحظة: في ملف route منفصل داخل API، تستخدم الدوال التي تُعيد NextResponse
 * للرفض الفوري. في ملف مشترك (route.ts واحد)، استخدم getRole/getPlatformId
 * وابنِ المنطق بنفسك.
 */

import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

// ═══════════════════════════════════════════════════
// أنواع الجلسة
// ═══════════════════════════════════════════════════

export interface SessionUser {
  id: string
  email: string
  name: string
  role: 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'PLATFORM_MANAGER'
  platformId: string | null
  platformName: string | null
}

/** استخراج معلومات المستخدم من الجلسة */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth()
  if (!session?.user) return null
  const u = session.user as any
  return {
    id: u.id || '',
    email: u.email || '',
    name: u.name || '',
    role: u.role || 'EDITOR',
    platformId: u.platformId ?? null,
    platformName: u.platformName ?? null,
  }
}

// ═══════════════════════════════════════════════════
// دوال الحماية (تُعيد NextResponse عند الفشل)
// ═══════════════════════════════════════════════════

type AuthResult =
  | { ok: true; user: SessionUser }
  | { ok: false; error: NextResponse }

/** يتطلب أي دور مصادق عليه */
export async function requireAuth(): Promise<AuthResult> {
  const user = await getSessionUser()
  if (!user) {
    return {
      ok: false,
      error: NextResponse.json({ success: false, message: 'غير مصرح — سجّل الدخول أولاً' }, { status: 401 }),
    }
  }
  return { ok: true, user }
}

/** يتطلب دور SUPER_ADMIN فقط */
export async function requireSuperAdmin(): Promise<AuthResult> {
  const user = await getSessionUser()
  if (!user) {
    return {
      ok: false,
      error: NextResponse.json({ success: false, message: 'غير مصرح — سجّل الدخول أولاً' }, { status: 401 }),
    }
  }
  if (user.role !== 'SUPER_ADMIN') {
    return {
      ok: false,
      error: NextResponse.json({ success: false, message: 'هذه الميزة متاحة للإدارة العليا فقط' }, { status: 403 }),
    }
  }
  return { ok: true, user }
}

/** يتطلب دوراً إدارياً (SUPER_ADMIN, ADMIN, EDITOR — لا PLATFORM_MANAGER) */
export async function requireAdminRole(): Promise<AuthResult> {
  const user = await getSessionUser()
  if (!user) {
    return {
      ok: false,
      error: NextResponse.json({ success: false, message: 'غير مصرح — سجّل الدخول أولاً' }, { status: 401 }),
    }
  }
  if (user.role === 'PLATFORM_MANAGER') {
    return {
      ok: false,
      error: NextResponse.json({ success: false, message: 'هذه الصفحة غير متاحة لمدراء المنصات' }, { status: 403 }),
    }
  }
  return { ok: true, user }
}

/** يتطلب SUPER_ADMIN أو PLATFORM_MANAGER (لـ APIs المرتبطة بالمنصة) */
export async function requirePlatformAccess(): Promise<AuthResult> {
  const user = await getSessionUser()
  if (!user) {
    return {
      ok: false,
      error: NextResponse.json({ success: false, message: 'غير مصرح — سجّل الدخول أولاً' }, { status: 401 }),
    }
  }
  if (user.role !== 'SUPER_ADMIN' && user.role !== 'PLATFORM_MANAGER') {
    return {
      ok: false,
      error: NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 403 }),
    }
  }
  return { ok: true, user }
}

// ═══════════════════════════════════════════════════
// دوال العزل (Platform Scoping)
// ═══════════════════════════════════════════════════

export interface PlatformScope {
  /** إن كان SUPER_ADMIN: null (يرى الكل). إن كان PLATFORM_MANAGER: platformId */
  filterId: string | null
  filterAll: boolean
}

/** بناء نطاق المنصة حسب دور المستخدم */
export function getPlatformScope(user: SessionUser): PlatformScope {
  if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'EDITOR') {
    return { filterId: null, filterAll: true }
  }
  // PLATFORM_MANAGER — مقيد بمنصته
  return { filterId: user.platformId, filterAll: false }
}

/**
 * بناء where clause لـ Prisma يُضيف فلتر المنصة إن كان PLATFORM_MANAGER.
 * استخدمها عند جلب ImpactLog, Beneficiary, أو كيانات مرتبطة بمنصة.
 *
 * مثال:
 *   const scope = getPlatformScope(user)
 *   const members = await prisma.beneficiary.findMany({
 *     where: {
 *       ...platformWhere(scope),  // يُضيف { platformId: 'X' } لمدير المنصة
 *       status: 'ACTIVE',
 *     }
 *   })
 */
export function platformWhere(scope: PlatformScope): Record<string, unknown> {
  if (scope.filterId) return { platformId: scope.filterId }
  return {}
}

/** التحقق من أن id معيّن ينتمي لمنصة المستخدم — يُستخدم قبل UPDATE/DELETE */
export async function verifyPlatformOwnership(
  user: SessionUser,
  platformId: string | null | undefined,
): Promise<boolean> {
  if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') return true
  if (user.role === 'PLATFORM_MANAGER') {
    return platformId === user.platformId
  }
  return false
}

// ═══════════════════════════════════════════════════
// اختصارات سريعة
// ═══════════════════════════════════════════════════

export async function isSuperAdmin(): Promise<boolean> {
  const user = await getSessionUser()
  return user?.role === 'SUPER_ADMIN'
}

export async function isPlatformManager(): Promise<boolean> {
  const user = await getSessionUser()
  return user?.role === 'PLATFORM_MANAGER'
}
