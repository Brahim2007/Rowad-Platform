import { prisma } from '@/lib/prisma'

interface ArchiveSubmittedReportInput {
  id: string
  templateId: string
  data: string
  status: string
  platformId: string | null
  createdAt: Date
}

/**
 * يحفظ التقرير التشغيلي تلقائيًا في الأرشيف المؤسسي.
 * المفتاح المركب يمنع إنشاء نسخة مكررة عند كل تحديث للتقرير.
 */
export async function archiveSubmittedReport(
  report: ArchiveSubmittedReportInput,
  actor: { id?: string | null; name?: string | null; email?: string | null },
) {
  const template = await prisma.reportTemplate.findUnique({
    where: { id: report.templateId },
    select: { title: true, description: true },
  })
  const actorName = actor.name || actor.email || 'النظام'

  await prisma.document.upsert({
    where: {
      source_sourceId: {
        source: 'SUBMITTED_REPORT',
        sourceId: report.id,
      },
    },
    create: {
      title: template?.title || 'تقرير منصة',
      type: 'REPORT',
      description: template?.description || 'تقرير محفوظ تلقائيًا من نظام التقارير',
      content: report.data,
      tags: 'تقرير منصة,أرشفة تلقائية',
      source: 'SUBMITTED_REPORT',
      sourceId: report.id,
      periodYear: report.createdAt.getFullYear(),
      periodMonth: report.createdAt.getMonth() + 1,
      platformId: report.platformId,
      uploadedBy: actorName,
      uploadedById: actor.id || null,
      status: report.status === 'APPROVED' ? 'APPROVED' : 'DRAFT',
    },
    update: {
      title: template?.title || 'تقرير منصة',
      description: template?.description || 'تقرير محفوظ تلقائيًا من نظام التقارير',
      content: report.data,
      platformId: report.platformId,
      status: report.status === 'APPROVED' ? 'APPROVED' : 'DRAFT',
      lastEditedBy: actorName,
      lastEditedAt: new Date(),
    },
  })
}

interface ArchiveAiReportInput {
  id: string
  title: string
  reportJson: string
  periodYear: number
  periodMonth: number | null
  platformId: string | null
}

/** يحفظ التقرير الذكي فور توليده ليظهر في الأرشيف المؤسسي. */
export async function archiveAiReport(
  report: ArchiveAiReportInput,
  actor: { id?: string | null; name?: string | null; email?: string | null },
) {
  const actorName = actor.name || actor.email || 'النظام'
  await prisma.document.upsert({
    where: {
      source_sourceId: {
        source: 'AI_GENERATED_REPORT',
        sourceId: report.id,
      },
    },
    create: {
      title: report.title,
      type: 'REPORT',
      description: 'تقرير أثر ذكي محفوظ تلقائيًا',
      content: report.reportJson,
      tags: 'تقرير ذكي,أثر الرواد,أرشفة تلقائية',
      source: 'AI_GENERATED_REPORT',
      sourceId: report.id,
      periodYear: report.periodYear,
      periodMonth: report.periodMonth,
      platformId: report.platformId,
      uploadedBy: actorName,
      uploadedById: actor.id || null,
      status: 'APPROVED',
    },
    update: {
      title: report.title,
      content: report.reportJson,
      platformId: report.platformId,
      lastEditedBy: actorName,
      lastEditedAt: new Date(),
    },
  })
}
