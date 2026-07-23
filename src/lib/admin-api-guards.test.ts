import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = process.cwd()
const adminApiRoot = join(root, 'src', 'app', 'api', 'admin')

function adminRouteFiles(): string[] {
  const files: string[] = []
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) walk(fullPath)
      else if (entry.name === 'route.ts') files.push(fullPath)
    }
  }
  walk(adminApiRoot)
  return files
}

function routeName(file: string): string {
  return relative(adminApiRoot, file).replaceAll('\\', '/')
}

const globalOnlyRoutes = new Set([
  'activity-log/route.ts',
  'backup/route.ts',
  'content/route.ts',
  'dashboard/route.ts',
  'ai/usage/route.ts',
  'platforms-overview/route.ts',
  'users/route.ts',
  'visitors/route.ts',
  'ai/assistant/route.ts',
  'ai/impact-report/route.ts',
  'ai/impact-report/[id]/route.ts',
  'ai/report-analysis/route.ts',
  'ai/report-summary/route.ts',
])

const scopedRoutes = [
  'members/route.ts',
  'members/[id]/route.ts',
  'members/import/route.ts',
  'beneficiaries/route.ts',
  'documents/route.ts',
  'documents/[id]/versions/route.ts',
  'evaluations/route.ts',
  'impact/logs/route.ts',
  'impact/logs/import/route.ts',
  'impact/awards/route.ts',
  'impact/gates/route.ts',
  'broadcasts/route.ts',
  'platforms/route.ts',
  'platforms/[slug]/route.ts',
  'programs/route.ts',
  'projects/route.ts',
  'team/route.ts',
  'knowledge/route.ts',
  'journey/route.ts',
  'coordination/tasks/route.ts',
  'reports/submitted/route.ts',
  'reports/submitted/[id]/route.ts',
  'analytics/indicators/route.ts',
  'search/route.ts',
  'my-platform/stats/route.ts',
  'activities/[slug]/route.ts',
] as const

describe('admin API authorization guard coverage', () => {
  it('does not reintroduce local checkAuth or direct auth usage in route handlers', () => {
    const offenders = adminRouteFiles().flatMap(file => {
      const source = readFileSync(file, 'utf8')
      const hasLocalCheckAuth = /\bfunction\s+checkAuth\b|\bconst\s+checkAuth\b|\basync\s+function\s+checkAuth\b/.test(source)
      const importsDirectAuth = /from ['"]@\/lib\/auth['"]/.test(source)
      const callsDirectAuth = /\bauth\(\)/.test(source)
      return hasLocalCheckAuth || importsDirectAuth || callsDirectAuth ? [routeName(file)] : []
    })

    assert.deepEqual(offenders, [])
  })

  it('uses shared auth helpers in every admin route', () => {
    const offenders = adminRouteFiles().flatMap(file => {
      const source = readFileSync(file, 'utf8')
      return source.includes('@/lib/auth-helpers') ? [] : [routeName(file)]
    })

    assert.deepEqual(offenders, [])
  })

  it('keeps globally scoped admin routes restricted away from platform managers', () => {
    const offenders = [...globalOnlyRoutes].flatMap(route => {
      const source = readFileSync(join(adminApiRoot, route), 'utf8')
      const hasGlobalGuard =
        source.includes('requireSuperAdmin') ||
        source.includes('requireAdminRole') ||
        source.includes("role === 'PLATFORM_MANAGER'") ||
        source.includes("role !== 'SUPER_ADMIN' && auth.user.role !== 'ADMIN'")

      return hasGlobalGuard ? [] : [route]
    })

    assert.deepEqual(offenders, [])
  })

  it('keeps platform-scoped admin routes guarded by platform filters or ownership checks', () => {
    const offenders = scopedRoutes.flatMap(route => {
      const source = readFileSync(join(adminApiRoot, route), 'utf8')
      const hasScopeGuard =
        source.includes('platformWhere(') ||
        source.includes('verifyPlatformOwnership(') ||
        source.includes('getPlatformScope(')

      return hasScopeGuard ? [] : [route]
    })

    assert.deepEqual(offenders, [])
  })

  it('keeps the impact dashboard scoped for platform managers', () => {
    const source = readFileSync(join(adminApiRoot, 'impact/dashboard/route.ts'), 'utf8')

    assert.match(source, /auth\.user\.role === 'PLATFORM_MANAGER'/)
    assert.match(source, /auth\.user\.platformId/)
    assert.match(source, /buildDashboardData\(scope,\s*platformId\)/)
  })
})
