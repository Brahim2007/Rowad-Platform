export type MemberImpactLog = {
  beneficiaryId: string
  status: 'APPROVED' | 'PENDING_REVIEW' | 'REJECTED'
  date: Date | string
  count: number
  quality: 'WEAK' | 'ACCEPTABLE' | 'GOOD' | 'EXCELLENT' | 'EXCEPTIONAL'
  action: { points: number } | null
}

const QUALITY_BONUS: Record<MemberImpactLog['quality'], number> = {
  WEAK: -3,
  ACCEPTABLE: 0,
  GOOD: 3,
  EXCELLENT: 6,
  EXCEPTIONAL: 10,
}

export function memberLogPoints(log: MemberImpactLog): number {
  if (log.status !== 'APPROVED' || !log.action) return 0
  return (log.count || 1) * log.action.points + QUALITY_BONUS[log.quality]
}

export function memberImpactTotals(logs: MemberImpactLog[], now = new Date()) {
  const year = now.getFullYear()
  const month = now.getMonth()
  let totalPoints = 0
  let monthlyPoints = 0

  for (const log of logs) {
    const points = memberLogPoints(log)
    totalPoints += points
    const date = new Date(log.date)
    if (date.getFullYear() === year && date.getMonth() === month) monthlyPoints += points
  }

  return { totalPoints, monthlyPoints }
}

export function memberRank(logs: MemberImpactLog[], memberId: string): number {
  const totals = new Map<string, number>()
  for (const log of logs) {
    totals.set(log.beneficiaryId, (totals.get(log.beneficiaryId) || 0) + memberLogPoints(log))
  }

  const memberTotal = totals.get(memberId) || 0
  return 1 + Array.from(totals.entries()).filter(([id, total]) => id !== memberId && total > memberTotal).length
}
