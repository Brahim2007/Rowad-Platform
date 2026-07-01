import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { AdminUserSchema } from '@/lib/validations/admin'
import { recordActivityLog } from '@/lib/activity-log'

async function requireSuperAdmin() {
  const session = await auth()
  if (!session?.user) {
    return {
      error: NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 }),
      session: null,
    }
  }

  const role = (session.user as { role?: string }).role
  if (role !== 'SUPER_ADMIN') {
    return {
      error: NextResponse.json({ success: false, message: 'هذه الصفحة متاحة للمدير العام فقط' }, { status: 403 }),
      session,
    }
  }

  return { error: null, session }
}

function toSafeUser(user: {
  id: string
  email: string
  fullName: string
  role: string
  isActive: boolean
  lastLoginAt: Date | null
  platformId?: string | null
  platform?: { id: string; name: string } | null
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt,
    platformId: user.platformId ?? null,
    platformName: user.platform?.name ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

export async function GET() {
  const { error } = await requireSuperAdmin()
  if (error) return error

  try {
    const users = await prisma.adminUser.findMany({
      orderBy: [{ role: 'asc' }, { createdAt: 'desc' }],
      include: { platform: { select: { id: true, name: true } } },
    })

    return NextResponse.json({ success: true, data: users.map(toSafeUser) })
  } catch (error) {
    console.error('Admin users GET error:', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { error, session } = await requireSuperAdmin()
  if (error) return error

  try {
    const input = AdminUserSchema.extend({
      password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
    }).parse(await request.json())

    // التحقق من وجود platformId عند دور PLATFORM_MANAGER
    if (input.role === 'PLATFORM_MANAGER' && !input.platformId) {
      return NextResponse.json({ success: false, message: 'يجب اختيار منصة لمدير المنصة' }, { status: 400 })
    }

    const user = await prisma.adminUser.create({
      data: {
        email: input.email,
        fullName: input.fullName,
        role: input.role,
        isActive: input.isActive,
        passwordHash: await bcrypt.hash(input.password, 12),
        platformId: input.role === 'PLATFORM_MANAGER' ? (input.platformId || null) : null,
      },
      include: { platform: { select: { id: true, name: true } } },
    })

    await recordActivityLog({
      entity: 'admin_user',
      entityId: user.id,
      action: 'CREATE',
      actor: session?.user?.email || session?.user?.name,
      metadata: { email: user.email, role: user.role },
    })

    return NextResponse.json({ success: true, data: toSafeUser(user) }, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, errors: error.flatten() }, { status: 400 })
    }
    const e = error as { code?: string }
    if (e.code === 'P2002') {
      return NextResponse.json({ success: false, message: 'البريد الإلكتروني مستخدم مسبقاً' }, { status: 409 })
    }
    console.error('Admin users POST error:', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const { error, session } = await requireSuperAdmin()
  if (error) return error

  try {
    const body = await request.json()
    const id = body.id
    if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })

    const input = AdminUserSchema.parse(body)
    const activeSuperAdmins = await prisma.adminUser.count({
      where: { role: 'SUPER_ADMIN', isActive: true, NOT: { id } },
    })

    const current = await prisma.adminUser.findUnique({ where: { id } })
    if (!current) {
      return NextResponse.json({ success: false, message: 'المستخدم غير موجود' }, { status: 404 })
    }

    const removesLastSuperAdmin =
      current.role === 'SUPER_ADMIN' &&
      current.isActive &&
      (input.role !== 'SUPER_ADMIN' || !input.isActive) &&
      activeSuperAdmins === 0

    if (removesLastSuperAdmin) {
      return NextResponse.json({ success: false, message: 'لا يمكن تعطيل أو تغيير آخر مدير عام نشط' }, { status: 400 })
    }

    // التحقق من platformId عند PLATFORM_MANAGER
    if (input.role === 'PLATFORM_MANAGER' && !input.platformId) {
      return NextResponse.json({ success: false, message: 'يجب اختيار منصة لمدير المنصة' }, { status: 400 })
    }

    const user = await prisma.adminUser.update({
      where: { id },
      data: {
        email: input.email,
        fullName: input.fullName,
        role: input.role,
        isActive: input.isActive,
        platformId: input.role === 'PLATFORM_MANAGER' ? (input.platformId || null) : null,
        ...(input.password ? { passwordHash: await bcrypt.hash(input.password, 12) } : {}),
      },
      include: { platform: { select: { id: true, name: true } } },
    })

    await recordActivityLog({
      entity: 'admin_user',
      entityId: user.id,
      action: 'UPDATE',
      actor: session?.user?.email || session?.user?.name,
      changes: {
        email: { old: current.email, new: user.email },
        fullName: { old: current.fullName, new: user.fullName },
        role: { old: current.role, new: user.role },
        isActive: { old: current.isActive, new: user.isActive },
        passwordChanged: Boolean(input.password),
      },
    })

    return NextResponse.json({ success: true, data: toSafeUser(user) })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, errors: error.flatten() }, { status: 400 })
    }
    const e = error as { code?: string }
    if (e.code === 'P2002') {
      return NextResponse.json({ success: false, message: 'البريد الإلكتروني مستخدم مسبقاً' }, { status: 409 })
    }
    console.error('Admin users PUT error:', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const { error, session } = await requireSuperAdmin()
  if (error) return error

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })

    const user = await prisma.adminUser.findUnique({ where: { id } })
    if (!user) return NextResponse.json({ success: false, message: 'المستخدم غير موجود' }, { status: 404 })

    if (user.role === 'SUPER_ADMIN' && user.isActive) {
      const activeSuperAdmins = await prisma.adminUser.count({
        where: { role: 'SUPER_ADMIN', isActive: true, NOT: { id } },
      })
      if (activeSuperAdmins === 0) {
        return NextResponse.json({ success: false, message: 'لا يمكن حذف آخر مدير عام نشط' }, { status: 400 })
      }
    }

    await prisma.adminUser.delete({ where: { id } })
    await recordActivityLog({
      entity: 'admin_user',
      entityId: id,
      action: 'DELETE',
      actor: session?.user?.email || session?.user?.name,
      metadata: { email: user.email, role: user.role },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin users DELETE error:', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}
