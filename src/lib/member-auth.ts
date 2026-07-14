import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { getJwtSecret } from '@/lib/jwt'

export interface MemberTokenPayload {
  id: string
  email: string | null
  role: 'MEMBER'
}

function isMemberTokenPayload(value: unknown): value is MemberTokenPayload {
  if (!value || typeof value !== 'object') return false
  const payload = value as Partial<MemberTokenPayload>
  return typeof payload.id === 'string' && payload.role === 'MEMBER'
}

export function signMemberToken(payload: MemberTokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' })
}

export function verifyMemberToken(token: string): MemberTokenPayload | null {
  try {
    const payload = jwt.verify(token, getJwtSecret())
    return isMemberTokenPayload(payload) ? payload : null
  } catch {
    return null
  }
}

export function getMemberTokenPayload(request: NextRequest): MemberTokenPayload | null {
  const token = request.cookies.get('member_token')?.value
  return token ? verifyMemberToken(token) : null
}

export function requireMemberToken(request: NextRequest):
  | { ok: true; payload: MemberTokenPayload }
  | { ok: false; error: NextResponse } {
  const payload = getMemberTokenPayload(request)
  if (!payload) {
    return {
      ok: false,
      error: NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 }),
    }
  }
  return { ok: true, payload }
}
