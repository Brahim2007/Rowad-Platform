/**
 * استيراد جماعي للأعضاء عبر CSV
 * POST /api/admin/members/import
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, verifyPlatformOwnership } from '@/lib/auth-helpers'
import { logger } from '@/lib/logger'
import bcrypt from 'bcryptjs'
import { sendWelcomeEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error

  if (auth.user.role !== 'SUPER_ADMIN' && auth.user.role !== 'ADMIN' && auth.user.role !== 'PLATFORM_MANAGER') {
    return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 403 })
  }

  try {
    const { rows, platformId } = await request.json()
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ success: false, message: 'الملف فارغ أو بصيغة غير صحيحة' }, { status: 400 })
    }

    if (rows.length > 100) {
      return NextResponse.json({ success: false, message: 'الحد الأقصى 100 عضو في المرة الواحدة' }, { status: 400 })
    }

    const targetPlatformId = auth.user.role === 'PLATFORM_MANAGER' ? auth.user.platformId : platformId || null
    if (auth.user.role === 'PLATFORM_MANAGER' && !targetPlatformId) {
      return NextResponse.json({ success: false, message: 'مدير المنصة غير مرتبط بمنصة' }, { status: 403 })
    }
    if (targetPlatformId && !(await verifyPlatformOwnership(auth.user, targetPlatformId))) {
      return NextResponse.json({ success: false, message: 'غير مصرح — خارج نطاق المنصة' }, { status: 403 })
    }
    const results: Array<{ row: number; status: 'created' | 'error'; name: string; message: string }> = []
    let created = 0

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      try {
        const firstName = String(row.firstName || row.FirstName || row['الاسم الأول'] || row['الاسم'] || '').trim()
        const lastName = String(row.lastName || row.LastName || row['اسم العائلة'] || '').trim()
        const email = String(row.email || row.Email || row['البريد'] || '').trim().toLowerCase()
        const code = String(row.code || row.Code || row['الكود'] || '').trim()
        const networkRole = String(row.networkRole || row.NetworkRole || row['الصفة'] || '').trim()
        const joinDate = String(row.joinDate || row.JoinDate || row['تاريخ الانضمام'] || '').trim()

        if (!firstName) {
          results.push({ row: i + 2, status: 'error', name: `صف ${i + 2}`, message: 'الاسم الأول مطلوب' })
          continue
        }

        const memberCode = code || `R-${Date.now().toString(36).toUpperCase()}`

        // Check for duplicate
        const existing = await prisma.beneficiary.findFirst({
          where: email ? { OR: [{ email }, { code: memberCode }] } : { code: memberCode },
        })
        if (existing) {
          results.push({ row: i + 2, status: 'error', name: `${firstName} ${lastName}`, message: 'الكود أو البريد مستخدم مسبقاً' })
          continue
        }

        const tempPassword = email ? (Math.random().toString(36).slice(2, 10) + 'A1!') : null
        const passwordHash = tempPassword ? await bcrypt.hash(tempPassword, 12) : null

        await prisma.beneficiary.create({
          data: {
            firstName,
            lastName,
            code: memberCode,
            email: email || null,
            networkRole: networkRole || null,
            joinDate: joinDate ? new Date(joinDate) : new Date(),
            status: 'ACTIVE',
            type: 'BENEFICIARY',
            platformId: targetPlatformId,
            ...(passwordHash ? { passwordHash, mustChangePassword: true } : {}),
          },
        })

        // Send welcome email
        if (email && tempPassword) {
          try {
            const platformName = auth.user.platformName || 'شبكة رواد'
            await sendWelcomeEmail({
              to: email,
              memberName: `${firstName} ${lastName}`.trim(),
              platformName,
              tempPassword,
              loginUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/ar/member/login`,
            })
          } catch { /* email optional */ }
        }

        results.push({ row: i + 2, status: 'created', name: `${firstName} ${lastName}`.trim(), message: 'تم الإنشاء' })
        created++
      } catch (e: unknown) {
        results.push({ row: i + 2, status: 'error', name: `صف ${i + 2}`, message: e instanceof Error ? e.message : 'خطأ غير معروف' })
      }
    }

    return NextResponse.json({ success: true, data: { created, total: rows.length, results } }, { status: 201 })
  } catch (error) {
    logger.error('Members import error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الاستيراد' }, { status: 500 })
  }
}
