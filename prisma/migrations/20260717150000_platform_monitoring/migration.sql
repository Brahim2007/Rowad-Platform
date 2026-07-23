-- سجل تاريخي لتعيين مدراء المنصات
CREATE TYPE "PlatformManagerAssignmentRole" AS ENUM ('PRIMARY', 'DEPUTY');

CREATE TABLE "platform_manager_assignments" (
  "id" TEXT NOT NULL,
  "platformId" TEXT NOT NULL,
  "adminUserId" TEXT NOT NULL,
  "assignmentRole" "PlatformManagerAssignmentRole" NOT NULL DEFAULT 'PRIMARY',
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endedAt" TIMESTAMP(3),
  "assignedBy" VARCHAR(200),
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "platform_manager_assignments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "platform_manager_assignments_platformId_fkey"
    FOREIGN KEY ("platformId") REFERENCES "platforms"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "platform_manager_assignments_adminUserId_fkey"
    FOREIGN KEY ("adminUserId") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "platform_manager_assignments_platformId_endedAt_idx"
  ON "platform_manager_assignments"("platformId", "endedAt");
CREATE INDEX "platform_manager_assignments_adminUserId_endedAt_idx"
  ON "platform_manager_assignments"("adminUserId", "endedAt");
CREATE INDEX "platform_manager_assignments_assignmentRole_idx"
  ON "platform_manager_assignments"("assignmentRole");

-- مدير أساسي نشط واحد لكل منصة.
CREATE UNIQUE INDEX "platform_manager_assignments_one_active_primary"
  ON "platform_manager_assignments"("platformId")
  WHERE "endedAt" IS NULL AND "assignmentRole" = 'PRIMARY';

-- الاحتفاظ بالتعيين الحالي الموجود قبل إضافة سجل التاريخ.
INSERT INTO "platform_manager_assignments"
  ("id", "platformId", "adminUserId", "assignmentRole", "startedAt", "createdAt", "updatedAt")
SELECT
  'pma_' || md5(u."id" || ':' || u."platformId"),
  u."platformId",
  u."id",
  'PRIMARY'::"PlatformManagerAssignmentRole",
  u."createdAt",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "admin_users" u
WHERE u."role" = 'PLATFORM_MANAGER'
  AND u."isActive" = true
  AND u."platformId" IS NOT NULL
ON CONFLICT DO NOTHING;

-- إصلاح السجلات القديمة التي لا تحمل منصة، مع إبقاء السجل التاريخي المختلف كما هو.
UPDATE "impact_logs" l
SET "platformId" = b."platformId"
FROM "beneficiaries" b
WHERE l."beneficiaryId" = b."id"
  AND l."platformId" IS NULL
  AND b."platformId" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "impact_logs_platformId_beneficiaryId_date_idx"
  ON "impact_logs"("platformId", "beneficiaryId", "date");
