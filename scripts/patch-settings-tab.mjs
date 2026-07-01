import { readFileSync, writeFileSync } from 'fs';

let c = readFileSync('src/app/[locale]/admin/impact/page.tsx', 'utf8');

const oldFuncStart = 'function SettingsTab({ actions: initialActions, fetchAll }';
const newFunc = `function SettingsTab({ actions: initialActions, fetchAll }: { actions: ImpactActionItem[]; fetchAll: () => void }) {
  const [localActions, setLocalActions] = useState(initialActions)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', points: '10', category: 'DIGITAL_ACTIVITY', note: '' })
  const [submitting, setSubmitting] = useState(false)
  const [section, setSection] = useState<'catalog' | 'quality' | 'levels' | 'tiers'>('catalog')
  const [settings, setSettings] = useState<any>(null)

  useEffect(() => { setLocalActions(initialActions) }, [initialActions])

  useEffect(() => {
    fetch('/api/admin/impact/settings').then(r => r.json()).then(d => {
      if (d.success) setSettings(d.data)
    }).catch(() => {})
  }, [])

  const saveSettings = async (key: string, value: any) => {
    try {
      const res = await fetch('/api/admin/impact/settings', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: JSON.stringify(value) }),
      })
      if ((await res.json()).success) toast.success('تم حفظ الإعدادات')
    } catch { toast.error('فشل') }
    finally { fetchAll() }
  }

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault(); setSubmitting(true)
    try {
      const res = await fetch('/api/admin/impact/actions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, points: Number(form.points) }),
      })
      if ((await res.json()).success) { toast.success('تمت إضافة النشاط'); setShowModal(false); fetchAll() }
    } catch { toast.error('فشل') }
    finally { setSubmitting(false) }
  }

  const delAction = async (id: string) => {
    if (!confirm('تعطيل/حذف هذا النوع؟')) return
    try { if ((await (await fetch('/api/admin/impact/actions?id=' + id, { method: 'DELETE' })).json()).success) { toast.success('تم'); fetchAll() } } catch { toast.error('فشل') }
  }

  const grouped = useMemo(() => {
    const groups: Record<string, ImpactActionItem[]> = {}
    for (const a of localActions) { const cat = a.category || 'OTHER'; if (!groups[cat]) groups[cat] = []; groups[cat].push(a) }
    return groups
  }, [localActions])

  const sectionOpts = [
    { key: 'catalog' as const, label: 'كتالوج الأنشطة', icon: Settings },
    { key: 'quality' as const, label: 'بونص الجودة', icon: Star },
    { key: 'levels' as const, label: 'المستويات', icon: TrendingUp },
    { key: 'tiers' as const, label: 'شرائح المكافآت', icon: Medal },
  ]

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 overflow-x-auto">
        {sectionOpts.map(s => (
          <button key={s.key} onClick={() => setSection(s.key)}
            className={\`px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap flex items-center gap-1.5 \${section === s.key ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}\`}>
            <s.icon size={14} /> {s.label}
          </button>
        ))}
      </div>

      {section === 'catalog' && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-neutral-900 flex items-center gap-2"><Settings size={18} className="text-primary-600" /> كتالوج الأنشطة</h2>
            {showModal ? null : <button onClick={() => { setForm({ name: '', points: '10', category: 'DIGITAL_ACTIVITY', note: '' }); setShowModal(true) }} className="btn-primary btn-sm flex items-center gap-1"><Plus size={14} /> إضافة نشاط</button>}
          </div>
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} className="mb-6">
              <h3 className="font-semibold text-neutral-700 mb-2 bg-neutral-50 p-2 rounded-lg">{CATEGORY_LABELS[cat] || cat}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-neutral-100"><th className="text-right p-2 text-neutral-500">اسم النشاط</th><th className="text-center p-2 text-neutral-500">النقاط</th><th className="text-right p-2 text-neutral-500">ملاحظات</th><th className="text-center p-2 text-neutral-500">حذف</th></tr></thead>
                  <tbody>{items.map(a => (<tr key={a.id} className="border-b border-neutral-50 hover:bg-neutral-50"><td className="p-2 font-semibold">{a.name}</td><td className="p-2 text-center font-mono font-bold">{a.points}</td><td className="p-2 text-xs text-neutral-500">{a.note || '—'}</td><td className="p-2 text-center"><button onClick={() => delAction(a.id)} className="text-neutral-400 hover:text-red-600"><Trash size={13} /></button></td></tr>))}</tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {section === 'quality' && settings && (
        <div className="card p-5">
          <h2 className="font-bold text-neutral-900 mb-4 flex items-center gap-2"><Star size={18} className="text-primary-600" /> بونص الجودة</h2>
          <p className="text-sm text-neutral-500 mb-4">النقاط الإضافية (أو المخصومة) حسب مستوى جودة النشاط</p>
          <div className="space-y-3 max-w-md">
            {Object.entries(settings.qualityBonus as Record<string, number>).map(([key, val]) => (
              <div key={key} className="flex items-center gap-3">
                <span className="w-24 text-sm font-semibold text-neutral-700">{QUALITY_LABELS[key] || key}</span>
                <input type="number" defaultValue={val} onBlur={e => {
                  const newVal = Number(e.target.value)
                  if (!isNaN(newVal) && newVal !== val) {
                    const updated = { ...settings.qualityBonus, [key]: newVal }
                    setSettings({ ...settings, qualityBonus: updated })
                    saveSettings('qualityBonus', updated)
                  }
                }} className="input-field max-w-[100px] text-center" />
                <span className="text-xs text-neutral-400">نقطة</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {section === 'levels' && settings && (
        <div className="card p-5">
          <h2 className="font-bold text-neutral-900 mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-primary-600" /> المستويات</h2>
          <div className="space-y-3 max-w-lg">
            {(settings.levels as any[]).map((lv: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-32 text-sm font-semibold text-neutral-700">{lv.name}</span>
                <span className="text-xs text-neutral-400">من</span>
                <input type="number" defaultValue={lv.from} onBlur={e => {
                  const n = Number(e.target.value); if (!isNaN(n)) {
                    const u = settings.levels.map((l: any, j: number) => j === i ? { ...l, from: n } : l)
                    setSettings({ ...settings, levels: u }); saveSettings('levels', u)
                  }
                }} className="input-field max-w-[90px] text-center" />
                <span className="text-xs text-neutral-400">إلى</span>
                <input type="number" defaultValue={lv.to} onBlur={e => {
                  const n = Number(e.target.value); if (!isNaN(n)) {
                    const u = settings.levels.map((l: any, j: number) => j === i ? { ...l, to: n } : l)
                    setSettings({ ...settings, levels: u }); saveSettings('levels', u)
                  }
                }} className="input-field max-w-[90px] text-center" />
              </div>
            ))}
          </div>
        </div>
      )}

      {section === 'tiers' && settings && (
        <div className="card p-5">
          <h2 className="font-bold text-neutral-900 mb-4 flex items-center gap-2"><Medal size={18} className="text-primary-600" /> شرائح المكافآت</h2>
          <div className="space-y-3 max-w-lg">
            {(settings.rewardTiers as any[]).map((tier: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-24 text-sm font-semibold text-neutral-700">{tier.name}</span>
                <span className="text-xs text-neutral-400">من</span>
                <input type="number" defaultValue={tier.from} onBlur={e => {
                  const n = Number(e.target.value); if (!isNaN(n)) {
                    const u = settings.rewardTiers.map((t: any, j: number) => j === i ? { ...t, from: n } : t)
                    setSettings({ ...settings, rewardTiers: u }); saveSettings('rewardTiers', u)
                  }
                }} className="input-field max-w-[90px] text-center" />
                <span className="text-xs text-neutral-400">إلى</span>
                <input type="number" defaultValue={tier.to} onBlur={e => {
                  const n = Number(e.target.value); if (!isNaN(n)) {
                    const u = settings.rewardTiers.map((t: any, j: number) => j === i ? { ...t, to: n } : t)
                    setSettings({ ...settings, rewardTiers: u }); saveSettings('rewardTiers', u)
                  }
                }} className="input-field max-w-[90px] text-center" />
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b"><h2 className="font-bold text-neutral-900">إضافة نشاط جديد</h2><button onClick={() => setShowModal(false)} className="p-1.5 text-neutral-400 hover:text-neutral-600"><X size={18} /></button></div>
            <form onSubmit={handleAdd} className="p-5 space-y-4">
              <div><label className="block text-sm font-semibold text-neutral-700 mb-1">اسم النشاط</label><input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" /></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-semibold text-neutral-700 mb-1">النقاط</label><input type="number" value={form.points} onChange={e => setForm({ ...form, points: e.target.value })} className="input-field" /></div><div><label className="block text-sm font-semibold text-neutral-700 mb-1">المحور</label><select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input-field">{Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div></div>
              <div><label className="block text-sm font-semibold text-neutral-700 mb-1">ملاحظات</label><input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} className="input-field" /></div>
              <div className="flex justify-end gap-3 pt-4 border-t"><button type="button" onClick={() => setShowModal(false)} className="btn-ghost btn-sm">إلغاء</button><button type="submit" disabled={submitting} className="btn-primary btn-sm">{submitting ? 'جاري...' : 'إضافة'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}`;

const idx = c.indexOf(oldFuncStart);
if (idx > 0) {
  // Find end: look for the final closing } of the function before next comment
  // The function ends with the last } before EOF or next marker
  const remaining = c.slice(idx);
  // Find where the function's module-level } ends (matching the export default pattern)
  // Simple: replace from function start to end of file (it's the last function)
  const nextComment = remaining.indexOf('\n\n//');
  const endIdx = idx + (nextComment > 0 ? nextComment : remaining.length);
  c = c.slice(0, idx) + newFunc + c.slice(endIdx);
  writeFileSync('src/app/[locale]/admin/impact/page.tsx', c);
  console.log('SettingsTab replaced OK');
} else {
  console.log('NOT FOUND');
}
