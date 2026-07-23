import { redirect } from 'next/navigation'

/**
 * تم دمج المكتبة المعرفية في الأرشيف المؤسسي.
 * نحافظ على المسار القديم حتى لا تنكسر الروابط أو العلامات المحفوظة.
 */
export default async function KnowledgeLibraryRedirect({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  redirect(`/${locale}/admin/documents?tab=knowledge`)
}
