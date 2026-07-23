import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'
import { ai } from '@/lib/ai/deepseek'
import { buildGovernanceDrafts, type GovernanceDraft } from '@/lib/ai-governance'
import { recordActivityLog } from '@/lib/activity-log'
import { logger } from '@/lib/logger'

async function requireSystemManager() {
  const auth = await requireAuth()
  if (!auth.ok) return { error: auth.error }
  if (auth.user.role !== 'SUPER_ADMIN' && auth.user.role !== 'ADMIN') {
    return { error: NextResponse.json({ success: false, message: 'مركز التقييم الذكي متاح لمدير النظام فقط' }, { status: 403 }) }
  }
  return { auth }
}

async function enhanceDrafts(drafts: GovernanceDraft[], userId: string) {
  if (!drafts.length || !ai.isConfigured()) return { drafts, aiEnhanced: false }
  try {
    const source = drafts.map(item => ({
      fingerprint: item.fingerprint,
      title: item.title,
      summary: item.summary,
      evidence: item.evidence,
      proposedAction: item.proposedAction,
    }))
    const result = await Promise.race([
      ai.chat(
        `راجع توصيات الحوكمة التالية وحسّن العنوان والملخص والإجراء المقترح فقط.
التزم بالدليل حرفيًا، لا تضف رقمًا أو سببًا أو اتهامًا أو عقوبة، ولا تغيّر fingerprint:
${JSON.stringify(source)}

أعد JSON فقط: {"items":[{"fingerprint":"نفس القيمة","title":"...","summary":"...","proposedAction":"..."}]}`,
        {
          system: 'أنت مستشار حوكمة مؤسسية عربي. افصل الحقيقة عن التفسير، واجعل الإجراء قابلًا للقياس وغير عقابي.',
          temperature: 0.15,
          maxTokens: 2800,
          userId,
          feature: 'ai-governance-center',
          responseFormat: { type: 'json_object' },
        },
      ),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('AI wording timeout')), 18000)),
    ])
    const parsed = JSON.parse(result.text) as {
      items?: Array<{ fingerprint?: string; title?: string; summary?: string; proposedAction?: string }>
    }
    const enhanced = new Map((parsed.items || []).map(item => [item.fingerprint, item]))
    return {
      drafts: drafts.map(item => {
        const next = enhanced.get(item.fingerprint)
        if (!next?.title?.trim() || !next.summary?.trim() || !next.proposedAction?.trim()) return item
        return {
          ...item,
          title: next.title.trim().slice(0, 300),
          summary: next.summary.trim().slice(0, 2000),
          proposedAction: next.proposedAction.trim().slice(0, 2000),
        }
      }),
      aiEnhanced: true,
    }
  } catch (error) {
    logger.warn('[ai-governance] wording fallback', error)
    return { drafts, aiEnhanced: false }
  }
}

