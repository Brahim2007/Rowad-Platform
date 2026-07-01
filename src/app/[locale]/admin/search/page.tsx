'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, Users, Activity, FileText, Eye } from 'lucide-react'

interface ResultItem {
  id: string; type: 'member' | 'activity' | 'document'
  title?: string; name?: string; code?: string
  networkRole?: string; platformName?: string; docType?: string
  status?: string; date?: string
}

function Badge({ children, className }: { children: React.ReactNode; className: string }) {
  return <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>{children}</span>
}

export default function SearchResultsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const q = searchParams.get('q') || ''
  const [results, setResults] = useState<{ members: ResultItem[]; activities: ResultItem[]; documents: ResultItem[] } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!q || q.length < 2) { setLoading(false); return }
    fetch(`/api/admin/search?q=${encodeURIComponent(q)}`).then(r => r.json()).then(json => {
      if (json.success) setResults(json.data)
    }).finally(() => setLoading(false))
  }, [q])

  const total = results ? results.members.length + results.activities.length + results.documents.length : 0

  const DOC_TYPES: Record<string, string> = {
    REPORT: 'تقرير', BUDGET: 'ميزانية', MEETING_MINUTES: 'محضر', WORK_PLAN: 'خطة',
    ANNOUNCEMENT: 'إعلان', NEWSLETTER: 'نشرة', OTHER: 'أخرى',
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto" dir="rtl">
      <div className="flex items-center gap-3 mb-6">
        <Search size={22} className="text-primary-600" />
        <div>
          <h1 className="text-lg font-bold text-neutral-900">نتائج البحث: {q}</h1>
          <p className="text-sm text-neutral-500">{loading ? 'جاري البحث...' : `${total} نتيجة`}</p>
        </div>
      </div>

      {loading && (
        <div className="text-center py-12"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" /></div>
      )}

      {results && total === 0 && (
        <div className="text-center py-16 text-neutral-400">
          <Search size={48} className="mx-auto mb-4 text-neutral-300" />
          <p className="text-lg font-bold text-neutral-500">لا توجد نتائج</p>
          <p className="text-sm">جرب كلمة بحث مختلفة</p>
        </div>
      )}

      {results && (
        <div className="space-y-6">
          {/* Members */}
          {results.members.length > 0 && (
            <div className="card p-5">
              <h2 className="font-bold text-neutral-900 mb-3 flex items-center gap-2"><Users size={16} className="text-primary-600" /> أعضاء ({results.members.length})</h2>
              <div className="space-y-2">
                {results.members.map(m => (
                  <Link key={m.id} href={`/admin/impact?tab=card`} className="block border rounded-lg p-3 hover:bg-neutral-50 transition-colors no-underline">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-neutral-800 text-sm">{m.name}</span>
                        <span className="text-xs text-neutral-400 font-mono mr-2">{m.code}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {m.networkRole && <Badge className="bg-neutral-100 text-neutral-600">{m.networkRole}</Badge>}
                        {m.platformName && <Badge className="bg-teal-50 text-teal-600">{m.platformName}</Badge>}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Activities */}
          {results.activities.length > 0 && (
            <div className="card p-5">
              <h2 className="font-bold text-neutral-900 mb-3 flex items-center gap-2"><Activity size={16} className="text-teal-600" /> أنشطة ({results.activities.length})</h2>
              <div className="space-y-2">
                {results.activities.map(a => (
                  <Link key={a.id} href={`/admin/impact?tab=activities`} className="block border rounded-lg p-3 hover:bg-neutral-50 transition-colors no-underline">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-neutral-800 text-sm">{a.title}</span>
                        <span className="text-xs text-neutral-400 mr-2">{a.name} ({a.code})</span>
                      </div>
                      <Badge className={a.status === 'APPROVED' ? 'bg-green-50 text-green-700' : a.status === 'REJECTED' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}>
                        {a.status === 'APPROVED' ? 'معتمد' : a.status === 'REJECTED' ? 'مرفوض' : 'قيد المراجعة'}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Documents */}
          {results.documents.length > 0 && (
            <div className="card p-5">
              <h2 className="font-bold text-neutral-900 mb-3 flex items-center gap-2"><FileText size={16} className="text-purple-600" /> وثائق ({results.documents.length})</h2>
              <div className="space-y-2">
                {results.documents.map(d => (
                  <Link key={d.id} href={`/admin/documents`} className="block border rounded-lg p-3 hover:bg-neutral-50 transition-colors no-underline">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-neutral-800 text-sm">{d.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {d.docType && <Badge className="bg-neutral-100 text-neutral-600">{DOC_TYPES[d.docType] || d.docType}</Badge>}
                        {d.platformName && <Badge className="bg-purple-50 text-purple-600">{d.platformName}</Badge>}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
