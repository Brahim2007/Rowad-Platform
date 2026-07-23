const printStyles = `
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: #f5f5f5;
    color: #171717;
    font-family: "IBM Plex Sans Arabic", system-ui, sans-serif;
    direction: rtl;
  }
  .report-paper {
    width: 210mm;
    min-height: 297mm;
    margin: 0 auto;
    padding: 18mm;
    background: #fff;
  }
  .report-header {
    border-bottom: 1px solid #e5e5e5;
    padding-bottom: 20px;
    margin-bottom: 20px;
  }
  .report-brand {
    color: #2563eb;
    font-weight: 700;
    font-size: 13px;
    margin: 0 0 8px;
  }
  .report-title {
    font-size: 26px;
    line-height: 1.4;
    margin: 0;
  }
  .report-description {
    color: #737373;
    font-size: 13px;
    line-height: 1.8;
    margin-top: 8px;
  }
  .report-status,
  .report-category {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border-radius: 999px;
    padding: 6px 10px;
    font-size: 12px;
    font-weight: 700;
    margin-left: 6px;
    background: #f5f5f5;
  }
  .report-meta {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    margin-bottom: 20px;
  }
  .report-meta-item,
  .report-section,
  .report-review {
    border: 1px solid #e5e5e5;
    border-radius: 12px;
    padding: 14px;
    break-inside: avoid;
  }
  .report-meta-item {
    background: #fafafa;
  }
  .report-meta-label {
    color: #737373;
    font-size: 11px;
    font-weight: 700;
    margin-bottom: 5px;
  }
  .report-meta-value {
    font-size: 13px;
    font-weight: 700;
  }
  .report-sections {
    display: grid;
    gap: 12px;
  }
  .report-section-title {
    font-size: 15px;
    margin: 0 0 10px;
  }
  .report-section-body {
    color: #404040;
    font-size: 13px;
    line-height: 1.9;
    white-space: pre-wrap;
  }
  .report-list {
    margin: 0;
    padding-right: 18px;
  }
  .report-nested-row {
    display: grid;
    grid-template-columns: 120px 1fr;
    gap: 10px;
    border-bottom: 1px solid #f5f5f5;
    padding-bottom: 6px;
  }
  .report-nested-key {
    color: #737373;
    font-weight: 700;
  }
  .report-html-content table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
    font-size: 13px;
  }
  .report-html-content th,
  .report-html-content td {
    border: 1px solid #d4d4d4;
    padding: 8px 10px;
    text-align: right;
  }
  .report-html-content th {
    background: #f5f5f5;
    font-weight: 700;
  }
  .report-html-content img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    margin: 8px 0;
  }
  .report-html-content ul,
  .report-html-content ol {
    padding-right: 20px;
    margin: 8px 0;
  }
  .report-html-content h1,
  .report-html-content h2,
  .report-html-content h3,
  .report-html-content h4 {
    margin: 16px 0 8px;
    color: #171717;
  }
  .report-html-content blockquote {
    border-right: 4px solid #527F47;
    margin: 12px 0;
    padding: 8px 16px;
    background: #fafafa;
    color: #525252;
  }
  .report-html-content a {
    color: #527F47;
    text-decoration: underline;
  }
  .report-review {
    margin-top: 20px;
    background: #fffbeb;
    border-color: #fde68a;
  }
  .report-footer {
    margin-top: 26px;
    padding-top: 12px;
    border-top: 1px solid #e5e5e5;
    color: #737373;
    font-size: 11px;
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }
  .report-header {
    position: relative;
    overflow: hidden;
    border: 0;
    border-radius: 20px;
    padding: 28px;
    margin-bottom: 22px;
    color: white;
    background: linear-gradient(135deg, #234d20, #527f47 55%, #147d74);
  }
  .report-brand { color: rgba(255,255,255,.82); font-weight: 800; font-size: 12px; margin: 0 0 12px; }
  .report-title { color: white; font-size: 27px; line-height: 1.45; margin: 0; max-width: 90%; }
  .report-description { color: rgba(255,255,255,.78); font-size: 12px; line-height: 1.8; margin-top: 9px; }
  .report-header-meta { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 16px; }
  .report-header-meta span { border: 1px solid rgba(255,255,255,.2); background: rgba(255,255,255,.1); border-radius: 999px; padding: 5px 9px; font-size: 9px; font-weight: 700; color: rgba(255,255,255,.88); }
  .report-meta-item { border-radius: 14px; padding: 14px; background: linear-gradient(180deg,#fff,#fafafa); }
  .report-meta-item.positive { border-color: #bbf7d0; background: #f0fdf4; }
  .report-meta-item.negative { border-color: #fecaca; background: #fef2f2; }
  .report-meta-item.positive .report-meta-value { color: #15803d; }
  .report-meta-item.negative .report-meta-value { color: #b91c1c; }
  .report-meta-value { color: #171717; font-size: 18px; font-weight: 900; }
  .report-meta-hint { color: #a3a3a3; font-size: 9px; margin-top: 4px; }
  .report-highlight-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 12px; margin-bottom: 18px; }
  .report-highlight-card { border-radius: 14px; padding: 15px; border: 1px solid #dbeafe; background: #eff6ff; break-inside: avoid; }
  .report-highlight-card.secondary { border-color: #d1fae5; background: #ecfdf5; }
  .report-highlight-label { color: #64748b; font-size: 10px; font-weight: 700; margin-bottom: 5px; }
  .report-highlight-value { color: #172554; font-size: 14px; font-weight: 800; }
  .report-section.accent { border-right: 5px solid #527f47; background: #f3f8f1; }
  .report-section.success { border-right: 5px solid #16a34a; background: #f0fdf4; }
  .report-section.warning { border-right: 5px solid #d97706; background: #fffbeb; }
  .report-section.neutral { background: #fafafa; }
  .report-recommendations { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 9px; }
  .report-recommendation { border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; background: white; break-inside: avoid; }
  .report-recommendation-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; }
  .report-recommendation-number { width: 21px; height: 21px; border-radius: 7px; display: inline-flex; align-items: center; justify-content: center; background: #f3f8f1; color: #365f30; font-size: 9px; font-weight: 900; }
  .report-priority { display: inline-block; border-radius: 999px; padding: 3px 8px; font-size: 9px; font-weight: 800; margin-bottom: 7px; background: #fef3c7; color: #92400e; }
  .report-priority.high { background: #fee2e2; color: #991b1b; }
  .report-priority.low { background: #dcfce7; color: #166534; }
  .report-recommendation-title { font-size: 12px; font-weight: 900; margin-bottom: 5px; }
  .report-table { width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; font-size: 10px; }
  .report-table th { background: #f5f5f5; color: #525252; font-weight: 800; }
  .report-table th, .report-table td { padding: 8px 10px; text-align: right; border: 1px solid #eeeeee; }
  .report-table-name { font-weight: 800; color: #262626; }
  .report-share { min-width: 100px; display: flex; align-items: center; gap: 7px; font-weight: 800; }
  .report-share-track { flex: 1; height: 5px; overflow: hidden; border-radius: 99px; background: #e5e7eb; }
  .report-share-track i { display: block; height: 100%; border-radius: inherit; background: #527f47; }
  .report-rank { width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; border-radius: 7px; background: #f5f5f5; color: #525252; font-size: 9px; font-weight: 900; }
  .report-change { display: inline-flex; border-radius: 999px; padding: 3px 7px; font-weight: 800; background: #f5f5f5; color: #525252; }
  .report-change.positive { background: #dcfce7; color: #166534; }
  .report-change.negative { background: #fee2e2; color: #991b1b; }
  @page { size: A4; margin: 0; }
  @media print {
    body { background: #fff; }
    .report-paper { margin: 0; width: auto; min-height: auto; }
  }
`

