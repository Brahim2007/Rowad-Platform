import { ContactRound } from 'lucide-react'
import { ComingSoonPage } from '@/components/admin/ComingSoonPage'

export default function ExpertsPage() {
  return (
    <ComingSoonPage
      title="بيانات الخبراء والشخصيات"
      description="قاعدة بيانات للخبراء والشخصيات المتعاونة مع الشبكة، تشمل مجالات الخبرة وبيانات التواصل وسجل المشاركات."
      icon={ContactRound}
    />
  )
}
