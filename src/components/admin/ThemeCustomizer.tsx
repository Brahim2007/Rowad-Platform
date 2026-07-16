'use client'

import { Input } from '@/components/ui/input'

import { useEffect, useState } from 'react'
import { Check, Palette, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils/cn'

type ThemeSelection = {
  primary: string
  secondary: string
}

const STORAGE_KEY = 'rowad-admin-theme-v1'
const DEFAULT_THEME: ThemeSelection = { primary: '#527F47', secondary: '#B8853A' }

const PRIMARY_PRESETS = [
  { name: 'رواد', value: '#527F47' },
  { name: 'أزرق', value: '#2563EB' },
  { name: 'بنفسجي', value: '#7C3AED' },
  { name: 'وردي', value: '#E11D48' },
  { name: 'فيروزي', value: '#0D9488' },
  { name: 'رصاصي', value: '#475569' },
]

const SECONDARY_PRESETS = [
  { name: 'ذهبي', value: '#B8853A' },
  { name: 'كهرماني', value: '#D97706' },
  { name: 'سماوي', value: '#0891B2' },
  { name: 'أرجواني', value: '#DB2777' },
  { name: 'ليموني', value: '#65A30D' },
  { name: 'نيلي', value: '#4F46E5' },
]

function hexToHsl(hex: string) {
  const normalized = hex.replace('#', '')
  const r = Number.parseInt(normalized.slice(0, 2), 16) / 255
  const g = Number.parseInt(normalized.slice(2, 4), 16) / 255
  const b = Number.parseInt(normalized.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  let hue = 0

  if (delta) {
    if (max === r) hue = ((g - b) / delta) % 6
    else if (max === g) hue = (b - r) / delta + 2
    else hue = (r - g) / delta + 4
    hue = Math.round(hue * 60)
    if (hue < 0) hue += 360
  }

  const lightness = (max + min) / 2
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1))
  return { h: hue, s: Math.round(saturation * 100), l: Math.round(lightness * 100) }
}

function paletteFromHex(hex: string) {
  const { h, s, l } = hexToHsl(hex)
  const lightness = {
    50: Math.max(96, Math.min(98, l + 54)),
    100: Math.max(90, Math.min(94, l + 45)),
    200: Math.max(80, Math.min(86, l + 34)),
    300: Math.max(68, Math.min(74, l + 23)),
    400: Math.max(56, Math.min(62, l + 11)),
    500: Math.max(38, Math.min(55, l)),
    600: Math.max(31, Math.round(l * 0.82)),
    700: Math.max(25, Math.round(l * 0.66)),
    800: Math.max(19, Math.round(l * 0.52)),
    900: Math.max(14, Math.round(l * 0.4)),
    950: Math.max(7, Math.round(l * 0.22)),
  }
  return Object.fromEntries(Object.entries(lightness).map(([shade, value]) => [shade, `${h} ${s}% ${value}%`]))
}

function applyTheme(theme: ThemeSelection) {
  const root = document.documentElement
  const primary = paletteFromHex(theme.primary)
  const secondary = paletteFromHex(theme.secondary)

  Object.entries(primary).forEach(([shade, value]) => root.style.setProperty(`--primary-${shade}`, value))
  Object.entries(secondary).forEach(([shade, value]) => root.style.setProperty(`--secondary-${shade}`, value))
  root.style.setProperty('--primary', primary[500])
  root.style.setProperty('--ring', primary[500])
  root.style.setProperty('--secondary', secondary[500])
}

function clearTheme() {
  const root = document.documentElement
  const shades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']
  shades.forEach((shade) => {
    root.style.removeProperty(`--primary-${shade}`)
    root.style.removeProperty(`--secondary-${shade}`)
  })
  root.style.removeProperty('--primary')
  root.style.removeProperty('--ring')
  root.style.removeProperty('--secondary')
}

function ColorOptions({ label, value, presets, onChange }: { label: string; value: string; presets: typeof PRIMARY_PRESETS; onChange: (value: string) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Label>{label}</Label>
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs font-semibold text-neutral-600">
          لون مخصص
          <Input type="color" value={value} onChange={(event) => onChange(event.target.value.toUpperCase())} className="size-6 cursor-pointer rounded border-0 bg-transparent p-0" aria-label={`اختيار ${label}`} />
        </label>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {presets.map((preset) => {
          const selected = preset.value.toLowerCase() === value.toLowerCase()
          return (
            <Button unstyled
              key={preset.value}
              type="button"
              onClick={() => onChange(preset.value)}
              className={cn('flex items-center gap-2 rounded-xl border bg-white p-2.5 text-xs font-semibold text-neutral-700 shadow-sm transition hover:border-neutral-400', selected && 'border-neutral-950 ring-2 ring-neutral-950/10')}
            >
              <span className="flex size-7 items-center justify-center rounded-lg shadow-inner" style={{ backgroundColor: preset.value }}>
                {selected && <Check className="size-4 text-white drop-shadow" />}
              </span>
              {preset.name}
            </Button>
          )
        })}
      </div>
    </div>
  )
}

export function ThemeCustomizer({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState<ThemeSelection>(DEFAULT_THEME)

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved) setTheme(JSON.parse(saved) as ThemeSelection)
    } catch {}
  }, [])

  useEffect(() => {
    applyTheme(theme)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(theme))
    return clearTheme
  }, [theme])

  const reset = () => {
    setTheme(DEFAULT_THEME)
    window.localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button unstyled variant="outline" size={compact ? 'icon' : 'sm'} aria-label="تخصيص ألوان لوحة التحكم" title="تخصيص الألوان">
          <Palette className="size-4" />
          {!compact && <span>ألوان الواجهة</span>}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Palette className="size-5 text-primary-600" />تخصيص ألوان الداشبورد</DialogTitle>
          <DialogDescription>اختر اللون الرئيسي ولون التمييز. تحفظ الخيارات تلقائيًا على هذا المتصفح وتطبّق على جميع صفحات الإدارة.</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-2">
          <ColorOptions label="اللون الرئيسي" value={theme.primary} presets={PRIMARY_PRESETS} onChange={(primary) => setTheme((current) => ({ ...current, primary }))} />
          <ColorOptions label="لون التمييز" value={theme.secondary} presets={SECONDARY_PRESETS} onChange={(secondary) => setTheme((current) => ({ ...current, secondary }))} />
          <div className="overflow-hidden rounded-2xl border border-neutral-200">
            <div className="bg-primary-700 p-4 text-white"><p className="text-xs text-white/70">معاينة مباشرة</p><p className="font-bold">لوحة أثر الرواد</p></div>
            <div className="flex items-center gap-2 bg-white p-4"><span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-bold text-primary-800">نشط</span><span className="rounded-full bg-secondary-100 px-3 py-1 text-xs font-bold text-secondary-800">تمييز</span></div>
          </div>
        </div>
        <DialogFooter>
          <Button unstyled type="button" variant="ghost" onClick={reset}><RotateCcw className="size-4" />استعادة ألوان رواد</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
