-- Preserve all existing knowledge-library records in the unified archive.
-- This runs separately because PostgreSQL must commit new enum values before using them.
INSERT INTO "documents" (
  "id", "title", "type", "description", "content", "tags", "source", "sourceId",
  "fileUrl", "platformId", "uploadedBy", "status", "createdAt", "updatedAt"
)
SELECT
  'archive_' || k."id",
  k."title",
  CASE k."category"
    WHEN 'REPORT' THEN 'REPORT'::"DocumentType"
    WHEN 'RESEARCH' THEN 'RESEARCH'::"DocumentType"
    WHEN 'MANUAL' THEN 'MANUAL'::"DocumentType"
    WHEN 'TOOLKIT' THEN 'TOOLKIT'::"DocumentType"
    WHEN 'LESSON' THEN 'LESSON_LEARNED'::"DocumentType"
    WHEN 'BEST_PRACTICE' THEN 'BEST_PRACTICE'::"DocumentType"
    ELSE
      CASE k."type"
        WHEN 'PRESENTATION' THEN 'PRESENTATION'::"DocumentType"
        WHEN 'VIDEO' THEN 'MEDIA'::"DocumentType"
        WHEN 'AUDIO' THEN 'MEDIA'::"DocumentType"
        WHEN 'IMAGE' THEN 'MEDIA'::"DocumentType"
        ELSE 'OTHER'::"DocumentType"
      END
  END,
  k."description",
  k."content",
  k."tags",
  'KNOWLEDGE_LIBRARY',
  k."id",
  k."fileUrl",
  k."platformId",
  k."author",
  CASE WHEN k."isPublished" THEN 'APPROVED'::"DocStatus" ELSE 'DRAFT'::"DocStatus" END,
  k."createdAt",
  k."updatedAt"
FROM "knowledge_library" k
ON CONFLICT ("source", "sourceId") DO NOTHING;

INSERT INTO "document_versions" (
  "id", "documentId", "version", "fileUrl", "editedBy", "editedAt", "changeNote"
)
SELECT
  'archive_version_' || k."id",
  'archive_' || k."id",
  1,
  k."fileUrl",
  k."author",
  k."createdAt",
  'تم ترحيله من المكتبة المعرفية'
FROM "knowledge_library" k
WHERE k."fileUrl" IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM "documents" d
    WHERE d."source" = 'KNOWLEDGE_LIBRARY' AND d."sourceId" = k."id"
  )
ON CONFLICT ("id") DO NOTHING;
