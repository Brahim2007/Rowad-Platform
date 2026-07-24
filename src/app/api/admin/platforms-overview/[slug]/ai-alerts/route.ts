import { createHash } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, verifyPlatformOwnership } from '@/lib/auth-helpers'
import { ai } from '@/lib/ai/gemini'
import { buildPerformanceAlertProposals, type PerformanceAlertProposal } from '@/lib/performance-alerts'
import { logger } from '@/lib/logger'

function monthRange(year: number, month: number) {
  return { start: new Date(year, month - 1, 1), end: new Date(year, month, 1) }
}

async function loadProposals(slug: string, year: number, month: number) {
  const platform = await prisma.platform.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      managerAssignments: {
        where: { endedAt: null, adminUser: { isActive: true } },
        select: { adminUser: { select: { id: true, fullName: true } } },
      },
      members: {
        where: { status: 'ACTIVE' },
        select: { id: true, firstName: true, lastName: true },
      },
    },
  })
  if (!platform) return null

  const current = monthRange(year, month)
  const previousDate = new Date(year, month - 2, 1)
  const previous = monthRange(previousDate.getFullYear(), previousDate.getMonth() + 1)
  const staleBefore = new Date(Date.now() - 7 * 86400000)

  const [stalePending, administrators, currentGroups, previousGroups] = await Promise.all([
    prisma.impactLog.count({
      where: {
        platformId: platform.id,
        status: 'PENDING_REVIEW',
        date: { lt: staleBefore },
      },
    }),
    prisma.adminUser.findMany({
      where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] }, isActive: true },
      select: { id: true, fullName: true },
    }),
    prisma.impactLog.groupBy({
      by: ['beneficiaryId'],
      where: { platformId: platform.id, status: 'APPROVED', date: { gte: current.start, lt: current.end } },
      _count: { _all: true },
    }),
    prisma.impactLog.groupBy({
      by: ['beneficiaryId'],
      where: { platformId: platform.id, status: 'APPROVED', date: { gte: previous.start, lt: previous.end } },
      _count: { _all: true },
    }),
  ])

  const memberIds = new Set(platform.members.map(member => member.id))
  const currentCounts = new Map<string, number>()
  const previousCounts = new Map<string, number>()
  for (const row of currentGroups) if (memberIds.has(row.beneficiaryId)) currentCounts.set(row.beneficiaryId, row._count._all)
  for (const row of previousGroups) if (memberIds.has(row.beneficiaryId)) previousCounts.set(row.beneficiaryId, row._count._all)

  const activeMembers = platform.members.filter(member => (currentCounts.get(member.id) || 0) > 0).length
  const activeRate = platform.members.length ? Math.round(activeMembers / platform.members.length * 100) : 0
  const managers = Array.from(new Map(
    platform.managerAssignments.map(item => [item.adminUser.id, { id: item.adminUser.id, name: item.adminUser.fullName }]),
  ).values())

  return {
    platformId: platform.id,
    platformName: platform.name,
    proposals: buildPerformanceAlertProposals({
      platformName: platform.name,
      platformSlug: platform.slug,
      managers,
      administrators: administrators.map(item => ({ id: item.id, name: item.fullName })),
      members: platform.members.map(member => ({
        id: member.id,
        name: `${member.firstName} ${member.lastName}`.trim(),
        currentApproved: currentCounts.get(member.id) || 0,
        previousApproved: previousCounts.get(member.id) || 0,
      })),
      activeRate,
      stalePending,
    }),
  }
}

async function polishWithAi(proposals: PerformanceAlertProposal[], userId: string) {
  if (!proposals.length || !ai.isConfigured()) return { proposals, aiUsed: false }
  try {
    const source = proposals.map(item => ({
      id: item.id,
      recipientName: item.recipientName,
      severity: item.severity,
      title: item.title,
      body: item.body,
      evidence: item.evidence,
    }))
    const result = await ai.chat(
      `حسّن صياغة الإشعارات العربية التالية مع الحفاظ الحرفي على كل الأرقام والحقائق وعدم إضافة وعود أو عقوبات أو بيانات جديدة:
${JSON.stringify(source)}

أعد JSON فقط بالشكل: {"items":[{"id":"نفس المعرف","title":"حتى 120 حرفاً","body":"حتى 420 حرفاً"}]}`,
      {
        system: 'أنت مساعد متابعة أداء داعم وغير عقابي. لا تغيّر المستلم أو الدليل أو الأرقام، ولا تخترع سبباً للأداء.',
        temperature: 0.15,
        maxTokens: 1800,
        userId,
        feature: 'performance-alerts',
        responseFormat: { type: 'json_object' },
      },
    )
    const parsed = JSON.parse(result.text) as { items?: Array<{ id?: string; title?: string; body?: string }> }
    const wording = new Map((parsed.items || []).map(item => [item.id, item]))
    return {
      proposals: proposals.map(item => {
        const improved = wording.get(item.id)
        return improved?.title?.trim() && improved?.body?.trim()
          ? { ...item, title: improved.title.trim().slice(0, 120), body: improved.body.trim().slice(0, 420) }
          : item
      }),
      aiUsed: true,
    }
  } catch (error) {
    logger.warn('[performance-alerts] AI wording fallback', error)
    return { proposals, aiUsed: false }
  }
}

