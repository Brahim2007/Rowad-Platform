import fs from 'node:fs'
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

const source = (file: string) => fs.readFileSync(file, 'utf8')

describe('admin global search', () => {
  it('submits the header query using the active locale', () => {
    const layout = source('src/app/[locale]/admin/layout.tsx')

    assert.match(layout, /role="search"/)
    assert.match(layout, /router\.push\(`\/\$\{locale\}\/admin\/search\?q=/)
    assert.match(layout, /disabled=\{normalizedQuery\.length < 2\}/)
  })

  it('loads server results and opens the selected member card', () => {
    const page = source('src/app/[locale]/admin/search/page.tsx')
    const route = source('src/app/api/admin/search/route.ts')

    assert.match(route, /searchParams\.get\('q'\)/)
    assert.match(route, /prisma\.beneficiary\.findMany/)
    assert.match(route, /prisma\.impactLog\.findMany/)
    assert.match(route, /prisma\.document\.findMany/)
    assert.match(page, /tab=card&memberId=/)
    assert.match(page, /cache: 'no-store'/)
  })
})
