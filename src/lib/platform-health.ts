export interface PlatformHealthInput {
  hasManager: boolean
  managerHasLoggedIn: boolean
  memberCount: number
  activeRate: number
  stalePending: number
  activityTrend: number
  reportCount: number
  approvedReportCount: number
}

export type PlatformHealthStatus = 'HEALTHY' | 'WATCH' | 'CRITICAL'

export function calculatePlatformHealth(input: PlatformHealthInput) {
  let score = 100
  if (!input.hasManager) score -= 30
  if (!input.memberCount) score -= 15
  else if (input.activeRate < 30) score -= 20
  else if (input.activeRate < 50) score -= 10
  if (input.stalePending) score -= Math.min(20, input.stalePending * 5)
  if (input.hasManager && !input.managerHasLoggedIn) score -= 10
  if (input.activityTrend < -30) score -= 10
  if (input.reportCount > 0 && input.approvedReportCount === 0) score -= 10
  score = Math.max(0, Math.min(100, score))

  const status: PlatformHealthStatus = score >= 80 ? 'HEALTHY' : score >= 55 ? 'WATCH' : 'CRITICAL'
  return { score, status }
}
