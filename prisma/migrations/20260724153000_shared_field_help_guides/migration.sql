-- Store one reusable Gemini-generated guide for every registered platform field.
CREATE TABLE "field_help_guides" (
    "id" TEXT NOT NULL,
    "service" VARCHAR(100) NOT NULL,
    "fieldKey" VARCHAR(160) NOT NULL,
    "label" VARCHAR(200) NOT NULL,
    "explanation" TEXT NOT NULL,
    "example" TEXT NOT NULL,
    "tipsJson" TEXT NOT NULL,
    "source" VARCHAR(30) NOT NULL DEFAULT 'GEMINI',
    "generatedBy" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "field_help_guides_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "field_help_guides_fieldKey_key"
ON "field_help_guides"("fieldKey");

CREATE INDEX "field_help_guides_service_idx"
ON "field_help_guides"("service");

CREATE INDEX "field_help_guides_service_updatedAt_idx"
ON "field_help_guides"("service", "updatedAt");
