-- Query indexes for the admin impact dashboard, logs, and members screens.
-- These indexes target pagination order, status/date filters, and dashboard joins.

-- Members: /api/admin/members pagination and dashboard active beneficiary scan.
CREATE INDEX IF NOT EXISTS "beneficiaries_type_sortOrder_registeredAt_idx"
  ON "beneficiaries"("type", "sortOrder", "registeredAt");

CREATE INDEX IF NOT EXISTS "beneficiaries_status_type_sortOrder_registeredAt_idx"
  ON "beneficiaries"("status", "type", "sortOrder", "registeredAt");

CREATE INDEX IF NOT EXISTS "beneficiaries_platformId_status_type_idx"
  ON "beneficiaries"("platformId", "status", "type");

-- Enrollments/participations: dashboard operational entries by beneficiary + status.
CREATE INDEX IF NOT EXISTS "enrollments_beneficiaryId_status_idx"
  ON "enrollments"("beneficiaryId", "status");

CREATE INDEX IF NOT EXISTS "enrollments_status_completedAt_idx"
  ON "enrollments"("status", "completedAt");

CREATE INDEX IF NOT EXISTS "participations_beneficiaryId_status_idx"
  ON "participations"("beneficiaryId", "status");

CREATE INDEX IF NOT EXISTS "participations_status_attendedAt_idx"
  ON "participations"("status", "attendedAt");

-- Impact actions: active catalog ordering by dashboard/settings APIs.
CREATE INDEX IF NOT EXISTS "impact_actions_isActive_sortOrder_idx"
  ON "impact_actions"("isActive", "sortOrder");

CREATE INDEX IF NOT EXISTS "impact_actions_isActive_category_sortOrder_idx"
  ON "impact_actions"("isActive", "category", "sortOrder");

-- Impact logs: activity log filters, pagination by date, and dashboard aggregation joins.
CREATE INDEX IF NOT EXISTS "impact_logs_status_date_idx"
  ON "impact_logs"("status", "date");

CREATE INDEX IF NOT EXISTS "impact_logs_actionId_date_idx"
  ON "impact_logs"("actionId", "date");

CREATE INDEX IF NOT EXISTS "impact_logs_beneficiaryId_actionId_date_idx"
  ON "impact_logs"("beneficiaryId", "actionId", "date");

CREATE INDEX IF NOT EXISTS "impact_logs_beneficiaryId_sourceType_sourceId_idx"
  ON "impact_logs"("beneficiaryId", "sourceType", "sourceId");

-- Awards: dashboard shield count and reward history joins.
CREATE INDEX IF NOT EXISTS "impact_awards_type_date_idx"
  ON "impact_awards"("type", "date");

CREATE INDEX IF NOT EXISTS "impact_awards_beneficiaryId_date_idx"
  ON "impact_awards"("beneficiaryId", "date");
