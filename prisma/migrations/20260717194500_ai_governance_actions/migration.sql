ALTER TABLE "ai_governance_recommendations"
ADD COLUMN "actionType" VARCHAR(30),
ADD COLUMN "actionTargetId" VARCHAR(100),
ADD COLUMN "actionTargetName" VARCHAR(300),
ADD COLUMN "actionedBy" VARCHAR(200),
ADD COLUMN "actionedAt" TIMESTAMP(3),
ADD COLUMN "actionMetadata" TEXT;

CREATE INDEX "ai_governance_recommendations_actionType_actionedAt_idx"
ON "ai_governance_recommendations"("actionType", "actionedAt");
