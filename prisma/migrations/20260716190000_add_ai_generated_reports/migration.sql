CREATE TABLE "ai_generated_reports" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "periodType" VARCHAR(20) NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "periodMonth" INTEGER,
    "platformId" VARCHAR(100),
    "networkRole" VARCHAR(200),
    "reportJson" TEXT NOT NULL,
    "metricsJson" TEXT NOT NULL,
    "generatedBy" VARCHAR(200) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_generated_reports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_generated_reports_createdAt_idx" ON "ai_generated_reports"("createdAt");
CREATE INDEX "ai_generated_reports_generatedBy_createdAt_idx" ON "ai_generated_reports"("generatedBy", "createdAt");
CREATE INDEX "ai_generated_reports_periodYear_periodMonth_idx" ON "ai_generated_reports"("periodYear", "periodMonth");
