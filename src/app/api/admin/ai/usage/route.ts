import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const DEFAULT_MONTHLY_BUDGET = 5

function round(value: number, decimals = 6) {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error

  if (auth.user.role !== 'SUPER_ADMIN' && auth.user.role !== 'ADMIN') {
    return NextResponse.json(
      { success: false, error: 'غير مصرح لك بعرض رصيد الذكاء الاصطناعي' },
      { status: 403 },
    )
  }

  const configuredBudget = Number(process.env.AI_MONTHLY_BUDGET)
  const monthlyBudget =
    Number.isFinite(configuredBudget) && configuredBudget > 0
      ? configuredBudget
      : DEFAULT_MONTHLY_BUDGET

  const now = new Date()
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const usage = await prisma.aiUsageLog.aggregate({
    where: {
      createdAt: {
        gte: periodStart,
        lt: periodEnd,
      },
    },
    _sum: {
      inputTokens: true,
      outputTokens: true,
      costEstimate: true,
    },
    _count: {
      _all: true,
    },
  })

  const consumed = Math.max(0, usage._sum.costEstimate ?? 0)
  const remaining = Math.max(0, monthlyBudget - consumed)
  const inputTokens = usage._sum.inputTokens ?? 0
  const outputTokens = usage._sum.outputTokens ?? 0

  return NextResponse.json(
    {
      success: true,
      data: {
        budget: round(monthlyBudget),
        consumed: round(consumed),
        remaining: round(remaining),
        usagePercent: round(
          Math.min(100, (consumed / monthlyBudget) * 100),
          2,
        ),
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        requests: usage._count._all,
        currency: 'USD',
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
      },
    },
    {
      headers: {
        'Cache-Control': 'private, no-store',
      },
    },
  )
}
