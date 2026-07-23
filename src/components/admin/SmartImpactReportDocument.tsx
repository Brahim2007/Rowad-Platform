import type { ImpactReportMetrics, SmartImpactReport } from '@/lib/ai/impact-report'

interface SmartImpactReportDocumentProps {
  report: SmartImpactReport
  metrics: ImpactReportMetrics
  generatedAt: string
}

function ListSection({ title, items, tone = '', empty = 'لا توجد ملاحظات في البيانات المتاحة' }: {
  title: string
  items: string[]
  tone?: 'success' | 'warning' | 'accent' | 'neutral' | ''
  empty?: string
  id?: string
}) {
  return (
    <section className={`report-section ${tone}`}>
      <h2 className="report-section-title">{title}</h2>
      {items.length ? <ul className="report-list report-section-body">{items.map((item, index) => <li key={`${title}-${index}`}>{item}</li>)}</ul> : <p className="report-section-body">{empty}</p>}
    </section>
  )
}

function formatChange(value: number | null) {
  if (value === null) return 'لا تتوفر مقارنة'
  if (value === 0) return 'دون تغير'
  return `${value > 0 ? '+' : ''}${value}%`
}

export function SmartImpactReportDocument({ report, metrics, generatedAt }: SmartImpactReportDocumentProps) {
  const participationRate = metrics.memberCount ? Math.round((metrics.activeMembers / metrics.memberCount) * 100) : 0
  const recommendations = [...report.recommendations].sort((a, b) => {
    const order = { 'عالية': 0, 'متوسطة': 1, 'منخفضة': 2 }
    return (order[a.priority as keyof typeof order] ?? 1) - (order[b.priority as keyof typeof order] ?? 1)
  })

  return (
    <article className="report-paper" dir="rtl">
      <header className="report-header">
        <p className="report-brand">شبكة الرواد الإلكترونية · وحدة قياس الأثر</p>
        <h1 className="report-title">{report.title}</h1>
        <p className="report-description">تقرير تنفيذي ذكي مبني على كامل بيانات {metrics.periodLabel}، أُنشئ في {new Date(generatedAt).toLocaleString('ar-SA')}.</p>
        <div className="report-header-meta">
          <span>{metrics.periodLabel}</span>
          <span>{metrics.dataQuality.recordsAnalyzed.toLocaleString('ar-SA')} سجلًا محللًا</span>
          <span>تحليل مساعد خاضع للمراجعة</span>
        </div>
      </header>

      <div className="report-meta">
        {[
          { label: 'إجمالي النقاط', value: metrics.totalPoints.toLocaleString('ar-SA'), hint: `مقابل ${metrics.previousTotalPoints.toLocaleString('ar-SA')} سابقًا` },
          { label: 'إجمالي الأنشطة', value: metrics.totalActivities.toLocaleString('ar-SA'), hint: `${metrics.approvedActivities} نشاطًا معتمدًا` },
          { label: 'نسبة الاعتماد', value: `${metrics.approvalRate}%`, hint: `${metrics.pendingActivities} قيد المراجعة` },
          { label: 'نسبة المشاركة', value: `${participationRate}%`, hint: `${metrics.activeMembers} من ${metrics.memberCount} عضوًا` },
          { label: 'تغير النقاط', value: formatChange(metrics.pointsChangePercent), hint: `عن ${metrics.previousPeriodLabel}`, trend: metrics.pointsChangePercent },
          { label: 'تغير الأنشطة', value: formatChange(metrics.activitiesChangePercent), hint: `${metrics.previousActivities} في الفترة السابقة`, trend: metrics.activitiesChangePercent },
        ].map(item => (
          <div className={`report-meta-item ${typeof item.trend === 'number' ? item.trend > 0 ? 'positive' : item.trend < 0 ? 'negative' : 'stable' : ''}`} key={item.label}>
            <div className="report-meta-label">{item.label}</div>
            <div className="report-meta-value">{item.value}</div>
            <div className="report-meta-hint">{item.hint}</div>
          </div>
        ))}
      </div>

      <div className="report-highlight-grid">
        <div className="report-highlight-card">
          <div className="report-highlight-label">رائد الفترة</div>
          <div className="report-highlight-value">{metrics.topMember?.name || 'لا تتوفر بيانات'}</div>
          <div className="report-meta-hint">{metrics.topMember ? `${metrics.topMember.points} نقطة · ${metrics.topMember.activities} نشاط` : '—'}</div>
        </div>
        <div className="report-highlight-card secondary">
          <div className="report-highlight-label">المنصة الأعلى أثرًا</div>
          <div className="report-highlight-value">{metrics.topPlatform?.name || 'لا تتوفر بيانات'}</div>
          <div className="report-meta-hint">{metrics.topPlatform ? `${metrics.topPlatform.points} نقطة · ${metrics.topPlatform.activities} نشاط` : '—'}</div>
        </div>
      </div>

      <div className="report-sections">
        <section id="report-summary" className="report-section accent report-anchor">
          <h2 className="report-section-title">الملخص التنفيذي</h2>
          <p className="report-section-body">{report.executiveSummary}</p>
        </section>
        <section id="report-performance" className="report-section report-anchor">
          <h2 className="report-section-title">قراءة الأداء والمقارنة</h2>
          <p className="report-section-body">{report.performanceNarrative}</p>
        </section>

        <ListSection title="أبرز النجاحات" items={report.highlights} tone="success" />
        <ListSection title="المخاطر والتنبيهات" items={report.risks} tone="warning" empty="لم تظهر مخاطر بارزة في البيانات المتاحة." />

        <section id="report-recommendations" className="report-section report-anchor">
          <h2 className="report-section-title">التوصيات التنفيذية</h2>
          <div className="report-recommendations">
            {recommendations.map((item, index) => (
              <div className="report-recommendation" key={`${item.title}-${index}`}>
                <div className="report-recommendation-head">
                  <span className="report-recommendation-number">{index + 1}</span>
                  <span className={`report-priority ${item.priority === 'عالية' ? 'high' : item.priority === 'منخفضة' ? 'low' : ''}`}>أولوية {item.priority}</span>
                </div>
                <div className="report-recommendation-title">{item.title}</div>
                <div className="report-section-body">{item.action}</div>
              </div>
            ))}
          </div>
        </section>

        {metrics.categories.length > 0 && (
          <section id="report-categories" className="report-section report-anchor">
            <h2 className="report-section-title">توزيع الأداء حسب المحور</h2>
            <table className="report-table"><thead><tr><th>المحور</th><th>النقاط</th><th>الأنشطة</th><th>حصة النقاط</th></tr></thead><tbody>
              {metrics.categories.map(category => {
                const share = metrics.totalPoints ? Math.round(category.points / metrics.totalPoints * 100) : 0
                return <tr key={category.name}><td className="report-table-name">{category.name}</td><td>{category.points.toLocaleString('ar-SA')}</td><td>{category.activities}</td><td><div className="report-share"><span>{share}%</span><div className="report-share-track"><i style={{ width: `${Math.min(100, Math.max(0, share))}%` }} /></div></div></td></tr>
              })}
            </tbody></table>
          </section>
        )}

        {metrics.platforms.length > 0 && (
          <section id="report-platforms" className="report-section report-anchor">
            <h2 className="report-section-title">مقارنة المنصات</h2>
            <table className="report-table"><thead><tr><th>#</th><th>المنصة</th><th>النقاط</th><th>الأنشطة</th><th>التغير</th></tr></thead><tbody>
              {metrics.platforms.slice(0, 8).map((platform, index) => <tr key={platform.name}><td><span className="report-rank">{index + 1}</span></td><td className="report-table-name">{platform.name}</td><td>{platform.points.toLocaleString('ar-SA')}</td><td>{platform.activities}</td><td><span className={`report-change ${typeof platform.changePercent === 'number' ? platform.changePercent > 0 ? 'positive' : platform.changePercent < 0 ? 'negative' : 'stable' : ''}`}>{formatChange(platform.changePercent)}</span></td></tr>)}
            </tbody></table>
          </section>
        )}

        <ListSection title="رؤى المنصات" items={report.platformInsights} />
        <ListSection title="رؤى الأعضاء" items={report.memberInsights} />
        <ListSection title="تركيز الفترة القادمة" items={report.nextPeriodFocus} tone="accent" />
        <ListSection title="ملاحظات جودة البيانات" items={report.dataNotes} tone="neutral" />
      </div>

      <footer className="report-footer">
        <span>سجلات محللة: {metrics.dataQuality.recordsAnalyzed.toLocaleString('ar-SA')} · نسبة المعلّق: {metrics.dataQuality.pendingRatio}%</span>
        <span>تحليل مساعد قابل للمراجعة البشرية ولا ينفذ قرارات اعتماد تلقائية.</span>
      </footer>
    </article>
  )
}
