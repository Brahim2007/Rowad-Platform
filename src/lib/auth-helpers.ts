/**
 * مساعدات الجلسة والصلاحيات — الهيكل الثلاثي
 *
 * SUPER_ADMIN       — صلاحية مطلقة
 * ADMIN             — صلاحية كاملة (للتوافق مع الحالي)
 * EDITOR            — صلاحية محدودة (محتوى فقط)
 * PLATFORM_MANAGER  — مقيد بمنصته فقط
 * EVALUATOR         — يرى التقييمات المسندة إليه فقط
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
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

const SESSION_REVALIDATE_MS = 5 * 60 * 1000
const sessionUserCache = new Map<string, { expiresAt: number; user: SessionUser | null }>()

async function revalidateSessionUser(sessionUser: SessionUser): Promise<SessionUser | null> {
  if (sessionUser.id === 'dev-admin' && process.env.NODE_ENV === 'development') return sessionUser

  const cached = sessionUserCache.get(sessionUser.id)
  if (cached && cached.expiresAt > Date.now()) return cached.user

  try {
    const current = await prisma.adminUser.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        platformId: true,
        platform: { select: { name: true } },
      },
    })
    const user: SessionUser | null = current?.isActive ? {
      id: current.id,
      email: current.email,
      name: current.fullName,
      role: current.role,
      platformId: current.platformId,
      platformName: current.platform?.name ?? null,
    } : null
    sessionUserCache.set(sessionUser.id, { expiresAt: Date.now() + SESSION_REVALIDATE_MS, user })
    return user
  } catch (error) {
    logger.error('[auth] Failed to revalidate administrative session', error)
    return null
  }
}

// ═══════════════════════════════════════════════════
// أنواع الجلسة
// ═══════════════════════════════════════════════════

export interface SessionUser {
  id: string
  email: string
  name: string
  role: 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'PLATFORM_MANAGER' | 'EVALUATOR'
  platformId: string | null
  platformName: string | null
}

/** استخراج معلومات المستخدم من الجلسة */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth()
  if (!session?.user) return null
  const u = session.user as typeof session.user & Partial<SessionUser>
  const sessionUser: SessionUser = {
    id: u.id || '',
    email: u.email || '',
    name: u.name || '',
    role: u.role || 'EDITOR',
    platformId: u.platformId ?? null,
    platformName: u.platformName ?? null,
  }
  if (!sessionUser.id) return null
  return revalidateSessionUser(sessionUser)
}

// ═══════════════════════════════════════════════════
// دوال الحماية (تُعيد NextResponse عند الفشل)
// ═══════════════════════════════════════════════════

type AuthResult =
  | { ok: true; user: SessionUser }
  | { ok: false; error: NextResponse }

/** يتطلب أي دور مصادق عليه */
export async function requireAuth(options: { allowEvaluator?: boolean } = {}): Promise<AuthResult> {
  const user = await getSessionUser()
  if (!user) {
    return {
      ok: false,
      error: NextResponse.json({ success: false, message: 'غير مصرح — سجّل الدخول أولاً' }, { status: 401 }),
    }
  }
  if (user.role === 'EVALUATOR' && !options.allowEvaluator) {
    return {
      ok: false,
      error: NextResponse.json({ success: false, message: 'حساب المقيّم مخصص للتقييمات المسندة فقط' }, { status: 403 }),
    }
  }
  return { ok: true, user }
}

/** يتطلب إدارة النظام أو مدير منصة؛ يستبعد المحرر والمقيّم المستقل. */
export async function requireOperationalAccess(): Promise<AuthResult> {
  const user = await getSessionUser()
  if (!user) {
    return {
      ok: false,
      error: NextResponse.json({ success: false, message: 'غير مصرح — سجّل الدخول أولاً' }, { status: 401 }),
    }
  }
  if (!['SUPER_ADMIN', 'ADMIN', 'PLATFORM_MANAGER'].includes(user.role)) {
    return {
      ok: false,
      error: NextResponse.json({ success: false, message: 'هذه الميزة تشغيلية وغير متاحة لدورك' }, { status: 403 }),
    }
  }
  if (user.role === 'PLATFORM_MANAGER' && !user.platformId) {
    return {
      ok: false,
      error: NextResponse.json({ success: false, message: 'مدير المنصة غير مرتبط بمنصة' }, { status: 403 }),
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
  if (!['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(user.role)) {
    return {
      ok: false,
      error: NextResponse.json({ success: false, message: 'هذه الصفحة غير متاحة لهذا الدور' }, { status: 403 }),
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
  if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'EDITOR' || user.role === 'EVALUATOR') {
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
