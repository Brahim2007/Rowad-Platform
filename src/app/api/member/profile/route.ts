/**
 * API الملف الشخصي للعضو
 * PUT /api/member/profile — تغيير كلمة المرور
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.AUTH_SECRET || 'member-secret-dev'

function verifyToken(token: string): any {
  try { return jwt.verify(token, JWT_SECRET) } catch { return null }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('member_token')?.value
    if (!token) return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ success: false, message: 'انتهت الجلسة' }, { status: 401 })

    const { memberId, currentPassword, newPassword } = await request.json()
    if (memberId !== payload.id) {
      return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 403 })
    }

    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return NextResponse.json({ success: false, message: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' }, { status: 400 })
    }

    const member = await (prisma as any).beneficiary.findUnique({
      where: { id: memberId },
      select: { passwordHash: true },
    })

    if (!member?.passwordHash) {
      return NextResponse.json({ success: false, message: 'لا توجد كلمة مرور سابقة' }, { status: 400 })
    }

    const valid = await bcrypt.compare(currentPassword, member.passwordHash)
    if (!valid) {
      return NextResponse.json({ success: false, message: 'كلمة المرور الحالية غير صحيحة' }, { status: 400 })
    }

    await (prisma as any).beneficiary.update({
      where: { id: memberId },
      data: {
        passwordHash: await bcrypt.hash(newPassword, 12),
        mustChangePassword: false,
      },
    })

    return NextResponse.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' })
  } catch (error) {
    console.error('Member profile PUT error:', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}
