import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getFieldHelp, fieldHelpKeySchema } from '@/lib/ai/field-help'
import { requireAuth } from '@/lib/auth-helpers'
import { getMemberTokenPayload, requireActiveMember } from '@/lib/member-auth'
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit'

export const runtime = 'nodejs'

const requestSchema = z.object({
  fieldKey: fieldHelpKeySchema,
}).strict()

export async function POST(request: NextRequest) {
  let userId: string
  let audience: 'member' | 'admin'

  if (getMemberTokenPayload(request)) {
    const auth = await requireActiveMember(request)
    if (!auth.ok) return auth.error
    userId = auth.member.id
    audience = 'member'
  } else {
    const auth = await requireAuth({ allowEvaluator: true })
    if (!auth.ok) return auth.error
    userId = auth.user.id
    audience = 'admin'
  }

  const limit = rateLimit(`field-help:${audience}:${userId}`, 120, 60 * 60 * 1000)
  if (!limit.success) {
    return rateLimitResponse('وصلت إلى حد مساعدات الحقول لهذه الساعة — حاول لاحقًا', limit.retryAfter)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, message: 'بيانات الطلب غير صالحة' }, { status: 400 })
  }

  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'حقل المساعدة غير معتمد' }, { status: 400 })
  }

  const result = await getFieldHelp(parsed.data.fieldKey)
  return NextResponse.json({
    success: true,
    data: result.help,
    source: result.source,
  })
}
