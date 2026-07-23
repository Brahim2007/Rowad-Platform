-- Archive every existing AI impact report in the institutional archive.
INSERT INTO "documents" (
  "id", "title", "type", "description", "content", "tags", "source", "sourceId",
  "periodYear", "periodMonth", "platformId", "uploadedById", "status", "createdAt", "updatedAt"
)
SELECT
  'archive_ai_report_' || r."id",
  r."title",
  'REPORT'::"DocumentType",
  'تقرير أثر ذكي محفوظ تلقائيًا',
  r."reportJson",
  'تقرير ذكي,أثر الرواد,أرشفة تلقائية',
  'AI_GENERATED_REPORT',
  r."id",
  r."periodYear",
  r."periodMonth",
  CASE WHEN EXISTS (SELECT 1 FROM "platforms" p WHERE p."id" = r."platformId") THEN r."platformId" ELSE NULL END,
  r."generatedBy",
  'APPROVED'::"DocStatus",
  r."createdAt",
  r."createdAt"
FROM "ai_generated_reports" r
ON CONFLICT ("source", "sourceId") DO NOTHING;
