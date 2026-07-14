export type AdministrativeRole = 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'PLATFORM_MANAGER'
export type ReportStatusValue = 'DRAFT' | 'SUBMITTED' | 'REVIEWED' | 'APPROVED' | 'REJECTED'

const REPORT_STATUSES = new Set<ReportStatusValue>(['DRAFT', 'SUBMITTED', 'REVIEWED', 'APPROVED', 'REJECTED'])
const REVIEW_STATUSES = new Set<ReportStatusValue>(['REVIEWED', 'APPROVED', 'REJECTED'])

export function parseReportStatus(value: unknown): ReportStatusValue | null {
  return typeof value === 'string' && REPORT_STATUSES.has(value as ReportStatusValue)
    ? value as ReportStatusValue
    : null
}

export function canReviewReports(role: AdministrativeRole): boolean {
  return role === 'SUPER_ADMIN' || role === 'ADMIN'
}

export function canSetReportStatus(role: AdministrativeRole, status: ReportStatusValue): boolean {
  return !REVIEW_STATUSES.has(status) || canReviewReports(role)
}
