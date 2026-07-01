/**
 * تصدير CSV/Excel — بدون مكتبات خارجية
 */

/** تحويل أي مصفوفة كائنات إلى CSV ويُحمّله */
export function downloadCSV(rows: Record<string, unknown>[], filename: string, columns?: string[]) {
  if (rows.length === 0) return

  const cols = columns || Object.keys(rows[0])
  const BOM = '﻿' // BOM للتميز العربي في Excel

  let csv = BOM + cols.join(',') + '\n'

  for (const row of rows) {
    csv += cols.map(c => {
      const val = row[c] != null ? String(row[c]) : ''
      // Escape commas and quotes
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`
      }
      return val
    }).join(',') + '\n'
  }

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** تصدير قائمة أعضاء مع نقاطهم */
export function exportMembersCSV(
  members: Array<{ name: string; code: string; networkRole: string | null; platformName: string | null; points: number; status: string }>,
  filename?: string
) {
  downloadCSV(members, filename || `اعضاء-شبكة-رواد-${new Date().toISOString().slice(0, 10)}.csv`, [
    'code', 'name', 'networkRole', 'platformName', 'points', 'status',
  ])
}

/** تصدير سجل الأنشطة */
export function exportActivitiesCSV(
  activities: Array<{ beneficiaryName: string; beneficiaryCode: string; actionName: string; category: string; count: number; quality: string; status: string; date: string; note: string | null }>,
  filename?: string
) {
  downloadCSV(activities, filename || `انشطة-شبكة-رواد-${new Date().toISOString().slice(0, 10)}.csv`, [
    'date', 'beneficiaryName', 'beneficiaryCode', 'actionName', 'category', 'count', 'quality', 'status', 'note',
  ])
}
