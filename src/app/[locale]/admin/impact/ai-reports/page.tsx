'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Archive, ArrowLeft, CalendarDays, FileText, Loader2, Search, Sparkles } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import { Button } from '@/components/ui/button'

const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']

interface ArchivedReport {
  id: string
  title: string
  periodType: string
  periodYear: number
  periodMonth: number | null
  platformId: string | null
  networkRole: string | null
  createdAt: string
}

export default function SmartReportsArchivePage() {
  const params = useParams<{ locale: string }>()
  const locale = params.locale || 'ar'
  const [reports, setReports] = useState<ArchivedReport[]>([])
  const [search, setSearch] = useState('')
  const [year, setYear] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setLoading(true)
      try {
        const query = new URLSearchParams({ page: String(page), pageSize: '12' })
        if (search.trim()) query.set('search', search.trim())
        if (year) query.set('year', year)
        const response = await fetch(`/api/admin/ai/impact-report?${query}`, { cache: 'no-store', signal: controller.signal })
        const result = await response.json()
        if (result.success) {
          setReports(result.data)
          setPagination({ total: result.pagination.total, totalPages: Math.max(1, result.pagination.totalPages) })
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 250)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [page, search, year])

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto" dir="rtl">
      <div className="rounded-3xl bg-gradient-to-l from-primary-800 via-primary-700 to-secondary-700 text-white p-6 md:p-8 mb-6 shadow-lg overflow-hidden relative">
        <div className="absolute -left-16 -top-20 w-64 h-64 rounded-full bg-white/10" />
        <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-5">
          <div>
            <Badge className="bg-white/15 text-white border-white/20 mb-4"><Archive size={13} /> الأرشيف الذكي</Badge>
            <h1 className="text-2xl md:text-3xl font-black">أرشيف تقارير أثر الرواد</h1>
            <p className="text-primary-100 mt-2 max-w-2xl leading-7">كل تقرير ذكي يتم توليده يُحفظ هنا كوثيقة مستقلة يمكن فتحها وطباعتها وتصديرها لاحقًا.</p>
          </div>
          <Link href={`/${locale}/admin/impact?tab=reports`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white text-primary-800 px-4 py-2.5 font-bold text-sm no-underline hover:bg-primary-50">
            <Sparkles size={16} /> إنشاء تقرير جديد
          </Link>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-5 sm:pt-6 grid md:grid-cols-[1fr_180px_auto] gap-3 items-center">
          <label className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" size={17} />
            <Input value={search} onChange={event => { setSearch(event.target.value); setPage(1) }} placeholder="ابحث بعنوان التقرير..." className="pr-10" />
          </label>
          <NativeSelect value={year} onChange={event => { setYear(event.target.value); setPage(1) }}>
            <option value="">كل السنوات</option>
            {Array.from({ length: 8 }, (_, index) => new Date().getFullYear() - index).map(value => <option key={value} value={value}>{value}</option>)}
          </NativeSelect>
          <div className="text-sm text-neutral-500 text-center md:text-left">{pagination.total.toLocaleString('ar-SA')} تقرير</div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-primary-600" size={34} /><p className="text-sm text-neutral-500 mt-3">جاري تحميل الأرشيف...</p></div>
      ) : reports.length ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {reports.map(report => (
            <Card key={report.id} className="group hover:-translate-y-1 hover:shadow-lg transition-all overflow-hidden">
              <div className="h-1.5 bg-gradient-to-l from-primary-500 to-secondary-500" />
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="w-11 h-11 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center shrink-0"><FileText size={20} /></div>
                  <Badge variant="outline">{report.periodType === 'monthly' && report.periodMonth ? MONTHS[report.periodMonth - 1] : 'سنوي'} {report.periodYear}</Badge>
                </div>
                <CardTitle className="leading-7 line-clamp-2 mt-3">{report.title}</CardTitle>
                <CardDescription className="flex items-center gap-2"><CalendarDays size={14} /> أُنشئ {new Date(report.createdAt).toLocaleString('ar-SA')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {report.networkRole && <Badge variant="neutral">{report.networkRole}</Badge>}
                  <Badge variant="success">محفوظ</Badge>
                </div>
                <Link href={`/${locale}/admin/impact/ai-reports/${report.id}`} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-900 text-white py-2.5 text-sm font-bold no-underline group-hover:bg-primary-700 transition-colors">
                  فتح التقرير <ArrowLeft size={15} />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-16"><Archive className="mx-auto text-neutral-300" size={44} /><h2 className="font-bold text-lg mt-4">لا توجد تقارير مطابقة</h2><p className="text-sm text-neutral-500 mt-2">أنشئ تقريرًا جديدًا أو غيّر معايير البحث.</p></Card>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-7">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage(value => value - 1)}>السابق</Button>
          <span className="text-sm text-neutral-600">صفحة {page} من {pagination.totalPages}</span>
          <Button variant="outline" disabled={page >= pagination.totalPages} onClick={() => setPage(value => value + 1)}>التالي</Button>
        </div>
      )}
    </div>
  )
}
