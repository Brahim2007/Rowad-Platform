import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { canSetReportStatus, parseReportStatus } from './report-policy'

describe('report approval policy', () => {
  it('allows platform managers and editors to draft or submit only', () => {
    for (const role of ['PLATFORM_MANAGER', 'EDITOR'] as const) {
      assert.equal(canSetReportStatus(role, 'DRAFT'), true)
      assert.equal(canSetReportStatus(role, 'SUBMITTED'), true)
      assert.equal(canSetReportStatus(role, 'REVIEWED'), false)
      assert.equal(canSetReportStatus(role, 'APPROVED'), false)
      assert.equal(canSetReportStatus(role, 'REJECTED'), false)
    }
  })

  it('allows administrators to perform review decisions', () => {
    for (const role of ['SUPER_ADMIN', 'ADMIN'] as const) {
      assert.equal(canSetReportStatus(role, 'APPROVED'), true)
      assert.equal(canSetReportStatus(role, 'REJECTED'), true)
    }
  })

  it('rejects unknown status values', () => {
    assert.equal(parseReportStatus('APPROVED'), 'APPROVED')
    assert.equal(parseReportStatus('approved'), null)
    assert.equal(parseReportStatus('INVALID'), null)
  })
})
