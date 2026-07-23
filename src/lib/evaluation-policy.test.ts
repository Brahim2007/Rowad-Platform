import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  canCreateEvaluation,
  canDeleteEvaluation,
  canEditEvaluationForActor,
  canReviewEvaluation,
} from './evaluation-policy'

describe('evaluation workflow permissions', () => {
  it('allows management and platform managers to create, but not editors or evaluators', () => {
    assert.equal(canCreateEvaluation('SUPER_ADMIN'), true)
    assert.equal(canCreateEvaluation('ADMIN'), true)
    assert.equal(canCreateEvaluation('PLATFORM_MANAGER'), true)
    assert.equal(canCreateEvaluation('EDITOR'), false)
    assert.equal(canCreateEvaluation('EVALUATOR'), false)
  })

  it('limits evaluators to assigned editable evaluations', () => {
    assert.equal(canEditEvaluationForActor({
      role: 'EVALUATOR',
      userId: 'evaluator-1',
      platformId: null,
      evaluation: { status: 'DRAFT', evaluatorUserId: 'evaluator-1', createdById: 'admin-1', platformId: 'p1' },
    }), true)
    assert.equal(canEditEvaluationForActor({
      role: 'EVALUATOR',
      userId: 'evaluator-2',
      platformId: null,
      evaluation: { status: 'DRAFT', evaluatorUserId: 'evaluator-1', createdById: 'admin-1', platformId: 'p1' },
    }), false)
  })

  it('limits platform managers to their own self-evaluations', () => {
    assert.equal(canEditEvaluationForActor({
      role: 'PLATFORM_MANAGER',
      userId: 'manager-1',
      platformId: 'p1',
      evaluation: { status: 'REJECTED', evaluatorUserId: 'manager-1', createdById: 'manager-1', platformId: 'p1' },
    }), true)
    assert.equal(canEditEvaluationForActor({
      role: 'PLATFORM_MANAGER',
      userId: 'manager-1',
      platformId: 'p1',
      evaluation: { status: 'DRAFT', evaluatorUserId: 'manager-1', createdById: 'manager-1', platformId: 'p2' },
    }), false)
  })

  it('prevents creators and evaluators from approving their own work', () => {
    assert.equal(canReviewEvaluation({
      role: 'ADMIN', userId: 'admin-1', status: 'SUBMITTED', createdById: 'admin-1', evaluatorUserId: 'evaluator-1',
    }), false)
    assert.equal(canReviewEvaluation({
      role: 'ADMIN', userId: 'admin-1', status: 'SUBMITTED', createdById: 'admin-2', evaluatorUserId: 'admin-1',
    }), false)
    assert.equal(canReviewEvaluation({
      role: 'ADMIN', userId: 'admin-1', status: 'SUBMITTED', createdById: 'admin-2', evaluatorUserId: 'evaluator-1',
    }), true)
  })

  it('prevents deletion after submission', () => {
    assert.equal(canDeleteEvaluation('ADMIN', 'DRAFT'), true)
    assert.equal(canDeleteEvaluation('SUPER_ADMIN', 'REJECTED'), true)
    assert.equal(canDeleteEvaluation('ADMIN', 'SUBMITTED'), false)
    assert.equal(canDeleteEvaluation('ADMIN', 'APPROVED'), false)
  })
})
