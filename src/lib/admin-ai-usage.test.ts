import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

const projectRoot = process.cwd()
const routeSource = fs.readFileSync(
  path.join(projectRoot, 'src/app/api/admin/ai/usage/route.ts'),
  'utf8',
)
const layoutSource = fs.readFileSync(
  path.join(projectRoot, 'src/app/[locale]/admin/layout.tsx'),
  'utf8',
)

describe('admin AI usage balance', () => {
  it('protects usage data for system managers only', () => {
    assert.match(routeSource, /requireAuth\(\)/)
    assert.match(routeSource, /auth\.user\.role !== 'SUPER_ADMIN'/)
    assert.match(routeSource, /auth\.user\.role !== 'ADMIN'/)
  })

  it('calculates consumed and remaining monthly budget from usage logs', () => {
    assert.match(routeSource, /prisma\.aiUsageLog\.aggregate/)
    assert.match(routeSource, /costEstimate/)
    assert.match(routeSource, /monthlyBudget - consumed/)
  })

  it('keeps the balance available behind an off-by-default feature flag', () => {
    assert.match(layoutSource, /NEXT_PUBLIC_SHOW_AI_USAGE_BALANCE === 'true'/)
    assert.match(layoutSource, /\{SHOW_AI_USAGE_BALANCE && isSystemManager && <AiUsageBalance \/>\}/)
    assert.match(layoutSource, /المستهلك/)
    assert.match(layoutSource, /المتبقي/)
  })
})
