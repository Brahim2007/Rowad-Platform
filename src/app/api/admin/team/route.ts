import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TeamMemberSchema } from '@/lib/validations/team'
import { getPlatformScope, platformWhere, requireAuth, verifyPlatformOwnership } from '@/lib/auth-helpers'
import { logger } from '@/lib/logger'
import { z } from 'zod'

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/)
  const lastName = parts.length > 1 ? parts.pop()! : ''
  const firstName = parts.join(' ')
  return { firstName, lastName }
}

export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error

  try {
    const scope = getPlatformScope(auth.user)
    const members = await prisma.beneficiary.findMany({
      where: { ...platformWhere(scope), type: { in: ['TEAM', 'BOTH'] } },
      orderBy: { sortOrder: 'asc' },
    })
    // Map to the shape the admin page expects (with name merged)
    const mapped = members.map(m => ({
      id: m.id,
      name: `${m.firstName} ${m.lastName}`,
      slug: m.slug || '',
      role: m.role || '',
      bio: m.bio,
      avatar: m.avatar,
      email: m.email,
      linkedinUrl: m.linkedinUrl,
      memberSince: m.memberSince || m.createdAt,
      sortOrder: m.sortOrder,
      isActive: m.status === 'ACTIVE',
    }))
    return NextResponse.json({ success: true, data: mapped })
  } catch (error) {
    logger.error('Team GET error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error

  try {
    const body = await request.json()
    const normalized = body.name && !body.firstName
      ? { ...body, ...splitName(body.name) }
      : body
    const validated = TeamMemberSchema.parse(normalized)

    // Generate code if not provided
    const code = validated.code || `TM-${validated.slug}`
    const platformId = auth.user.role === 'PLATFORM_MANAGER' ? auth.user.platformId : null
    if (auth.user.role === 'PLATFORM_MANAGER' && !platformId) {
      return NextResponse.json({ success: false, message: 'مدير المنصة غير مرتبط بمنصة' }, { status: 403 })
    }

    const member = await prisma.beneficiary.create({
      data: {
        ...splitName(validated.firstName),
        type: 'TEAM',
        role: validated.role,
        slug: validated.slug,
        bio: validated.bio || null,
        avatar: validated.avatar || null,
        email: validated.email || null,
        linkedinUrl: validated.linkedinUrl || null,
        sortOrder: validated.sortOrder,
        status: validated.isActive ? 'ACTIVE' : 'INACTIVE',
        memberSince: new Date(),
        code,
        platformId,
      },
    })
    return NextResponse.json({ success: true, data: { ...member, name: `${member.firstName} ${member.lastName}` } }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, errors: error.flatten() }, { status: 400 })
    }
    logger.error('Team POST error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error

  try {
    const body = await request.json()
    const { id, name, ...data } = body
    if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })
    const current = await prisma.beneficiary.findUnique({ where: { id }, select: { platformId: true } })
    if (!current) return NextResponse.json({ success: false, message: 'عضو الفريق غير موجود' }, { status: 404 })
    if (!(await verifyPlatformOwnership(auth.user, current.platformId))) {
      return NextResponse.json({ success: false, message: 'غير مصرح — خارج نطاق المنصة' }, { status: 403 })
    }

    const updateData: Record<string, unknown> = {}
    if (name) {
      const { firstName, lastName } = splitName(name)
      updateData.firstName = firstName
      updateData.lastName = lastName
    }
    if (data.role !== undefined) updateData.role = data.role
    if (data.slug !== undefined) updateData.slug = data.slug || null
    if (data.bio !== undefined) updateData.bio = data.bio || null
    if (data.avatar !== undefined) updateData.avatar = data.avatar || null
    if (data.email !== undefined) updateData.email = data.email || null
    if (data.linkedinUrl !== undefined) updateData.linkedinUrl = data.linkedinUrl || null
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder
    if (data.isActive !== undefined) updateData.status = data.isActive ? 'ACTIVE' : 'INACTIVE'

    const member = await prisma.beneficiary.update({ where: { id }, data: updateData })
    return NextResponse.json({ success: true, data: { ...member, name: `${member.firstName} ${member.lastName}` } })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, errors: error.flatten() }, { status: 400 })
    }
    logger.error('Team PUT error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })
    const member = await prisma.beneficiary.findUnique({ where: { id }, select: { platformId: true } })
    if (!member) return NextResponse.json({ success: false, message: 'عضو الفريق غير موجود' }, { status: 404 })
    if (!(await verifyPlatformOwnership(auth.user, member.platformId))) {
      return NextResponse.json({ success: false, message: 'غير مصرح — خارج نطاق المنصة' }, { status: 403 })
    }
    await prisma.beneficiary.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Team DELETE error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}
