import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { calculatePlatformHealth } from './platform-health'

describe('platform health score', () => {
  it('keeps a healthy, managed and active platform at full score', () => {
    assert.deepEqual(calculatePlatformHealth({
      hasManager: true,
      managerHasLoggedIn: true,
      memberCount: 20,
      activeRate: 80,
      stalePending: 0,
      activityTrend: 10,
      reportCount: 3,
      approvedReportCount: 2,
    }), { score: 100, status: 'HEALTHY' })
  })

  it('places an unmanaged empty platform under watch before other risks are added', () => {
    assert.deepEqual(calculatePlatformHealth({
      hasManager: false,
      managerHasLoggedIn: false,
      memberCount: 0,
      activeRate: 0,
      stalePending: 0,
      activityTrend: 0,
      reportCount: 0,
      approvedReportCount: 0,
    }), { score: 55, status: 'WATCH' })
  })

  it('caps stale-pending deductions and never returns a negative score', () => {
    const result = calculatePlatformHealth({
      hasManager: false,
      managerHasLoggedIn: false,
      memberCount: 10,
      activeRate: 0,
      stalePending: 100,
      activityTrend: -90,
      reportCount: 5,
      approvedReportCount: 0,
    })
    assert.equal(result.score, 10)
    assert.equal(result.status, 'CRITICAL')
  })
})
