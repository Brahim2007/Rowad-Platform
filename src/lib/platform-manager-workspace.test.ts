import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const source = (...parts: string[]) => readFileSync(join(root, ...parts), 'utf8')

describe('platform manager workspace', () => {
  it('allows the manager to navigate to platform-scoped work pages', () => {
    const middleware = source('src', 'middleware.ts')

    for (const page of ['platform-overview', 'platforms', 'projects', 'documents', 'reports', 'notifications', 'search']) {
      assert.match(middleware, new RegExp(`\\b${page}\\b`))
    }
  })

  it('shows platform-scoped content links in the manager sidebar', () => {
    const layout = source('src', 'app', '[locale]', 'admin', 'layout.tsx')

    for (const href of ['/admin/platforms', '/admin/projects', '/admin/reports', '/admin/documents']) {
      assert.match(layout, new RegExp(href.replaceAll('/', '\\/')))
    }
  })

  it('adds program, project, report, and document metrics to the platform dashboard', () => {
    const route = source('src', 'app', 'api', 'admin', 'my-platform', 'stats', 'route.ts')

    assert.match(route, /prisma\.program\.count/)
    assert.match(route, /prisma\.project\.count/)
    assert.match(route, /prisma\.submittedReport\.count/)
    assert.match(route, /prisma\.document\.count/)
  })

  it('keeps report review controls away from platform managers', () => {
    const reportsPage = source('src', 'app', '[locale]', 'admin', 'reports', 'page.tsx')

    assert.match(reportsPage, /!isPlatformManager/)
    assert.match(reportsPage, /key === 'DRAFT' \|\| key === 'SUBMITTED'/)
  })
})
