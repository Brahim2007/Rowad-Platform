import test from 'node:test'
import assert from 'node:assert/strict'
import { buildPerformanceAlertProposals } from './performance-alerts'

test('performance alert proposals', async t => {
  await t.test('alerts administrators when a platform has no manager', () => {
    const result = buildPerformanceAlertProposals({
      platformName: 'منصة الاختبار',
      platformSlug: 'test',
      managers: [],
      administrators: [{ id: 'a1', name: 'المشرف' }],
      members: [],
      activeRate: 0,
      stalePending: 0,
    })
    assert.equal(result[0]?.rule, 'NO_MANAGER')
    assert.equal(result[0]?.recipientType, 'ADMIN')
  })

  await t.test('creates manager and member coaching without inventing recipients', () => {
    const result = buildPerformanceAlertProposals({
      platformName: 'منصة الاختبار',
      platformSlug: 'test',
      managers: [{ id: 'm1', name: 'المدير' }],
      administrators: [],
      members: [
        { id: 'u1', name: 'عضو خامل', currentApproved: 0, previousApproved: 1 },
        { id: 'u2', name: 'عضو مميز', currentApproved: 3, previousApproved: 2 },
      ],
      activeRate: 20,
      stalePending: 4,
    })
    assert.deepEqual(
      result.map(item => item.rule).sort(),
      ['LOW_ENGAGEMENT', 'MEMBER_INACTIVE', 'MEMBER_RECOGNITION', 'STALE_PENDING'].sort(),
    )
    assert.deepEqual(new Set(result.map(item => item.recipientId)), new Set(['m1', 'u1', 'u2']))
  })
})
