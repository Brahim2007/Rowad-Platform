CREATE TABLE "ai_governance_recommendations" (
    "id" TEXT NOT NULL,
    "fingerprint" VARCHAR(100) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "severity" VARCHAR(20) NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "summary" TEXT NOT NULL,
    "evidence" TEXT NOT NULL,
    "proposedAction" TEXT NOT NULL,
    "platformId" VARCHAR(100),
    "subjectType" VARCHAR(50),
    "subjectId" VARCHAR(100),
    "subjectName" VARCHAR(300),
    "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    "aiEnhanced" BOOLEAN NOT NULL DEFAULT false,
    "generatedBy" VARCHAR(200) NOT NULL,
    "reviewedBy" VARCHAR(200),
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_governance_recommendations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ai_governance_recommendations_fingerprint_key"
ON "ai_governance_recommendations"("fingerprint");

CREATE INDEX "ai_governance_recommendations_status_createdAt_idx"
ON "ai_governance_recommendations"("status", "createdAt");

CREATE INDEX "ai_governance_recommendations_category_status_idx"
ON "ai_governance_recommendations"("category", "status");

CREATE INDEX "ai_governance_recommendations_platformId_status_idx"
ON "ai_governance_recommendations"("platformId", "status");

CREATE INDEX "ai_governance_recommendations_subjectType_subjectId_idx"
ON "ai_governance_recommendations"("subjectType", "subjectId");
