import { redirect } from 'next/navigation'

export default async function AdminTeamRedirect({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  redirect(`/${locale}/admin/members?type=team`)
}
