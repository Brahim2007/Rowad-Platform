import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

function source(path: string) {
  return readFileSync(path, 'utf8')
}

describe('member portal security and routing guards', () => {
  it('uses member-scoped impact APIs instead of admin APIs', () => {
    const page = source('src/app/[locale]/member/page.tsx')
    assert.match(page, /fetch\('\/api\/member\/impact\/actions'/)
    assert.match(page, /fetch\('\/api\/member\/impact\/logs'/)
    assert.doesNotMatch(page, /\/api\/admin\/impact\/(actions|logs)/)
  })

  it('derives member submissions from the active authenticated member', () => {
    const route = source('src/app/api/member/impact/logs/route.ts')
    assert.match(route, /await requireActiveMember\(request\)/)
    assert.match(route, /beneficiaryId:\s*auth\.member\.id/)
    assert.match(route, /status:\s*'PENDING_REVIEW'/)
    assert.doesNotMatch(route, /beneficiaryId:\s*body\./)
  })

  it('clears the HttpOnly member cookie through a server logout endpoint', () => {
    const authRoute = source('src/app/api/member/auth/route.ts')
    const page = source('src/app/[locale]/member/page.tsx')
    assert.match(authRoute, /export async function DELETE/)
    assert.match(authRoute, /cookies\.set\('member_token',\s*''/)
    assert.match(authRoute, /maxAge:\s*0/)
    assert.match(page, /fetch\('\/api\/member\/auth',\s*\{\s*method:\s*'DELETE'/)
    assert.doesNotMatch(page, /document\.cookie/)
  })

  it('keeps member APIs unavailable to deactivated accounts', () => {
    const memberAuth = source('src/lib/member-auth.ts')
    const dashboard = source('src/app/api/member/dashboard/route.ts')
    const profile = source('src/app/api/member/profile/route.ts')
    assert.match(memberAuth, /member\.status !== 'ACTIVE'/)
    assert.match(dashboard, /await requireActiveMember\(request\)/)
    assert.match(profile, /await requireActiveMember\(request\)/)
  })

  it('requires an explicit notification recipient context for reads and writes', () => {
    const route = source('src/app/api/notifications/route.ts')
    const memberPage = source('src/app/[locale]/member/page.tsx')
    const adminPage = source('src/app/[locale]/admin/notifications/page.tsx')
    assert.match(route, /type !== 'ADMIN' && type !== 'PLATFORM_MANAGER' && type !== 'MEMBER'/)
    assert.match(memberPage, /type:\s*'MEMBER'/)
    assert.match(adminPage, /type:\s*'ADMIN'/)
  })

  it('resets credentials against the current member email and exposes an admin action', () => {
    const memberRoute = source('src/app/api/admin/members/[id]/route.ts')
    const memberPage = source('src/app/[locale]/admin/members/[id]/page.tsx')
    assert.match(memberRoute, /body\.action !== 'send-credentials'/)
    assert.match(memberRoute, /to:\s*member\.email/)
    assert.match(memberRoute, /emailDeliveryConfigured\(\)/)
    assert.match(memberRoute, /passwordHash:\s*await bcrypt\.hash\(temporaryPassword/)
    assert.match(memberPage, /إرسال بيانات الدخول/)
  })

  it('emails member lifecycle events to the current authenticated email', () => {
    const submissionRoute = source('src/app/api/member/impact/logs/route.ts')
    const profileRoute = source('src/app/api/member/profile/route.ts')
    const approvalRoute = source('src/app/api/admin/impact/logs/route.ts')
    assert.match(submissionRoute, /sendActivitySubmittedEmail/)
    assert.match(submissionRoute, /to:\s*auth\.member\.email/)
    assert.match(profileRoute, /sendPasswordChangedEmail/)
    assert.match(profileRoute, /to:\s*auth\.member\.email/)
    assert.match(approvalRoute, /to:\s*beneficiary\.email/)
  })

  it('presents evidence as a web URL supporting Google Drive', () => {
    const page = source('src/app/[locale]/member/page.tsx')
    assert.match(page, /type="url"/)
    assert.match(page, /drive\.google\.com/)
    assert.match(page, /فتح دليل النشاط/)
  })
})
