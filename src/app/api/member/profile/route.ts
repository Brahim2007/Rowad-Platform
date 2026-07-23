/**
 * API الملف الشخصي للعضو
 * PUT /api/member/profile — تغيير كلمة المرور
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { requireActiveMember } from '@/lib/member-auth'
import { logger } from '@/lib/logger'
import { sendPasswordChangedEmail } from '@/lib/email'

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireActiveMember(request)
    if (!auth.ok) return auth.error

    const { memberId, currentPassword, newPassword } = await request.json()
    if (memberId !== auth.payload.id) {
      return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 403 })
    }

    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return NextResponse.json({ success: false, message: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' }, { status: 400 })
    }

    const member = await prisma.beneficiary.findUnique({
      where: { id: memberId },
      select: { passwordHash: true, status: true },
    })

    if (!member || member.status !== 'ACTIVE') {
      return NextResponse.json({ success: false, message: 'الحساب غير نشط' }, { status: 403 })
    }
    if (!member.passwordHash) {
      return NextResponse.json({ success: false, message: 'لا توجد كلمة مرور سابقة' }, { status: 400 })
    }

    const valid = await bcrypt.compare(currentPassword, member.passwordHash)
    if (!valid) {
      return NextResponse.json({ success: false, message: 'كلمة المرور الحالية غير صحيحة' }, { status: 400 })
    }

    await prisma.beneficiary.update({
      where: { id: memberId },
      data: {
        passwordHash: await bcrypt.hash(newPassword, 12),
        mustChangePassword: false,
      },
    })

    if (auth.member.email) {
      try {
        await sendPasswordChangedEmail({
          to: auth.member.email,
          memberName: `${auth.member.firstName} ${auth.member.lastName}`.trim(),
          platformId: auth.member.platformId,
        })
      } catch (error) {
        logger.error('Password changed confirmation email error', error)
      }
    }

    return NextResponse.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' })
  } catch (error) {
    logger.error('Member profile PUT error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}