async function generateDrafts(userId: string) {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const staleBefore = new Date(Date.now() - 7 * 86400000)
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const [
    platforms,
    currentApproved,
    staleGroups,
    unassignedMembers,
    unscopedLogs,
    approvedWithoutEvidence,
    suspiciousHighCountLogs,
  ] = await Promise.all([
    prisma.platform.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        members: { where: { status: 'ACTIVE' }, select: { id: true } },
        managerAssignments: {
          where: { endedAt: null, assignmentRole: 'PRIMARY', adminUser: { isActive: true } },
          take: 1,
          select: { adminUser: { select: { id: true, fullName: true, lastLoginAt: true } } },
        },
        _count: { select: { submittedReports: { where: { status: 'APPROVED' } } } },
      },
    }),
    prisma.impactLog.groupBy({
      by: ['platformId', 'beneficiaryId'],
      where: { platformId: { not: null }, status: 'APPROVED', date: { gte: start, lt: end } },
      _count: { _all: true },
    }),
    prisma.impactLog.groupBy({
      by: ['platformId'],
      where: { platformId: { not: null }, status: 'PENDING_REVIEW', date: { lt: staleBefore } },
      _count: { _all: true },
    }),
    prisma.beneficiary.count({ where: { status: 'ACTIVE', platformId: null } }),
    prisma.impactLog.count({ where: { platformId: null } }),
    prisma.impactLog.count({
      where: { status: 'APPROVED', date: { gte: start, lt: end }, OR: [{ link: null }, { link: '' }] },
    }),
    prisma.impactLog.count({ where: { date: { gte: start, lt: end }, count: { gt: 50 } } }),
  ])

  const activeMembers = new Map<string, Set<string>>()
  for (const row of currentApproved) {
    if (!row.platformId) continue
    if (!activeMembers.has(row.platformId)) activeMembers.set(row.platformId, new Set())
    activeMembers.get(row.platformId)!.add(row.beneficiaryId)
  }
  const staleMap = new Map(staleGroups.filter(row => row.platformId).map(row => [row.platformId!, row._count._all]))
  const drafts = buildGovernanceDrafts({
    period,
    unassignedMembers,
    unscopedLogs,
    approvedWithoutEvidence,
    suspiciousHighCountLogs,
    platforms: platforms.map(platform => {
      const manager = platform.managerAssignments[0]?.adminUser || null
      const memberCount = platform.members.length
      const activeCount = activeMembers.get(platform.id)?.size || 0
      return {
        id: platform.id,
        name: platform.name,
        managerId: manager?.id || null,
        managerName: manager?.fullName || null,
        managerLastLoginAt: manager?.lastLoginAt || null,
        memberCount,
        activeRate: memberCount ? Math.round(activeCount / memberCount * 100) : 0,
        stalePending: staleMap.get(platform.id) || 0,
        approvedReports: platform._count.submittedReports,
      }
    }),
  })
  const enhanced = await enhanceDrafts(drafts, userId)
  const existing = await prisma.aiGovernanceRecommendation.findMany({
    where: { fingerprint: { in: enhanced.drafts.map(item => item.fingerprint) } },
    select: { id: true, fingerprint: true, status: true },
  })
  const existingMap = new Map(existing.map(item => [item.fingerprint, item]))
  let created = 0
  let refreshed = 0
  let preserved = 0

  for (const draft of enhanced.drafts) {
    const current = existingMap.get(draft.fingerprint)
    if (current && current.status !== 'DRAFT') {
      preserved += 1
      continue
    }
    const data = {
      category: draft.category,
      severity: draft.severity,
      title: draft.title,
      summary: draft.summary,
      evidence: draft.evidence,
      proposedAction: draft.proposedAction,
      platformId: draft.platformId || null,
      subjectType: draft.subjectType || null,
      subjectId: draft.subjectId || null,
      subjectName: draft.subjectName || null,
      aiEnhanced: enhanced.aiEnhanced,
      generatedBy: userId,
    }
    if (current) {
      await prisma.aiGovernanceRecommendation.update({ where: { id: current.id }, data })
      refreshed += 1
    } else {
      await prisma.aiGovernanceRecommendation.create({ data: { fingerprint: draft.fingerprint, ...data } })
      created += 1
    }
  }
  return { created, refreshed, preserved, total: enhanced.drafts.length, aiEnhanced: enhanced.aiEnhanced }
}

