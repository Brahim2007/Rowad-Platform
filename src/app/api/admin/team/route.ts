import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { TeamMemberSchema } from '@/lib/validations/team'
import { z } from 'zod'

async function checkAuth() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })
  }
  return null
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/)
  const lastName = parts.length > 1 ? parts.pop()! : ''
  const firstName = parts.join(' ')
  return { firstName, lastName }
}

export async function GET() {
  const authError = await checkAuth()
  if (authError) return authError

  try {
    const members = await prisma.beneficiary.findMany({
      where: { type: { in: ['TEAM', 'BOTH'] } },
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
  } catch {
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authError = await checkAuth()
  if (authError) return authError

  try {
    const body = await request.json()
    const normalized = body.name && !body.firstName
      ? { ...body, ...splitName(body.name) }
      : body
    const validated = TeamMemberSchema.parse(normalized)

    // Generate code if not provided
    const code = validated.code || `TM-${validated.slug}`

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
      },
    })
    return NextResponse.json({ success: true, data: { ...member, name: `${member.firstName} ${member.lastName}` } }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, errors: error.flatten() }, { status: 400 })
    }
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const authError = await checkAuth()
  if (authError) return authError

  try {
    const body = await request.json()
    const { id, name, ...data } = body
    if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })

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
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const authError = await checkAuth()
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, message: 'المعرف مطلوب' }, { status: 400 })
    await prisma.beneficiary.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}
