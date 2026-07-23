-- Enforce one newly generated smart report per platform and calendar month.
-- Existing reports remain untouched; nullable keys allow legacy and network-wide reports.
ALTER TABLE "ai_generated_reports"
ADD COLUMN "monthlyPlatformKey" VARCHAR(150);

CREATE UNIQUE INDEX "ai_generated_reports_monthlyPlatformKey_key"
ON "ai_generated_reports"("monthlyPlatformKey");

CREATE INDEX "ai_generated_reports_platformId_periodYear_periodMonth_idx"
ON "ai_generated_reports"("platformId", "periodYear", "periodMonth");