export async function exportElementToPdf(element: HTMLElement, filename: string) {
  const html2pdf = (await import('html2pdf.js')).default
  const options = {
    margin: [8, 8, 8, 8] as [number, number, number, number],
    filename,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      letterRendering: true,
    },
    jsPDF: {
      unit: 'mm' as const,
      format: 'a4' as const,
      orientation: 'portrait' as const,
    },
    pagebreak: {
      mode: ['css', 'legacy'],
      avoid: ['.report-section', '.report-meta-item', '.report-review'],
    },
  }

  await html2pdf()
    .set(options)
    .from(element)
    .save()
}

export function printElement(element: HTMLElement, title: string) {
  const printWindow = window.open('', '_blank', 'width=960,height=720')
  if (!printWindow) {
    window.print()
    return
  }

  const safeTitle = title.replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  })[character] || character)

  const stylesheetLinks = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'))
    .map(link => `<link rel="stylesheet" href="${link.href}" />`)
    .join('')

  printWindow.document.open()
  printWindow.document.write(`
    <!doctype html>
    <html lang="ar" dir="rtl">
      <head>
        <meta charset="utf-8" />
        <title>${safeTitle}</title>
        ${stylesheetLinks}
        <style>
          ${printStyles}
          .print-preview-toolbar {
            position: sticky;
            top: 0;
            z-index: 100;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            padding: 12px;
            background: rgba(255,255,255,.96);
            border-bottom: 1px solid #e5e7eb;
            box-shadow: 0 5px 18px rgba(0,0,0,.08);
            backdrop-filter: blur(8px);
          }
          .print-preview-toolbar button {
            border: 1px solid #d4d4d4;
            border-radius: 10px;
            background: #fff;
            color: #262626;
            padding: 8px 16px;
            font: inherit;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
          }
          .print-preview-toolbar .primary {
            border-color: #527f47;
            background: #527f47;
            color: #fff;
          }
          @media print { .print-preview-toolbar { display: none !important; } }
        </style>
      </head>
      <body>
        <div class="print-preview-toolbar">
          <button id="print-preview-print" class="primary" type="button">طباعة التقرير</button>
          <button id="print-preview-close" type="button">إغلاق المعاينة</button>
        </div>
        ${element.outerHTML}
      </body>
    </html>
  `)
  printWindow.document.close()

  printWindow.document.getElementById('print-preview-print')?.addEventListener('click', () => printWindow.print())
  printWindow.document.getElementById('print-preview-close')?.addEventListener('click', () => printWindow.close())
  printWindow.focus()
}

export function exportElementToWord(element: HTMLElement, filename: string) {
  const html = `
    <!doctype html>
    <html lang="ar" dir="rtl" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
      <head>
        <meta charset="utf-8" />
        <title>${filename}</title>
        <style>${printStyles}</style>
      </head>
      <body>${element.outerHTML}</body>
    </html>
  `
  const blob = new Blob(['\ufeff', html], { type: 'application/msword;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename.toLowerCase().endsWith('.doc') ? filename : `${filename}.doc`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
