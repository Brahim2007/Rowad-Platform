export type EvaluationActorRole = 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'PLATFORM_MANAGER' | 'EVALUATOR'
export type EvaluationWorkflowStatus = 'DRAFT' | 'FINAL' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'

const MANAGEMENT_ROLES = new Set<EvaluationActorRole>(['SUPER_ADMIN', 'ADMIN'])
const EDITABLE_STATUSES = new Set<EvaluationWorkflowStatus>(['DRAFT', 'REJECTED'])
const REVIEWABLE_STATUSES = new Set<EvaluationWorkflowStatus>(['FINAL', 'SUBMITTED'])

export function canCreateEvaluation(role: EvaluationActorRole) {
  return MANAGEMENT_ROLES.has(role) || role === 'PLATFORM_MANAGER'
}

export function canEditEvaluationForActor(input: {
  role: EvaluationActorRole
  userId: string
  platformId: string | null
  evaluation: {
    status: EvaluationWorkflowStatus
    evaluatorUserId: string | null
    createdById: string | null
    platformId: string | null
  }
}) {
  if (!EDITABLE_STATUSES.has(input.evaluation.status)) return false
  if (MANAGEMENT_ROLES.has(input.role)) return true
  if (input.role === 'EVALUATOR') return input.evaluation.evaluatorUserId === input.userId
  if (input.role === 'PLATFORM_MANAGER') {
    return input.evaluation.platformId === input.platformId && input.evaluation.createdById === input.userId
  }
  return false
}

export function canReviewEvaluation(input: {
  role: EvaluationActorRole
  userId: string
  status: EvaluationWorkflowStatus
  createdById: string | null
  evaluatorUserId: string | null
}) {
  return MANAGEMENT_ROLES.has(input.role)
    && REVIEWABLE_STATUSES.has(input.status)
    && input.createdById !== input.userId
    && input.evaluatorUserId !== input.userId
}

export function canDeleteEvaluation(role: EvaluationActorRole, status: EvaluationWorkflowStatus) {
  return MANAGEMENT_ROLES.has(role) && EDITABLE_STATUSES.has(status)
}