export async function GET(request: NextRequest) {
  const access = await requireSystemManager()
  if (access.error) return access.error
  const targetsFor = request.nextUrl.searchParams.get('targetsFor')
  if (targetsFor) {
    const recommendation = await prisma.aiGovernanceRecommendation.findUnique({
      where: { id: targetsFor },
      select: { id: true, status: true, platformId: true },
    })
    if (!recommendation) return NextResponse.json({ success: false, message: 'التوصية غير موجودة' }, { status: 404 })
    const [members, managers] = await Promise.all([
      prisma.beneficiary.findMany({
        where: {
          status: 'ACTIVE',
          ...(recommendation.platformId ? { platformId: recommendation.platformId } : {}),
        },
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
        take: 500,
        select: { id: true, firstName: true, lastName: true, code: true, platformId: true },
      }),
      recommendation.platformId
        ? prisma.platformManagerAssignment.findMany({
            where: {
              platformId: recommendation.platformId,
              endedAt: null,
              assignmentRole: 'PRIMARY',
              adminUser: { isActive: true },
            },
            select: { adminUser: { select: { id: true, fullName: true, email: true } } },
          })
        : Promise.resolve([]),
    ])
    return NextResponse.json({
      success: true,
      data: {
        members: members.map(member => ({
          id: member.id,
          name: `${member.firstName} ${member.lastName}`.trim(),
          code: member.code,
        })),
        managers: managers.map(item => item.adminUser),
      },
    })
  }
  const status = request.nextUrl.searchParams.get('status') || ''
  const category = request.nextUrl.searchParams.get('category') || ''
  const recommendations = await prisma.aiGovernanceRecommendation.findMany({
    where: {
      ...(status && { status }),
      ...(category && { category }),
    },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    take: 300,
  })
  const grouped = await prisma.aiGovernanceRecommendation.groupBy({
    by: ['status'],
    _count: { _all: true },
  })
  return NextResponse.json({
    success: true,
    data: recommendations,
    summary: Object.fromEntries(grouped.map(item => [item.status, item._count._all])),
  })
}

