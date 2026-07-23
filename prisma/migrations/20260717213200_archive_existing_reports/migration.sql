-- Archive every existing platform report in the new institutional archive.
INSERT INTO "documents" (
  "id", "title", "type", "description", "content", "tags", "source", "sourceId",
  "periodYear", "periodMonth", "platformId", "uploadedBy", "status", "createdAt", "updatedAt"
)
SELECT
  'archive_report_' || r."id",
  t."title",
  'REPORT'::"DocumentType",
  COALESCE(t."description", 'تقرير محفوظ تلقائيًا من نظام التقارير'),
  r."data",
  'تقرير منصة,أرشفة تلقائية',
  'SUBMITTED_REPORT',
  r."id",
  EXTRACT(YEAR FROM r."createdAt")::INTEGER,
  EXTRACT(MONTH FROM r."createdAt")::INTEGER,
  r."platformId",
  r."submittedBy",
  CASE WHEN r."status" = 'APPROVED' THEN 'APPROVED'::"DocStatus" ELSE 'DRAFT'::"DocStatus" END,
  r."createdAt",
  r."updatedAt"
FROM "submitted_reports" r
JOIN "report_templates" t ON t."id" = r."templateId"
ON CONFLICT ("source", "sourceId") DO NOTHING;
