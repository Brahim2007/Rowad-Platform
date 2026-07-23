import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import fs from 'node:fs'

const adminLayout = fs.readFileSync('src/app/[locale]/admin/layout.tsx', 'utf8')
const comingSoonPage = fs.readFileSync('src/components/admin/ComingSoonPage.tsx', 'utf8')

const pages = [
  ['job-descriptions', 'التوصيفات الوظيفية'],
  ['media-archive', 'أرشيف الصور والفيديو'],
  ['experts', 'بيانات الخبراء والشخصيات'],
] as const

describe('planned administration pages', () => {
  it('exposes every planned page in the administration sidebar', () => {
    for (const [route, label] of pages) {
      assert.match(adminLayout, new RegExp(`/admin/${route}`))
      assert.match(adminLayout, new RegExp(label))
    }
  })

  it('creates every planned route using the shared coming-soon design', () => {
    for (const [route, title] of pages) {
      const page = fs.readFileSync(`src/app/[locale]/admin/${route}/page.tsx`, 'utf8')
      assert.match(page, /ComingSoonPage/)
      assert.match(page, new RegExp(title))
    }

    assert.match(comingSoonPage, /سوف تُطوّر في مراحل قادمة/)
  })
})
