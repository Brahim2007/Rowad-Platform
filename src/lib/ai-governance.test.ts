import test from 'node:test'
import assert from 'node:assert/strict'
import { buildGovernanceDrafts } from './ai-governance'

test('AI governance deterministic evidence engine', () => {
  const drafts = buildGovernanceDrafts({
    period: '2026-07',
    unassignedMembers: 2,
    unscopedLogs: 3,
    approvedWithoutEvidence: 4,
    suspiciousHighCountLogs: 1,
    platforms: [{
      id: 'p1',
      name: 'منصة اختبار',
      managerId: null,
      managerName: null,
      managerLastLoginAt: null,
      memberCount: 5,
      activeRate: 20,
      stalePending: 2,
      approvedReports: 0,
    }],
  })
  assert.ok(drafts.some(item => item.fingerprint.startsWith('UNASSIGNED_MEMBERS')))
  assert.ok(drafts.some(item => item.fingerprint.startsWith('NO_MANAGER')))
  assert.ok(drafts.some(item => item.fingerprint.startsWith('STALE_REVIEWS')))
  assert.ok(drafts.every(item => item.evidence.length > 0 && item.proposedAction.length > 0))
})
