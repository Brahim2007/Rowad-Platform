'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

import { useEffect, useState, useCallback } from 'react'
import { Pencil, X } from 'lucide-react'
import { toast } from 'sonner'

interface ContentPage {
  id: string
  title: string
  slug: string
  content: string
  metaDesc: string | null
  isPublished: boolean
}

export default function AdminContentPage() {
  const [pages, setPages] = useState<ContentPage[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPage, setEditingPage] = useState<ContentPage | null>(null)
  const [form, setForm] = useState({ title: '', slug: '', content: '', metaDesc: '', isPublished: false })
  const [submitting, setSubmitting] = useState(false)

  const fetchPages = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/content')
      const data = await res.json()
      if (data.success) setPages(data.data)
    } catch { toast.error('فشل تحميل الصفحات') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchPages() }, [fetchPages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/content', {
        method: editingPage ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPage ? { id: editingPage.id, ...form } : form),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(editingPage ? 'تم تحديث الصفحة' : 'تم إنشاء الصفحة')
        setShowModal(false)
        setEditingPage(null)
        setForm({ title: '', slug: '', content: '', metaDesc: '', isPublished: false })
        fetchPages()
      } else { toast.error(data.message || 'حدث خطأ') }
    } catch { toast.error('حدث خطأ في الاتصال') }
    finally { setSubmitting(false) }
  }

  const openEdit = (page: ContentPage) => {
    setEditingPage(page)
    setForm({ title: page.title, slug: page.slug, content: page.content, metaDesc: page.metaDesc || '', isPublished: page.isPublished })
    setShowModal(true)
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">إدارة المحتوى</h1>
          <p className="text-sm text-neutral-500 mt-1">إدارة المحتوى الثابت للمنصة</p>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-neutral-900">تعديل المحتوى: {editingPage?.title}</h2>
              <Button unstyled onClick={() => setShowModal(false)} className="p-1 text-neutral-400 hover:text-neutral-600"><X size={20} /></Button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">العنوان</label>
                <Input className="input-field" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">الرابط المختصر</label>
                <Input className="input-field" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} required dir="ltr" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">المحتوى</label>
                <Textarea className="input-field" rows={10} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">الوصف (SEO)</label>
                <Input className="input-field" value={form.metaDesc} onChange={e => setForm({ ...form, metaDesc: e.target.value })} />
              </div>
              <div className="flex items-center gap-2">
                <Input type="checkbox" id="isPublished" checked={form.isPublished} onChange={e => setForm({ ...form, isPublished: e.target.checked })} />
                <label htmlFor="isPublished" className="text-sm text-neutral-700">منشور</label>
              </div>
              <Button unstyled type="submit" className="btn-primary w-full justify-center" disabled={submitting}>
                {submitting ? 'جارٍ الحفظ...' : 'تحديث'}
              </Button>
            </form>
          </div>
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="w-full text-sm">
            <TableHeader>
              <TableRow className="border-b border-neutral-200 bg-neutral-50">
                <TableHead className="text-right px-4 py-3 font-medium text-neutral-600">الصفحة</TableHead>
                <TableHead className="text-right px-4 py-3 font-medium text-neutral-600">الرابط</TableHead>
                <TableHead className="text-right px-4 py-3 font-medium text-neutral-600">الحالة</TableHead>
                <TableHead className="text-left px-4 py-3 font-medium text-neutral-600">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-neutral-400">جارٍ التحميل...</TableCell></TableRow>
              ) : pages.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-neutral-400">لا توجد صفحات محتوى</TableCell></TableRow>
              ) : (
                pages.map((page) => (
                  <TableRow key={page.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <TableCell className="px-4 py-3 font-medium text-neutral-900">{page.title}</TableCell>
                    <TableCell className="px-4 py-3 text-neutral-500 dir-ltr">/{page.slug}</TableCell>
                    <TableCell className="px-4 py-3">
                      <span className={`badge ${page.isPublished ? 'badge-success' : 'badge-warning'}`}>
                        {page.isPublished ? 'منشور' : 'مسودة'}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Button unstyled onClick={() => openEdit(page)} className="p-1.5 text-neutral-400 hover:text-primary-600 transition-colors" aria-label="تعديل">
                        <Pencil size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
