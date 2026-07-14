import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { memberImpactTotals, memberRank, type MemberImpactLog } from './member-impact'

function log(overrides: Partial<MemberImpactLog> = {}): MemberImpactLog {
  return {
    beneficiaryId: 'member-a',
    status: 'APPROVED',
    date: new Date('2026-07-10T12:00:00Z'),
    count: 1,
    quality: 'ACCEPTABLE',
    action: { points: 10 },
    ...overrides,
  }
}

describe('member impact totals', () => {
  it('uses every supplied log instead of a recent-item limit', () => {
    const logs = Array.from({ length: 60 }, () => log())
    assert.deepEqual(memberImpactTotals(logs, new Date('2026-07-14T12:00:00Z')), {
      totalPoints: 600,
      monthlyPoints: 600,
    })
  })

  it('excludes unapproved logs and separates the current month', () => {
    const logs = [
      log({ quality: 'GOOD' }),
      log({ date: new Date('2026-06-10T12:00:00Z') }),
      log({ status: 'PENDING_REVIEW' }),
    ]
    assert.deepEqual(memberImpactTotals(logs, new Date('2026-07-14T12:00:00Z')), {
      totalPoints: 23,
      monthlyPoints: 13,
    })
  })

  it('calculates competition rank and gives equal totals the same rank', () => {
    const logs = [
      log({ beneficiaryId: 'member-a', action: { points: 20 } }),
      log({ beneficiaryId: 'member-b', action: { points: 30 } }),
      log({ beneficiaryId: 'member-c', action: { points: 20 } }),
    ]
    assert.equal(memberRank(logs, 'member-a'), 2)
    assert.equal(memberRank(logs, 'member-c'), 2)
    assert.equal(memberRank(logs, 'member-b'), 1)
  })
})
