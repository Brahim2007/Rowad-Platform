-- CreateEnum
CREATE TYPE "PartnerType" AS ENUM ('PARTNER', 'SPONSOR', 'SUPPORTER', 'DONOR');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "EducationLevel" AS ENUM ('HIGH_SCHOOL', 'DIPLOMA', 'BACHELOR', 'MASTER', 'DOCTORATE', 'OTHER');

-- CreateEnum
CREATE TYPE "BeneficiaryStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('WORKSHOP', 'BOOTCAMP', 'HACKATHON', 'SEMINAR', 'COMPETITION', 'MENTORING', 'COURSE', 'EVENT', 'OTHER');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'DROPPED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ParticipationStatus" AS ENUM ('REGISTERED', 'ATTENDED', 'COMPLETED', 'ABSENT', 'CANCELLED');

-- CreateEnum
CREATE TYPE "KnowledgeCategory" AS ENUM ('REPORT', 'RESEARCH', 'MANUAL', 'TOOLKIT', 'LESSON', 'BEST_PRACTICE', 'OTHER');

-- CreateEnum
CREATE TYPE "KnowledgeType" AS ENUM ('DOCUMENT', 'VIDEO', 'AUDIO', 'IMAGE', 'PRESENTATION', 'SPREADSHEET', 'LINK', 'OTHER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'REVIEWED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "EvaluationType" AS ENUM ('PROGRAM', 'ACTIVITY', 'PROJECT', 'PLATFORM', 'SELF', 'PEER');

-- CreateEnum
CREATE TYPE "EvaluationStatus" AS ENUM ('DRAFT', 'FINAL', 'APPROVED');

-- CreateEnum
CREATE TYPE "JourneyStage" AS ENUM ('DISCOVERY', 'APPLICATION', 'ONBOARDING', 'ACTIVE', 'ADVANCED', 'GRADUATED', 'ALUMNI', 'CHAMPION');

-- AlterTable
ALTER TABLE "activities" ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "isOnline" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "location" VARCHAR(500),
ADD COLUMN     "maxParticipants" INTEGER,
ADD COLUMN     "startDate" TIMESTAMP(3),
ADD COLUMN     "type" "ActivityType" NOT NULL DEFAULT 'WORKSHOP';

-- AlterTable
ALTER TABLE "programs" ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "maxBeneficiaries" INTEGER,
ADD COLUMN     "startDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "platformId" TEXT,
ADD COLUMN     "programId" TEXT;

-- CreateTable
CREATE TABLE "partners" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "logo" VARCHAR(500),
    "websiteUrl" VARCHAR(500),
    "type" "PartnerType" NOT NULL DEFAULT 'PARTNER',
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beneficiaries" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255),
    "phone" VARCHAR(50),
    "gender" "Gender",
    "birthDate" TIMESTAMP(3),
    "nationality" VARCHAR(100),
    "country" VARCHAR(100),
    "city" VARCHAR(100),
    "educationLevel" "EducationLevel",
    "bio" TEXT,
    "avatar" VARCHAR(500),
    "status" "BeneficiaryStatus" NOT NULL DEFAULT 'ACTIVE',
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "beneficiaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" TEXT NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'PENDING',
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "beneficiaryId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participations" (
    "id" TEXT NOT NULL,
    "status" "ParticipationStatus" NOT NULL DEFAULT 'REGISTERED',
    "attendedAt" TIMESTAMP(3),
    "score" DOUBLE PRECISION,
    "feedback" TEXT,
    "certificateUrl" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "beneficiaryId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "enrollmentId" TEXT,

    CONSTRAINT "participations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news_posts" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "coverImage" VARCHAR(500),
    "category" VARCHAR(100),
    "tags" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "news_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhooks" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "url" VARCHAR(1000) NOT NULL,
    "events" TEXT NOT NULL,
    "secret" VARCHAR(255),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastTriggeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_logs" (
    "id" TEXT NOT NULL,
    "webhookId" TEXT NOT NULL,
    "event" VARCHAR(255) NOT NULL,
    "payload" TEXT,
    "statusCode" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_library" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "content" TEXT,
    "category" "KnowledgeCategory" NOT NULL DEFAULT 'REPORT',
    "type" "KnowledgeType" NOT NULL DEFAULT 'DOCUMENT',
    "fileUrl" VARCHAR(1000),
    "thumbnailUrl" VARCHAR(1000),
    "tags" TEXT,
    "author" VARCHAR(200),
    "language" VARCHAR(10) NOT NULL DEFAULT 'ar',
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "platformId" TEXT,
    "programId" TEXT,
    "projectId" TEXT,

    CONSTRAINT "knowledge_library_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_templates" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(100) NOT NULL,
    "sections" TEXT NOT NULL,
    "icon" VARCHAR(100),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submitted_reports" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedBy" VARCHAR(200),
    "reviewedBy" VARCHAR(200),
    "reviewNotes" TEXT,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "platformId" TEXT,
    "programId" TEXT,
    "projectId" TEXT,

    CONSTRAINT "submitted_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_indicators" (
    "id" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,
    "indicatorKey" VARCHAR(100) NOT NULL,
    "indicatorName" VARCHAR(255) NOT NULL,
    "value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "target" DOUBLE PRECISION,
    "unit" VARCHAR(50),
    "period" VARCHAR(50) NOT NULL DEFAULT 'monthly',
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_indicators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_indicators" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "indicatorKey" VARCHAR(100) NOT NULL,
    "indicatorName" VARCHAR(255) NOT NULL,
    "value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "target" DOUBLE PRECISION,
    "unit" VARCHAR(50),
    "period" VARCHAR(50) NOT NULL DEFAULT 'monthly',
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "program_indicators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_snapshots" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "period" VARCHAR(50) NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "data" TEXT NOT NULL,
    "summary" TEXT,
    "generatedBy" VARCHAR(200),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coordination_tasks" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "assignee" VARCHAR(200),
    "assigneeRole" VARCHAR(200),
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "platformId" TEXT,
    "programId" TEXT,

    CONSTRAINT "coordination_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_standards" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "scope" VARCHAR(100) NOT NULL,
    "requiredFields" TEXT NOT NULL,
    "validationRules" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_standards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluations" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "evaluator" VARCHAR(200) NOT NULL,
    "evaluatorRole" VARCHAR(200),
    "type" "EvaluationType" NOT NULL DEFAULT 'PROGRAM',
    "score" DOUBLE PRECISION,
    "maxScore" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "feedback" TEXT,
    "recommendations" TEXT,
    "status" "EvaluationStatus" NOT NULL DEFAULT 'DRAFT',
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "platformId" TEXT,
    "programId" TEXT,
    "activityId" TEXT,
    "projectId" TEXT,

    CONSTRAINT "evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beneficiary_journey_stages" (
    "id" TEXT NOT NULL,
    "beneficiaryId" TEXT NOT NULL,
    "stage" "JourneyStage" NOT NULL DEFAULT 'DISCOVERY',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "beneficiary_journey_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "entity" VARCHAR(100) NOT NULL,
    "entityId" VARCHAR(100) NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "actor" VARCHAR(200),
    "changes" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "partners_slug_key" ON "partners"("slug");

-- CreateIndex
CREATE INDEX "partners_type_idx" ON "partners"("type");

-- CreateIndex
CREATE INDEX "partners_isActive_idx" ON "partners"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "beneficiaries_code_key" ON "beneficiaries"("code");

-- CreateIndex
CREATE UNIQUE INDEX "beneficiaries_email_key" ON "beneficiaries"("email");

-- CreateIndex
CREATE INDEX "beneficiaries_code_idx" ON "beneficiaries"("code");

-- CreateIndex
CREATE INDEX "beneficiaries_email_idx" ON "beneficiaries"("email");

-- CreateIndex
CREATE INDEX "beneficiaries_status_idx" ON "beneficiaries"("status");

-- CreateIndex
CREATE INDEX "beneficiaries_country_idx" ON "beneficiaries"("country");

-- CreateIndex
CREATE INDEX "enrollments_beneficiaryId_idx" ON "enrollments"("beneficiaryId");

-- CreateIndex
CREATE INDEX "enrollments_programId_idx" ON "enrollments"("programId");

-- CreateIndex
CREATE INDEX "enrollments_status_idx" ON "enrollments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_beneficiaryId_programId_key" ON "enrollments"("beneficiaryId", "programId");

-- CreateIndex
CREATE INDEX "participations_beneficiaryId_idx" ON "participations"("beneficiaryId");

-- CreateIndex
CREATE INDEX "participations_activityId_idx" ON "participations"("activityId");

-- CreateIndex
CREATE INDEX "participations_enrollmentId_idx" ON "participations"("enrollmentId");

-- CreateIndex
CREATE INDEX "participations_status_idx" ON "participations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "participations_beneficiaryId_activityId_key" ON "participations"("beneficiaryId", "activityId");

-- CreateIndex
CREATE UNIQUE INDEX "news_posts_slug_key" ON "news_posts"("slug");

-- CreateIndex
CREATE INDEX "news_posts_slug_idx" ON "news_posts"("slug");

-- CreateIndex
CREATE INDEX "news_posts_isPublished_idx" ON "news_posts"("isPublished");

-- CreateIndex
CREATE INDEX "news_posts_publishedAt_idx" ON "news_posts"("publishedAt");

-- CreateIndex
CREATE INDEX "news_posts_category_idx" ON "news_posts"("category");

-- CreateIndex
CREATE INDEX "webhooks_isActive_idx" ON "webhooks"("isActive");

-- CreateIndex
CREATE INDEX "webhook_logs_webhookId_idx" ON "webhook_logs"("webhookId");

-- CreateIndex
CREATE INDEX "webhook_logs_createdAt_idx" ON "webhook_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_library_slug_key" ON "knowledge_library"("slug");

-- CreateIndex
CREATE INDEX "knowledge_library_slug_idx" ON "knowledge_library"("slug");

-- CreateIndex
CREATE INDEX "knowledge_library_category_idx" ON "knowledge_library"("category");

-- CreateIndex
CREATE INDEX "knowledge_library_type_idx" ON "knowledge_library"("type");

-- CreateIndex
CREATE INDEX "knowledge_library_isPublished_idx" ON "knowledge_library"("isPublished");

-- CreateIndex
CREATE INDEX "knowledge_library_platformId_idx" ON "knowledge_library"("platformId");

-- CreateIndex
CREATE INDEX "knowledge_library_programId_idx" ON "knowledge_library"("programId");

-- CreateIndex
CREATE INDEX "knowledge_library_projectId_idx" ON "knowledge_library"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "report_templates_slug_key" ON "report_templates"("slug");

-- CreateIndex
CREATE INDEX "report_templates_slug_idx" ON "report_templates"("slug");

-- CreateIndex
CREATE INDEX "report_templates_category_idx" ON "report_templates"("category");

-- CreateIndex
CREATE INDEX "report_templates_isActive_idx" ON "report_templates"("isActive");

-- CreateIndex
CREATE INDEX "submitted_reports_templateId_idx" ON "submitted_reports"("templateId");

-- CreateIndex
CREATE INDEX "submitted_reports_status_idx" ON "submitted_reports"("status");

-- CreateIndex
CREATE INDEX "submitted_reports_platformId_idx" ON "submitted_reports"("platformId");

-- CreateIndex
CREATE INDEX "submitted_reports_programId_idx" ON "submitted_reports"("programId");

-- CreateIndex
CREATE INDEX "submitted_reports_projectId_idx" ON "submitted_reports"("projectId");

-- CreateIndex
CREATE INDEX "platform_indicators_platformId_idx" ON "platform_indicators"("platformId");

-- CreateIndex
CREATE INDEX "platform_indicators_indicatorKey_idx" ON "platform_indicators"("indicatorKey");

-- CreateIndex
CREATE UNIQUE INDEX "platform_indicators_platformId_indicatorKey_recordedAt_key" ON "platform_indicators"("platformId", "indicatorKey", "recordedAt");

-- CreateIndex
CREATE INDEX "program_indicators_programId_idx" ON "program_indicators"("programId");

-- CreateIndex
CREATE INDEX "program_indicators_indicatorKey_idx" ON "program_indicators"("indicatorKey");

-- CreateIndex
CREATE UNIQUE INDEX "program_indicators_programId_indicatorKey_recordedAt_key" ON "program_indicators"("programId", "indicatorKey", "recordedAt");

-- CreateIndex
CREATE INDEX "analytics_snapshots_period_idx" ON "analytics_snapshots"("period");

-- CreateIndex
CREATE INDEX "analytics_snapshots_periodStart_idx" ON "analytics_snapshots"("periodStart");

-- CreateIndex
CREATE INDEX "analytics_snapshots_periodEnd_idx" ON "analytics_snapshots"("periodEnd");

-- CreateIndex
CREATE INDEX "coordination_tasks_status_idx" ON "coordination_tasks"("status");

-- CreateIndex
CREATE INDEX "coordination_tasks_priority_idx" ON "coordination_tasks"("priority");

-- CreateIndex
CREATE INDEX "coordination_tasks_assignee_idx" ON "coordination_tasks"("assignee");

-- CreateIndex
CREATE INDEX "coordination_tasks_platformId_idx" ON "coordination_tasks"("platformId");

-- CreateIndex
CREATE INDEX "coordination_tasks_dueDate_idx" ON "coordination_tasks"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "data_standards_slug_key" ON "data_standards"("slug");

-- CreateIndex
CREATE INDEX "data_standards_slug_idx" ON "data_standards"("slug");

-- CreateIndex
CREATE INDEX "data_standards_scope_idx" ON "data_standards"("scope");

-- CreateIndex
CREATE INDEX "data_standards_isActive_idx" ON "data_standards"("isActive");

-- CreateIndex
CREATE INDEX "evaluations_type_idx" ON "evaluations"("type");

-- CreateIndex
CREATE INDEX "evaluations_status_idx" ON "evaluations"("status");

-- CreateIndex
CREATE INDEX "evaluations_platformId_idx" ON "evaluations"("platformId");

-- CreateIndex
CREATE INDEX "evaluations_programId_idx" ON "evaluations"("programId");

-- CreateIndex
CREATE INDEX "beneficiary_journey_stages_beneficiaryId_idx" ON "beneficiary_journey_stages"("beneficiaryId");

-- CreateIndex
CREATE INDEX "beneficiary_journey_stages_stage_idx" ON "beneficiary_journey_stages"("stage");

-- CreateIndex
CREATE INDEX "activity_logs_entity_idx" ON "activity_logs"("entity");

-- CreateIndex
CREATE INDEX "activity_logs_entityId_idx" ON "activity_logs"("entityId");

-- CreateIndex
CREATE INDEX "activity_logs_action_idx" ON "activity_logs"("action");

-- CreateIndex
CREATE INDEX "activity_logs_createdAt_idx" ON "activity_logs"("createdAt");

-- CreateIndex
CREATE INDEX "activities_type_idx" ON "activities"("type");

-- CreateIndex
CREATE INDEX "projects_platformId_idx" ON "projects"("platformId");

-- CreateIndex
CREATE INDEX "projects_programId_idx" ON "projects"("programId");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "platforms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "beneficiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participations" ADD CONSTRAINT "participations_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "beneficiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participations" ADD CONSTRAINT "participations_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participations" ADD CONSTRAINT "participations_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_logs" ADD CONSTRAINT "webhook_logs_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "webhooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_library" ADD CONSTRAINT "knowledge_library_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "platforms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_library" ADD CONSTRAINT "knowledge_library_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_library" ADD CONSTRAINT "knowledge_library_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submitted_reports" ADD CONSTRAINT "submitted_reports_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "report_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submitted_reports" ADD CONSTRAINT "submitted_reports_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "platforms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submitted_reports" ADD CONSTRAINT "submitted_reports_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submitted_reports" ADD CONSTRAINT "submitted_reports_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_indicators" ADD CONSTRAINT "platform_indicators_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "platforms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_indicators" ADD CONSTRAINT "program_indicators_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coordination_tasks" ADD CONSTRAINT "coordination_tasks_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "platforms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coordination_tasks" ADD CONSTRAINT "coordination_tasks_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "platforms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficiary_journey_stages" ADD CONSTRAINT "beneficiary_journey_stages_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "beneficiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
