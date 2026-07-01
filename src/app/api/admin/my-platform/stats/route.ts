/**
 * API: إحصائيات وبيانات مدير المنصة
 * GET /api/admin/my-platform/stats — KPI + الأنشطة المعلقة
 * GET /api/admin/my-platform/stats?tab=members — قائمة الأعضاء
 * GET /api/admin/my-platform/stats?tab=activities — سجل الأنشطة
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

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

interface MemberInfo {
  id: string
  code: string
  firstName: string
  lastName: string
  networkRole: string | null
  status: string
  joinDate: string | null
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
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })
  }

  const user = session.user as any
  if (user.role !== 'SUPER_ADMIN' && user.role !== 'PLATFORM_MANAGER') {
    return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const platformId = searchParams.get('platformId') || user.platformId
    const tab = searchParams.get('tab') || 'dashboard'
    const search = searchParams.get('search') || ''
    const statusFilter = searchParams.get('status') || ''

    if (!platformId) {
      return NextResponse.json({ success: false, message: 'معرف المنصة مطلوب' }, { status: 400 })
    }

    if (tab === 'members') return handleMembers(platformId, search)
    if (tab === 'activities') return handleActivities(platformId, search, statusFilter)

    return handleDashboard(platformId)
  } catch (error) {
    console.error('Platform stats error:', error)
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 })
  }
}

// ═══════════════════════════════════════════════════
// Dashboard
// ═══════════════════════════════════════════════════

async function handleDashboard(platformId: string) {
  const now = new Date()
  const curYear = now.getFullYear()
  const curMonth = now.getMonth() + 1

  const [memberCount, platformData, pendingLogs, allLogs] = await Promise.all([
    (prisma as any).beneficiary.count({ where: { platformId, status: 'ACTIVE' } }),
    (prisma as any).platform.findUnique({ where: { id: platformId }, select: { id: true, name: true, slug: true } }),
    (prisma as any).impactLog.findMany({
      where: { platformId, status: 'PENDING_REVIEW' },
      orderBy: { date: 'desc' },
      take: 50,
      include: {
        action: { select: { name: true } },
        beneficiary: { select: { firstName: true, lastName: true, code: true } },
      },
    }),
    (prisma as any).impactLog.findMany({
      where: { platformId },
      select: { status: true, date: true, beneficiaryId: true },
    }),
  ])

  const thisMonthLogs = allLogs.filter((l: any) => {
    const d = new Date(l.date)
    return d.getFullYear() === curYear && d.getMonth() + 1 === curMonth
  })

  const activeBeneficiaryIds = new Set(thisMonthLogs.map((l: any) => l.beneficiaryId).filter(Boolean))
  const approvedCount = allLogs.filter((l: any) => l.status === 'APPROVED').length
  const thisMonthApproved = thisMonthLogs.filter((l: any) => l.status === 'APPROVED').length

  const pendingActivities: PendingActivity[] = pendingLogs.map((l: any) => ({
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
  const where: any = { platformId, status: 'ACTIVE' }
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
    ]
  }

  const members = await (prisma as any).beneficiary.findMany({
    where,
    orderBy: { registeredAt: 'desc' },
    select: {
      id: true, code: true, firstName: true, lastName: true,
      networkRole: true, status: true, joinDate: true, email: true, phone: true,
    },
  })

  return NextResponse.json({
    success: true,
    data: members.map((m: any) => ({
      ...m,
      name: `${m.firstName} ${m.lastName}`.trim(),
    })),
  })
}

// ═══════════════════════════════════════════════════
// Activities
// ═══════════════════════════════════════════════════

async function handleActivities(platformId: string, search: string, statusFilter: string) {
  const where: any = { platformId }
  if (statusFilter) where.status = statusFilter

  const logs = await (prisma as any).impactLog.findMany({
    where,
    orderBy: { date: 'desc' },
    take: 200,
    include: {
      action: { select: { name: true, category: true, points: true } },
      beneficiary: { select: { firstName: true, lastName: true, code: true } },
    },
  })

  let data: ActivityInfo[] = logs.map((l: any) => ({
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
