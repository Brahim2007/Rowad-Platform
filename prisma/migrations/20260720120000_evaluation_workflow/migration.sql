ALTER TYPE "AdminRole" ADD VALUE IF NOT EXISTS 'EVALUATOR';
ALTER TYPE "EvaluationStatus" ADD VALUE IF NOT EXISTS 'SUBMITTED';
ALTER TYPE "EvaluationStatus" ADD VALUE IF NOT EXISTS 'REJECTED';

ALTER TABLE "evaluations"
  ADD COLUMN "submittedAt" TIMESTAMP(3),
  ADD COLUMN "approvedAt" TIMESTAMP(3),
  ADD COLUMN "rejectionReason" TEXT,
  ADD COLUMN "createdById" TEXT,
  ADD COLUMN "evaluatorUserId" TEXT,
  ADD COLUMN "approvedById" TEXT;

CREATE INDEX "evaluations_createdById_idx" ON "evaluations"("createdById");
CREATE INDEX "evaluations_evaluatorUserId_idx" ON "evaluations"("evaluatorUserId");
CREATE INDEX "evaluations_approvedById_idx" ON "evaluations"("approvedById");

ALTER TABLE "evaluations"
  ADD CONSTRAINT "evaluations_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "admin_users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "evaluations"
  ADD CONSTRAINT "evaluations_evaluatorUserId_fkey"
  FOREIGN KEY ("evaluatorUserId") REFERENCES "admin_users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "evaluations"
  ADD CONSTRAINT "evaluations_approvedById_fkey"
  FOREIGN KEY ("approvedById") REFERENCES "admin_users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

UPDATE "evaluations"
SET "evaluatorUserId" = (
  SELECT "id"
  FROM "admin_users"
  WHERE lower("email") = lower("evaluations"."evaluator")
     OR lower("fullName") = lower("evaluations"."evaluator")
  LIMIT 1
)
WHERE "evaluatorUserId" IS NULL
  AND EXISTS (
    SELECT 1
    FROM "admin_users"
    WHERE lower("email") = lower("evaluations"."evaluator")
       OR lower("fullName") = lower("evaluations"."evaluator")
  );
