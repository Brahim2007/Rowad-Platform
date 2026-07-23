/**
 * مصادقة بوابة العضو
 * POST /api/member/auth — تسجيل الدخول
 * GET  /api/member/auth — جلب بيانات العضو الحالي
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { blockRateLimit, clearRateLimit, clientIp, isRateLimited, rateLimit } from '@/lib/rate-limit'
import { requireMemberToken, signMemberToken } from '@/lib/member-auth'
import { logger } from '@/lib/logger'

const LOGIN_MAX_ATTEMPTS = 5
const LOGIN_WINDOW_MS = 5 * 60 * 1000 // 5 دقائق
const BLOCK_DURATION_MS = 15 * 60 * 1000 // 15 دقيقة حظر

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    if (!email || !password) {
      return NextResponse.json({ success: false, message: 'البريد وكلمة المرور مطلوبان' }, { status: 400 })
    }

    // الحماية من هجمات القوة العمياء
    const ip = clientIp(request)
    const emailKey = email.trim().toLowerCase()
    const ipKey = ip === 'unknown' ? null : `login:ip:${ip}`
    const emailLimitKey = `login:email:${emailKey}`
    const blockKey = ipKey ? `login:block:ip:${ip}` : `login:block:email:${emailKey}`

    // فحص الحظر
    if (isRateLimited(blockKey)) {
      return NextResponse.json({ success: false, message: 'تم حظر محاولات الدخول مؤقتاً — حاول بعد 15 دقيقة' }, { status: 429 })
    }

    // فحص معدل المحاولات لكل IP ولكل بريد
    const ipCheck = ipKey ? rateLimit(ipKey, LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_MS) : { success: true }
    const emailCheck = rateLimit(emailLimitKey, LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_MS)

    if (!ipCheck.success || !emailCheck.success) {
      // تسجيل تجاوز الحد — حظر الـ IP
      blockRateLimit(blockKey, BLOCK_DURATION_MS)
      return NextResponse.json({ success: false, message: 'محاولات دخول كثيرة — تم حظرك مؤقتاً لمدة 15 دقيقة' }, { status: 429 })
    }

    const member = await prisma.beneficiary.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: {
        id: true, code: true, firstName: true, lastName: true,
        email: true, networkRole: true, status: true,
        passwordHash: true, mustChangePassword: true,
        platform: { select: { id: true, name: true } },
      },
    })

    if (!member || !member.passwordHash) {
      return NextResponse.json({ success: false, message: 'البريد أو كلمة المرور غير صحيحة' }, { status: 401 })
    }

    if (member.status !== 'ACTIVE') {
      return NextResponse.json({ success: false, message: 'الحساب غير نشط — تواصل مع مدير المنصة' }, { status: 403 })
    }

    const valid = await bcrypt.compare(password, member.passwordHash)
    if (!valid) {
      return NextResponse.json({ success: false, message: 'البريد أو كلمة المرور غير صحيحة' }, { status: 401 })
    }

    if (ipKey) clearRateLimit(ipKey)
    clearRateLimit(emailLimitKey)
    clearRateLimit(blockKey)

    const token = signMemberToken({ id: member.id, email: member.email, role: 'MEMBER' })

    const response = NextResponse.json({
      success: true,
      data: {
        token,
        member: {
          id: member.id,
          code: member.code,
          name: `${member.firstName} ${member.lastName}`.trim(),
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email,
          networkRole: member.networkRole,
          platformId: member.platform?.id || null,
          platformName: member.platform?.name || null,
          mustChangePassword: member.mustChangePassword,
        },
      },
    })

    // تعيين الكوكي
    response.cookies.set('member_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 أيام
      path: '/',
    })

    return response
  } catch (error) {
    logger.error('Member login error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

/** جلب بيانات العضو من الكوكي */
export async function GET(request: NextRequest) {
  try {
    const auth = requireMemberToken(request)
    if (!auth.ok) return auth.error

    const member = await prisma.beneficiary.findUnique({
      where: { id: auth.payload.id },
      select: {
        id: true, code: true, firstName: true, lastName: true,
        email: true, networkRole: true, status: true,
        mustChangePassword: true,
        platform: { select: { id: true, name: true } },
      },
    })

    if (!member || member.status !== 'ACTIVE') {
      return NextResponse.json({ success: false, message: 'الحساب غير نشط' }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: member.id,
        code: member.code,
        name: `${member.firstName} ${member.lastName}`.trim(),
        email: member.email,
        networkRole: member.networkRole,
        platformId: member.platform?.id || null,
        platformName: member.platform?.name || null,
        mustChangePassword: member.mustChangePassword,
      },
    })
  } catch (error) {
    logger.error('Member session error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'تم تسجيل الخروج' })
  response.cookies.set('member_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
  return response
}
