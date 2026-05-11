-- CreateEnum
CREATE TYPE "MemberType" AS ENUM ('BENEFICIARY', 'TEAM', 'BOTH');

-- AlterTable
ALTER TABLE "beneficiaries"
ADD COLUMN     "type" "MemberType" NOT NULL DEFAULT 'BENEFICIARY',
ADD COLUMN     "role" VARCHAR(200),
ADD COLUMN     "slug" VARCHAR(255),
ADD COLUMN     "linkedinUrl" VARCHAR(500),
ADD COLUMN     "memberSince" TIMESTAMP(3),
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "interests" TEXT;

-- Migrate legacy team records into the unified member table.
INSERT INTO "beneficiaries" (
  "id",
  "code",
  "firstName",
  "lastName",
  "email",
  "bio",
  "avatar",
  "status",
  "registeredAt",
  "createdAt",
  "updatedAt",
  "type",
  "role",
  "slug",
  "linkedinUrl",
  "memberSince",
  "sortOrder"
)
SELECT
  "id",
  CONCAT('TM-', "slug"),
  CASE
    WHEN TRIM("name") LIKE '% %' THEN SPLIT_PART(TRIM("name"), ' ', 1)
    ELSE TRIM("name")
  END,
  CASE
    WHEN TRIM("name") LIKE '% %' THEN SUBSTRING(TRIM("name") FROM POSITION(' ' IN TRIM("name")) + 1)
    ELSE ''
  END,
  "email",
  "bio",
  "avatar",
  CASE WHEN "isActive" THEN 'ACTIVE'::"BeneficiaryStatus" ELSE 'INACTIVE'::"BeneficiaryStatus" END,
  "memberSince",
  "createdAt",
  "updatedAt",
  'TEAM'::"MemberType",
  "role",
  "slug",
  "linkedinUrl",
  "memberSince",
  "sortOrder"
FROM "team_members"
ON CONFLICT DO NOTHING;

-- Indexes
CREATE UNIQUE INDEX "beneficiaries_slug_key" ON "beneficiaries"("slug");
CREATE INDEX "beneficiaries_type_idx" ON "beneficiaries"("type");

-- Remove the legacy split table after data has been copied.
DROP TABLE "team_members";
