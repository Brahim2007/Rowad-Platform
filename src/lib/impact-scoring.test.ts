import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildActionMap,
  finalPoints,
  filterByScope,
  levelOf,
  memberMonthlyPoints,
  platformAggregation,
  rewardEligibility,
  umrahEligible,
  type ImpactActionItem,
  type ImpactLogEntry,
} from './impact-scoring'

const actions: ImpactActionItem[] = [
  { id: 'post', name: 'منشور رقمي', points: 10, category: 'DIGITAL_ACTIVITY', isActive: true, sortOrder: 1 },
  { id: 'initiative', name: 'مبادرة مجتمعية', points: 500, category: 'INITIATIVES', isActive: true, sortOrder: 2 },
  { id: 'violation', name: 'مخالفة', points: -20, category: 'DISCIPLINE', isActive: true, sortOrder: 3 },
]

const actionMap = buildActionMap(actions)

function entry(overrides: Partial<ImpactLogEntry>): ImpactLogEntry {
  return {
    id: 'log-1',
    beneficiaryId: 'member-1',
    actionId: 'post',
    count: 1,
    quality: 'ACCEPTABLE',
    status: 'APPROVED',
    date: '2026-07-05',
    ...overrides,
  }
}

describe('impact-scoring', () => {
  it('calculates final points from count, action points, and quality bonus', () => {
    assert.equal(finalPoints(entry({ count: 2, quality: 'GOOD' }), actionMap), 23)
    assert.equal(finalPoints(entry({ status: 'PENDING_REVIEW' }), actionMap), 0)
    assert.equal(finalPoints(entry({ status: 'REJECTED' }), actionMap), 0)
  })

  it('filters entries by month and week scopes', () => {
    const entries = [
      entry({ id: 'a', date: '2026-07-01' }),
      entry({ id: 'b', date: '2026-07-05' }),
      entry({ id: 'c', date: '2026-06-30' }),
    ]

    assert.deepEqual(filterByScope(entries, { type: 'month', year: 2026, month: 7 }).map(e => e.id), ['a', 'b'])
    assert.deepEqual(filterByScope(entries, { type: 'week', ref: '2026-07-05' }).map(e => e.id), ['a', 'b', 'c'])
    assert.equal(memberMonthlyPoints(entries, actionMap, 2026, 7), 20)
  })

  it('resolves levels and reward eligibility boundaries', () => {
    assert.equal(levelOf(0).name, 'عضو جديد')
    assert.equal(levelOf(100).name, 'عضو نشط')
    assert.deepEqual(rewardEligibility(150, true), { tier: 'أساسية', eligible: true })
    assert.deepEqual(rewardEligibility(150, false), { tier: 'لا استحقاق', eligible: false })
  })

  it('checks umrah eligibility conditions', () => {
    const yearlyEntries = Array.from({ length: 9 }, (_, index) => entry({
      id: `month-${index + 1}`,
      actionId: index === 0 ? 'initiative' : 'post',
      count: index === 0 ? 6 : 1,
      quality: index === 0 ? 'EXCELLENT' : 'GOOD',
      date: `2026-${String(index + 1).padStart(2, '0')}-10`,
    }))

    assert.equal(umrahEligible(yearlyEntries, actionMap, 2026), true)
    assert.equal(umrahEligible([...yearlyEntries, entry({ id: 'bad', actionId: 'violation', date: '2026-10-10' })], actionMap, 2026), false)
  })

  it('aggregates platform points and best member', () => {
    const result = platformAggregation([
      { id: 'm1', firstName: 'A', lastName: 'One', platformName: 'P1', entries: [entry({ id: '1', platformName: 'P1', count: 2 })] },
      { id: 'm2', firstName: 'B', lastName: 'Two', platformName: 'P1', entries: [entry({ id: '2', platformName: 'P1', count: 1, quality: 'GOOD' })] },
      { id: 'm3', firstName: 'C', lastName: 'Three', platformName: 'P2', entries: [entry({ id: '3', platformName: 'P2', count: 1 })] },
    ], actionMap)

    assert.equal(result[0].platform, 'P1')
    assert.equal(result[0].points, 33)
    assert.equal(result[0].best, 'A One')
    assert.equal(result[0].count, 2)
  })
})