export async function POST(request: NextRequest) {
  const access = await requireSystemManager()
  if (access.error || !access.auth) return access.error
  try {
    const body = await request.json()
    if (body.action === 'GENERATE') {
      const result = await generateDrafts(access.auth.user.id)
      await recordActivityLog({
        entity: 'ai_governance',
        entityId: 'generation',
        action: 'GENERATE',
        actor: access.auth.user.email,
        metadata: result,
      })
      return NextResponse.json({ success: true, data: result })
    }
    if ((body.action === 'APPROVE' || body.action === 'REJECT') && body.id) {
      const recommendation = await prisma.aiGovernanceRecommendation.update({
        where: { id: String(body.id) },
        data: {
          status: body.action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
          reviewedBy: access.auth.user.email,
          reviewedAt: new Date(),
          reviewNote: String(body.note || '').trim() || null,
        },
      })
      await recordActivityLog({
        entity: 'ai_governance_recommendation',
        entityId: recommendation.id,
        action: body.action,
        actor: access.auth.user.email,
        metadata: { fingerprint: recommendation.fingerprint, note: recommendation.reviewNote },
      })
      return NextResponse.json({ success: true, data: recommendation })
    }
    if (body.action === 'EXECUTE' && body.id) {
      const recommendation = await prisma.aiGovernanceRecommendation.findUnique({ where: { id: String(body.id) } })
      if (!recommendation) return NextResponse.json({ success: false, message: 'التوصية غير موجودة' }, { status: 404 })
      if (recommendation.status !== 'APPROVED') {
        return NextResponse.json({ success: false, message: 'يجب اعتماد التوصية قبل تحديد الإجراء' }, { status: 400 })
      }
      if (recommendation.actionType) {
        return NextResponse.json({ success: false, message: 'تم تنفيذ إجراء لهذه التوصية مسبقًا' }, { status: 409 })
      }

      const actionType = String(body.actionType || '')
      const actor = access.auth.user.email
      let targetId: string | null = null
      let targetName: string | null = null
      let metadata: Record<string, unknown> = {}

      if (actionType === 'NOTIFY_MANAGER') {
        if (!recommendation.platformId) {
          return NextResponse.json({ success: false, message: 'التوصية غير مرتبطة بمنصة' }, { status: 400 })
        }
        const assignment = await prisma.platformManagerAssignment.findFirst({
          where: {
            platformId: recommendation.platformId,
            endedAt: null,
            assignmentRole: 'PRIMARY',
            adminUser: { isActive: true },
          },
          select: { adminUser: { select: { id: true, fullName: true } } },
        })
        if (!assignment) return NextResponse.json({ success: false, message: 'لا يوجد مدير أساسي نشط للمنصة' }, { status: 400 })
        targetId = assignment.adminUser.id
        targetName = assignment.adminUser.fullName
        await prisma.notification.create({
          data: {
            recipientId: targetId,
            recipientType: 'PLATFORM_MANAGER',
            type: 'SYSTEM_ALERT',
            title: recommendation.title,
            body: `${recommendation.summary}\n\nالإجراء المعتمد: ${recommendation.proposedAction}`,
            link: '/admin/my-platform',
            senderId: access.auth.user.id,
            senderName: access.auth.user.name || actor,
          },
        })
      } else if (actionType === 'NOTIFY_MEMBER') {
        const member = await prisma.beneficiary.findUnique({
          where: { id: String(body.targetMemberId || '') },
          select: { id: true, firstName: true, lastName: true, platformId: true, status: true },
        })
        if (!member || member.status !== 'ACTIVE') {
          return NextResponse.json({ success: false, message: 'العضو غير موجود أو غير نشط' }, { status: 400 })
        }
        if (recommendation.platformId && member.platformId !== recommendation.platformId) {
          return NextResponse.json({ success: false, message: 'العضو لا يتبع منصة التوصية' }, { status: 400 })
        }
        targetId = member.id
        targetName = `${member.firstName} ${member.lastName}`.trim()
        await prisma.notification.create({
          data: {
            recipientId: targetId,
            recipientType: 'MEMBER',
            type: 'SYSTEM_ALERT',
            title: recommendation.title,
            body: `${recommendation.summary}\n\nالإجراء المقترح: ${recommendation.proposedAction}`,
            link: '/member?tab=notifications',
            senderId: access.auth.user.id,
            senderName: access.auth.user.name || actor,
          },
        })
      } else if (actionType === 'CREATE_TASK') {
        const assignee = String(body.assignee || '').trim()
        if (!assignee) return NextResponse.json({ success: false, message: 'اسم المسؤول مطلوب' }, { status: 400 })
        const priority = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(String(body.priority)) ? body.priority : 'HIGH'
        const dueDate = body.dueDate ? new Date(body.dueDate) : null
        if (dueDate && Number.isNaN(dueDate.getTime())) {
          return NextResponse.json({ success: false, message: 'تاريخ الاستحقاق غير صحيح' }, { status: 400 })
        }
        const task = await prisma.coordinationTask.create({
          data: {
            title: recommendation.title,
            description: `${recommendation.summary}\n\nالدليل: ${recommendation.evidence}\n\nالإجراء المعتمد: ${recommendation.proposedAction}`,
            assignee,
            assigneeRole: String(body.assigneeRole || '').trim() || null,
            priority,
            dueDate,
            platformId: recommendation.platformId,
            notes: `من توصية التقييم الذكي: ${recommendation.id}`,
          },
        })
        targetId = task.id
        targetName = assignee
        metadata = { taskId: task.id, priority, dueDate: dueDate?.toISOString() || null }
      } else if (actionType === 'INTERNAL') {
        targetName = 'قرار داخلي'
        metadata = { note: String(body.note || '').trim() || null }
      } else {
        return NextResponse.json({ success: false, message: 'نوع الإجراء غير صحيح' }, { status: 400 })
      }

      const actioned = await prisma.aiGovernanceRecommendation.update({
        where: { id: recommendation.id },
        data: {
          actionType,
          actionTargetId: targetId,
          actionTargetName: targetName,
          actionedBy: actor,
          actionedAt: new Date(),
          actionMetadata: JSON.stringify(metadata),
        },
      })
      await recordActivityLog({
        entity: 'ai_governance_recommendation',
        entityId: recommendation.id,
        action: 'EXECUTE',
        actor,
        metadata: { actionType, targetId, targetName, ...metadata },
      })
      return NextResponse.json({ success: true, data: actioned })
    }
    return NextResponse.json({ success: false, message: 'الإجراء غير صحيح' }, { status: 400 })
  } catch (error) {
    logger.error('[ai-governance] API error', error)
    return NextResponse.json({ success: false, message: 'تعذر تنفيذ الإجراء' }, { status: 500 })
  }
}