async function authorizePlatform(request: NextRequest, slug: string) {
  const auth = await requireAuth()
  if (!auth.ok) return { error: auth.error }
  if (!['SUPER_ADMIN', 'ADMIN'].includes(auth.user.role)) {
    return { error: NextResponse.json({ success: false, message: 'اعتماد التنبيهات الذكية متاح لمدير النظام فقط' }, { status: 403 }) }
  }
  const platform = await prisma.platform.findUnique({ where: { slug }, select: { id: true } })
  if (!platform) return { error: NextResponse.json({ success: false, message: 'المنصة غير موجودة' }, { status: 404 }) }
  if (!(await verifyPlatformOwnership(auth.user, platform.id))) {
    return { error: NextResponse.json({ success: false, message: 'غير مصرح — خارج نطاق المنصة' }, { status: 403 }) }
  }
  return { auth }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const access = await authorizePlatform(request, slug)
  if (access.error) return access.error
  const now = new Date()
  const year = Number(request.nextUrl.searchParams.get('year')) || now.getFullYear()
  const month = Math.min(12, Math.max(1, Number(request.nextUrl.searchParams.get('month')) || now.getMonth() + 1))
  const result = await loadProposals(slug, year, month)
  return NextResponse.json({ success: true, data: result })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const access = await authorizePlatform(request, slug)
  if (access.error || !access.auth) return access.error

  try {
    const body = await request.json()
    const now = new Date()
    const year = Number(body.year) || now.getFullYear()
    const month = Math.min(12, Math.max(1, Number(body.month) || now.getMonth() + 1))
    const result = await loadProposals(slug, year, month)
    if (!result) return NextResponse.json({ success: false, message: 'المنصة غير موجودة' }, { status: 404 })

    const selectedIds = Array.isArray(body.selectedIds) ? new Set(body.selectedIds.slice(0, 100).map(String)) : null
    const selected = result.proposals.filter(item => !selectedIds || selectedIds.has(item.id)).slice(0, 100)
    const polished = body.useAi === false ? { proposals: selected, aiUsed: false } : await polishWithAi(selected, access.auth.user.id)
    if (body.send === false) {
      return NextResponse.json({
        success: true,
        data: { sent: 0, skipped: 0, aiUsed: polished.aiUsed, proposals: polished.proposals },
      })
    }
    const duplicateAfter = new Date(Date.now() - 7 * 86400000)
    let sent = 0
    let skipped = 0

    for (const proposal of polished.proposals) {
      const senderId = `AI_ALERT_${createHash('sha256').update(`${proposal.id}:${year}-${month}`).digest('hex').slice(0, 32)}`
      const duplicate = await prisma.notification.findFirst({
        where: { recipientId: proposal.recipientId, senderId, createdAt: { gte: duplicateAfter } },
        select: { id: true },
      })
      if (duplicate) {
        skipped += 1
        continue
      }
      await prisma.notification.create({
        data: {
          recipientId: proposal.recipientId,
          recipientType: proposal.recipientType,
          type: 'SYSTEM_ALERT',
          title: proposal.title,
          body: proposal.body,
          link: proposal.link,
          senderId,
          senderName: 'مساعد الأداء الذكي',
          expiresAt: new Date(Date.now() + 45 * 86400000),
        },
      })
      sent += 1
    }

    return NextResponse.json({
      success: true,
      data: { sent, skipped, aiUsed: polished.aiUsed, proposals: polished.proposals },
    })
  } catch (error) {
    logger.error('[performance-alerts] send error', error)
    return NextResponse.json({ success: false, message: 'تعذر إنشاء الإشعارات' }, { status: 500 })
  }
}
