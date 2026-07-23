import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireSuperAdmin as requireSuperAdminAuth } from '@/lib/auth-helpers'
import { logger } from '@/lib/logger'
import { AdminUserSchema } from '@/lib/validations/admin'
import { recordActivityLog } from '@/lib/activity-log'

async function requireSuperAdmin() {
  const auth = await requireSuperAdminAuth()
  return auth.ok ? { error: null, user: auth.user } : { error: auth.error, user: null }
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
  platformManagerAssignments?: Array<{ assignmentRole: 'PRIMARY' | 'DEPUTY' }>
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
    assignmentRole: user.platformManagerAssignments?.[0]?.assignmentRole ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

async function hasAnotherActivePrimaryManager(platformId: string, excludeUserId?: string) {
  return (await prisma.platformManagerAssignment.count({
    where: {
      platformId,
      assignmentRole: 'PRIMARY',
      endedAt: null,
      adminUser: {
        isActive: true,
        ...(excludeUserId ? { NOT: { id: excludeUserId } } : {}),
      },
    },
  })) > 0
}

const ManagerAwareAdminUserSchema = AdminUserSchema.extend({
  assignmentRole: z.enum(['PRIMARY', 'DEPUTY']).optional().default('PRIMARY'),
})

export async function GET() {
  const { error } = await requireSuperAdmin()
  if (error) return error

  try {
    const users = await prisma.adminUser.findMany({
      orderBy: [{ role: 'asc' }, { createdAt: 'desc' }],
      include: {
        platform: { select: { id: true, name: true } },
        platformManagerAssignments: {
          where: { endedAt: null },
          take: 1,
          select: { assignmentRole: true },
        },
      },
    })

    return NextResponse.json({ success: true, data: users.map(toSafeUser) })
  } catch (error) {
    logger.error('Admin users GET error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { error, user: actor } = await requireSuperAdmin()
  if (error) return error

  try {
    const input = ManagerAwareAdminUserSchema.extend({
      password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
    }).parse(await request.json())

    // التحقق من وجود platformId عند دور PLATFORM_MANAGER
    if (input.role === 'PLATFORM_MANAGER' && !input.platformId) {
      return NextResponse.json({ success: false, message: 'يجب اختيار منصة لمدير المنصة' }, { status: 400 })
    }
    if (input.role === 'PLATFORM_MANAGER' && input.assignmentRole === 'PRIMARY' && input.isActive && input.platformId && await hasAnotherActivePrimaryManager(input.platformId)) {
      return NextResponse.json({ success: false, message: 'يوجد مدير أساسي نشط لهذه المنصة بالفعل' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(input.password, 12)
    const user = await prisma.$transaction(async tx => {
      const created = await tx.adminUser.create({
        data: {
          email: input.email,
          fullName: input.fullName,
          role: input.role,
          isActive: input.isActive,
          passwordHash,
          platformId: input.role === 'PLATFORM_MANAGER' ? (input.platformId || null) : null,
        },
        include: { platform: { select: { id: true, name: true } } },
      })
      if (created.role === 'PLATFORM_MANAGER' && created.isActive && created.platformId) {
        await tx.platformManagerAssignment.create({
          data: {
            platformId: created.platformId,
            adminUserId: created.id,
            assignmentRole: input.assignmentRole,
            assignedBy: actor?.email || actor?.name,
          },
        })
      }
      return tx.adminUser.findUniqueOrThrow({
        where: { id: created.id },
        include: {
          platform: { select: { id: true, name: true } },
          platformManagerAssignments: { where: { endedAt: null }, take: 1, select: { assignmentRole: true } },
        },
      })
    })

    await recordActivityLog({
      entity: 'admin_user',
      entityId: user.id,
      action: 'CREATE',
      actor: actor?.email || actor?.name,
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
    logger.error('Admin users POST error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const { error, user: actor } = await requireSuperAdmin()
  if (error) return error

  try {
    const body = await request.json()
    const id = body.id
    if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })

    const input = ManagerAwareAdminUserSchema.parse(body)
    const activeSuperAdmins = await prisma.adminUser.count({
      where: { role: 'SUPER_ADMIN', isActive: true, NOT: { id } },
    })

    const current = await prisma.adminUser.findUnique({
      where: { id },
      include: {
        platformManagerAssignments: { where: { endedAt: null }, take: 1, select: { assignmentRole: true } },
      },
    })
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
    if (input.role === 'PLATFORM_MANAGER' && input.assignmentRole === 'PRIMARY' && input.isActive && input.platformId && await hasAnotherActivePrimaryManager(input.platformId, id)) {
      return NextResponse.json({ success: false, message: 'يوجد مدير أساسي نشط لهذه المنصة بالفعل' }, { status: 409 })
    }

    const nextPlatformId = input.role === 'PLATFORM_MANAGER' ? (input.platformId || null) : null
    const assignmentChanged =
      current.role !== input.role ||
      current.platformId !== nextPlatformId ||
      current.isActive !== input.isActive ||
      current.platformManagerAssignments[0]?.assignmentRole !== input.assignmentRole
    const passwordHash = input.password ? await bcrypt.hash(input.password, 12) : null

    const user = await prisma.$transaction(async tx => {
      const updated = await tx.adminUser.update({
        where: { id },
        data: {
          email: input.email,
          fullName: input.fullName,
          role: input.role,
          isActive: input.isActive,
          platformId: nextPlatformId,
          ...(passwordHash ? { passwordHash } : {}),
        },
        include: {
          platform: { select: { id: true, name: true } },
          platformManagerAssignments: { where: { endedAt: null }, take: 1, select: { assignmentRole: true } },
        },
      })

      if (assignmentChanged) {
        await tx.platformManagerAssignment.updateMany({
          where: { adminUserId: id, endedAt: null },
          data: { endedAt: new Date() },
        })
      }
      if (updated.role === 'PLATFORM_MANAGER' && updated.isActive && updated.platformId) {
        const activeAssignment = await tx.platformManagerAssignment.findFirst({
          where: { adminUserId: id, platformId: updated.platformId, endedAt: null },
          select: { id: true },
        })
        if (!activeAssignment) {
          await tx.platformManagerAssignment.create({
            data: {
              platformId: updated.platformId,
              adminUserId: updated.id,
              assignmentRole: input.assignmentRole,
              assignedBy: actor?.email || actor?.name,
            },
          })
        }
      }
      return tx.adminUser.findUniqueOrThrow({
        where: { id: updated.id },
        include: {
          platform: { select: { id: true, name: true } },
          platformManagerAssignments: { where: { endedAt: null }, take: 1, select: { assignmentRole: true } },
        },
      })
    })

    await recordActivityLog({
      entity: 'admin_user',
      entityId: user.id,
      action: 'UPDATE',
      actor: actor?.email || actor?.name,
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
    logger.error('Admin users PUT error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const { error, user: actor } = await requireSuperAdmin()
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

    const assignmentCount = await prisma.platformManagerAssignment.count({ where: { adminUserId: id } })
    if (assignmentCount > 0) {
      await prisma.$transaction([
        prisma.platformManagerAssignment.updateMany({
          where: { adminUserId: id, endedAt: null },
          data: { endedAt: new Date() },
        }),
        prisma.adminUser.update({
          where: { id },
          data: { isActive: false, platformId: null },
        }),
      ])
    } else {
      await prisma.adminUser.delete({ where: { id } })
    }
    await recordActivityLog({
      entity: 'admin_user',
      entityId: id,
      action: 'DELETE',
      actor: actor?.email || actor?.name,
      metadata: { email: user.email, role: user.role },
    })

    return NextResponse.json({ success: true, archived: assignmentCount > 0 })
  } catch (error) {
    logger.error('Admin users DELETE error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}
