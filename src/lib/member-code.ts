import { prisma } from '@/lib/prisma'

const MEMBER_CODE_WIDTH = 6

/**
 * يولّد رقم عضوية متسلسلًا وموحدًا لكل أنواع الأعضاء.
 * يعتمد على PostgreSQL sequence لضمان عدم التكرار حتى مع الطلبات المتزامنة.
 */
export async function generateMemberCode(): Promise<string> {
  const rows = await prisma.$queryRaw<Array<{ value: bigint }>>`
    SELECT nextval('beneficiary_code_seq') AS value
  `
  const value = rows[0]?.value
  if (value === undefined) throw new Error('تعذر توليد رقم العضو')
  return value.toString().padStart(MEMBER_CODE_WIDTH, '0')
}
