/**
 * API: إحصائيات وبيانات مدير المنصة
 * GET /api/admin/my-platform/stats — KPI + الأنشطة المعلقة
 * GET /api/admin/my-platform/stats?tab=members — قائمة الأعضاء
 * GET /api/admin/my-platform/stats?tab=activities — سجل الأنشطة
 */

import { NextRequest, NextResponse } from 'next/server'
import { ImpactApprovalStatus, Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireAuth, verifyPlatformOwnership } from '@/lib/auth-helpers'
import { logger } from '@/lib/logger'

// ═══════════════════════════════════════════════════
// أنواع الإرجاع
// ═══════════════════════════════════════════════════

interface PendingActivity {
  id: string
  beneficiaryName: string
  beneficiaryCode: string
  actionName: string
  count: number
  quality: string
  date: string
  note: string | null
}

interface ActivityInfo {
  id: string
  beneficiaryName: string
  beneficiaryCode: string
  actionName: string
  category: string
  quality: string
  status: string
  date: string
  count: number
  note: string | null
  rejectionReason: string | null
}

// ═══════════════════════════════════════════════════
// GET handler
// ═══════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error

  if (auth.user.role !== 'SUPER_ADMIN' && auth.user.role !== 'ADMIN' && auth.user.role !== 'PLATFORM_MANAGER') {
    return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const platformId = searchParams.get('platformId') || auth.user.platformId
    const tab = searchParams.get('tab') || 'dashboard'
    const search = searchParams.get('search') || ''
    const statusFilter = searchParams.get('status') || ''

    if (!platformId) {
      return NextResponse.json({ success: false, message: 'معرف المنصة مطلوب' }, { status: 400 })
    }
    if (!(await verifyPlatformOwnership(auth.user, platformId))) {
      return NextResponse.json({ success: false, message: 'غير مصرح — خارج نطاق المنصة' }, { status: 403 })
    }

    if (tab === 'members') return handleMembers(platformId, search)
    if (tab === 'activities') return handleActivities(platformId, search, statusFilter)
    if (tab === 'reports') return handleSmartReports(platformId)

    return handleDashboard(platformId)
  } catch (error) {
    logger.error('Platform stats error', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

async function handleSmartReports(platformId: string) {
  const reports = await prisma.aiGeneratedReport.findMany({
    where: { platformId, periodType: 'monthly' },
    orderBy: { createdAt: 'desc' },
    take: 36,
    select: {
      id: true,
      title: true,
      periodYear: true,
      periodMonth: true,
      createdAt: true,
    },
  })

  return NextResponse.json({
    success: true,
    data: reports.map(report => ({
      ...report,
      createdAt: report.createdAt.toISOString(),
    })),
  })
}

// ═══════════════════════════════════════════════════
// Dashboard
// ═══════════════════════════════════════════════════

async function handleDashboard(platformId: string) {
  const now = new Date()
  const curYear = now.getFullYear()
  const curMonth = now.getMonth() + 1

  const [memberCount, platformData, pendingLogs, allLogs] = await Promise.all([
    prisma.beneficiary.count({ where: { platformId, status: 'ACTIVE' } }),
    prisma.platform.findUnique({ where: { id: platformId }, select: { id: true, name: true, slug: true } }),
    prisma.impactLog.findMany({
      where: { platformId, status: 'PENDING_REVIEW' },
      orderBy: { date: 'desc' },
      take: 50,
      include: {
        action: { select: { name: true } },
        beneficiary: { select: { firstName: true, lastName: true, code: true } },
      },
    }),
    prisma.impactLog.findMany({
      where: { platformId },
      select: { status: true, date: true, beneficiaryId: true },
    }),
  ])

  const thisMonthLogs = allLogs.filter((l) => {
    const d = new Date(l.date)
    return d.getFullYear() === curYear && d.getMonth() + 1 === curMonth
  })

  const activeBeneficiaryIds = new Set(thisMonthLogs.map((l) => l.beneficiaryId).filter(Boolean))
  const approvedCount = allLogs.filter((l) => l.status === 'APPROVED').length
  const thisMonthApproved = thisMonthLogs.filter((l) => l.status === 'APPROVED').length

  const pendingActivities: PendingActivity[] = pendingLogs.map((l) => ({
    id: l.id,
    beneficiaryName: l.beneficiary ? `${l.beneficiary.firstName} ${l.beneficiary.lastName}` : '—',
    beneficiaryCode: l.beneficiary?.code || '—',
    actionName: l.action?.name || '—',
    count: l.count,
    quality: l.quality,
    date: l.date instanceof Date ? l.date.toISOString().slice(0, 10) : String(l.date || '').slice(0, 10),
    note: l.note || null,
  }))

  return NextResponse.json({
    success: true,
    data: {
      platform: platformData,
      kpis: {
        memberCount,
        activeNow: activeBeneficiaryIds.size,
        pendingReviews: pendingLogs.length,
        totalApproved: approvedCount,
        monthlyApproved: thisMonthApproved,
      },
      pendingActivities,
    },
  })
}

// ═══════════════════════════════════════════════════
// Members
// ═══════════════════════════════════════════════════

async function handleMembers(platformId: string, search: string) {
  const where: Prisma.BeneficiaryWhereInput = { platformId, status: 'ACTIVE' }
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
    ]
  }

  const members = await prisma.beneficiary.findMany({
    where,
    orderBy: { registeredAt: 'desc' },
    select: {
      id: true, code: true, firstName: true, lastName: true,
      networkRole: true, status: true, joinDate: true, email: true, phone: true,
    },
  })

  return NextResponse.json({
    success: true,
    data: members.map((m) => ({
      ...m,
      name: `${m.firstName} ${m.lastName}`.trim(),
    })),
  })
}

// ═══════════════════════════════════════════════════
// Activities
// ═══════════════════════════════════════════════════

async function handleActivities(platformId: string, search: string, statusFilter: string) {
  const where: Prisma.ImpactLogWhereInput = { platformId }
  if (Object.values(ImpactApprovalStatus).includes(statusFilter as ImpactApprovalStatus)) {
    where.status = statusFilter as ImpactApprovalStatus
  }

  const logs = await prisma.impactLog.findMany({
    where,
    orderBy: { date: 'desc' },
    take: 200,
    include: {
      action: { select: { name: true, category: true, points: true } },
      beneficiary: { select: { firstName: true, lastName: true, code: true } },
    },
  })

  let data: ActivityInfo[] = logs.map((l) => ({
    id: l.id,
    beneficiaryName: l.beneficiary ? `${l.beneficiary.firstName} ${l.beneficiary.lastName}` : '—',
    beneficiaryCode: l.beneficiary?.code || '—',
    actionName: l.action?.name || '—',
    category: l.action?.category || 'OTHER',
    quality: l.quality,
    status: l.status,
    date: l.date instanceof Date ? l.date.toISOString().slice(0, 10) : String(l.date || '').slice(0, 10),
    count: l.count,
    note: l.note || null,
    rejectionReason: l.rejectionReason || null,
  }))

  if (search) {
    const q = search.toLowerCase()
    data = data.filter(a => a.beneficiaryName.toLowerCase().includes(q) || a.beneficiaryCode.toLowerCase().includes(q) || a.actionName.toLowerCase().includes(q))
  }

  return NextResponse.json({ success: true, data })
}
