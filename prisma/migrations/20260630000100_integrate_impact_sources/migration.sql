-- CreateEnum
CREATE TYPE "ImpactSourceType" AS ENUM ('MANUAL', 'PARTICIPATION', 'ENROLLMENT', 'REPORT', 'EVALUATION', 'EXTERNAL');

-- AlterTable
ALTER TABLE "impact_logs"
ADD COLUMN "sourceType" "ImpactSourceType" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN "sourceId" VARCHAR(100),
ADD COLUMN "pointsSnapshot" INTEGER,
ADD COLUMN "platformId" TEXT,
ADD COLUMN "programId" TEXT,
ADD COLUMN "activityId" TEXT,
ADD COLUMN "enrollmentId" TEXT,
ADD COLUMN "participationId" TEXT,
ADD COLUMN "reportId" TEXT,
ADD COLUMN "evaluationId" TEXT;

-- CreateIndex
CREATE INDEX "impact_logs_sourceType_idx" ON "impact_logs"("sourceType");
CREATE INDEX "impact_logs_sourceType_sourceId_idx" ON "impact_logs"("sourceType", "sourceId");
CREATE INDEX "impact_logs_platformId_idx" ON "impact_logs"("platformId");
CREATE INDEX "impact_logs_programId_idx" ON "impact_logs"("programId");
CREATE INDEX "impact_logs_activityId_idx" ON "impact_logs"("activityId");
CREATE INDEX "impact_logs_enrollmentId_idx" ON "impact_logs"("enrollmentId");
CREATE INDEX "impact_logs_participationId_idx" ON "impact_logs"("participationId");
CREATE INDEX "impact_logs_reportId_idx" ON "impact_logs"("reportId");
CREATE INDEX "impact_logs_evaluationId_idx" ON "impact_logs"("evaluationId");
CREATE UNIQUE INDEX "impact_logs_sourceType_sourceId_actionId_key" ON "impact_logs"("sourceType", "sourceId", "actionId");

-- AddForeignKey
ALTER TABLE "impact_logs" ADD CONSTRAINT "impact_logs_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "platforms"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "impact_logs" ADD CONSTRAINT "impact_logs_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "impact_logs" ADD CONSTRAINT "impact_logs_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "impact_logs" ADD CONSTRAINT "impact_logs_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "impact_logs" ADD CONSTRAINT "impact_logs_participationId_fkey" FOREIGN KEY ("participationId") REFERENCES "participations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "impact_logs" ADD CONSTRAINT "impact_logs_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "submitted_reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "impact_logs" ADD CONSTRAINT "impact_logs_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "evaluations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
