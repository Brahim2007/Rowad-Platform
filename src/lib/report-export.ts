const printStyles = `
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: #f5f5f5;
    color: #171717;
    font-family: Arial, Tahoma, sans-serif;
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
  @page { size: A4; margin: 0; }
  @media print {
    body { background: #fff; }
    .report-paper { margin: 0; width: auto; min-height: auto; }
  }
`

export async function exportElementToPdf(element: HTMLElement, filename: string) {
  const html2pdf = (await import('html2pdf.js')).default
  await html2pdf()
    .set({
      margin: [8, 8, 8, 8],
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait',
      },
      pagebreak: {
        mode: ['css', 'legacy'],
        avoid: ['.report-section', '.report-meta-item', '.report-review'],
      },
    } as any)
    .from(element)
    .save()
}

export function printElement(element: HTMLElement, title: string) {
  const printWindow = window.open('', '_blank', 'width=960,height=720')
  if (!printWindow) {
    window.print()
    return
  }

  printWindow.document.open()
  printWindow.document.write(`
    <!doctype html>
    <html lang="ar" dir="rtl">
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>${printStyles}</style>
      </head>
      <body>${element.outerHTML}</body>
    </html>
  `)
  printWindow.document.close()
  printWindow.focus()
  window.setTimeout(() => {
    printWindow.print()
    printWindow.close()
  }, 250)
}
