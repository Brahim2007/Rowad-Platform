import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireOperationalAccess } from '@/lib/auth-helpers'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const auth = await requireOperationalAccess()
  if (!auth.ok) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const now = new Date()
    const year = Number(searchParams.get('year')) || now.getFullYear()
    const month = Number(searchParams.get('month')) || now.getMonth() + 1
    const requestedPlatformId = searchParams.get('platformId') || ''
    const platformId = auth.user.role === 'PLATFORM_MANAGER'
      ? auth.user.platformId || ''
      : requestedPlatformId
    const start = new Date(Date.UTC(year, month - 1, 1))
    const end = new Date(Date.UTC(year, month, 1))
    const directPlatform = platformId ? { platformId } : {}

    const [activities, projects, tasks, evaluations, impactLogs] = await Promise.all([
      prisma.activity.findMany({
        where: {
          startDate: { lt: end },
          OR: [{ endDate: null }, { endDate: { gte: start } }],
          ...(platformId ? { program: { platformId } } : {}),
        },
        select: {
          id: true, name: true, startDate: true, endDate: true,
          program: { select: { name: true, platform: { select: { id: true, name: true } } } },
        },
        orderBy: { startDate: 'asc' },
      }),
      prisma.project.findMany({
        where: {
          startDate: { lt: end },
          OR: [{ endDate: null }, { endDate: { gte: start } }],
          ...directPlatform,
        },
        select: { id: true, title: true, startDate: true, endDate: true, status: true, platform: { select: { id: true, name: true } } },
        orderBy: { startDate: 'asc' },
      }),
      prisma.coordinationTask.findMany({
        where: { dueDate: { gte: start, lt: end }, ...directPlatform },
        select: { id: true, title: true, dueDate: true, status: true, priority: true, assignee: true, platform: { select: { id: true, name: true } } },
        orderBy: { dueDate: 'asc' },
      }),
      prisma.evaluation.findMany({
        where: { evaluatedAt: { gte: start, lt: end }, ...directPlatform },
        select: { id: true, title: true, evaluatedAt: true, status: true, score: true, maxScore: true, platform: { select: { id: true, name: true } } },
        orderBy: { evaluatedAt: 'asc' },
      }),
      prisma.impactLog.findMany({
        where: { date: { gte: start, lt: end }, ...directPlatform },
        select: {
          id: true, date: true, status: true,
          action: { select: { name: true } },
          platform: { select: { id: true, name: true } },
          beneficiary: { select: { firstName: true, lastName: true } },
        },
        orderBy: { date: 'asc' },
        take: 300,
      }),
    ])

    const events = [
      ...activities.filter(item => item.startDate).map(item => ({
        id: `activity:${item.id}`,
        sourceId: item.id,
        title: item.name,
        type: 'ACTIVITY',
        date: item.startDate!.toISOString(),
        endDate: item.endDate?.toISOString() || null,
        status: 'SCHEDULED',
        platformId: item.program.platform.id,
        platformName: item.program.platform.name,
        subtitle: item.program.name,
        link: '/admin/platforms',
      })),
      ...projects.filter(item => item.startDate).map(item => ({
        id: `project:${item.id}`,
        sourceId: item.id,
        title: item.title,
        type: 'PROJECT',
        date: item.startDate!.toISOString(),
        endDate: item.endDate?.toISOString() || null,
        status: item.status,
        platformId: item.platform?.id || null,
        platformName: item.platform?.name || null,
        subtitle: 'مشروع',
        link: '/admin/projects',
      })),
      ...tasks.filter(item => item.dueDate).map(item => ({
        id: `task:${item.id}`,
        sourceId: item.id,
        title: item.title,
        type: 'TASK',
        date: item.dueDate!.toISOString(),
        endDate: null,
        status: item.status,
        platformId: item.platform?.id || null,
        platformName: item.platform?.name || null,
        subtitle: item.assignee || 'دون مسؤول',
        priority: item.priority,
        link: '/admin/coordination',
      })),
      ...evaluations.map(item => ({
        id: `evaluation:${item.id}`,
        sourceId: item.id,
        title: item.title,
        type: 'EVALUATION',
        date: item.evaluatedAt.toISOString(),
        endDate: null,
        status: item.status,
        platformId: item.platform?.id || null,
        platformName: item.platform?.name || null,
        subtitle: item.score === null ? 'دون نتيجة' : `${Math.round(item.maxScore ? item.score / item.maxScore * 100 : 0)}%`,
        link: '/admin/evaluations',
      })),
      ...impactLogs.map(item => ({
        id: `impact:${item.id}`,
        sourceId: item.id,
        title: item.action.name,
        type: 'IMPACT',
        date: item.date.toISOString(),
        endDate: null,
        status: item.status,
        platformId: item.platform?.id || null,
        platformName: item.platform?.name || null,
        subtitle: `${item.beneficiary.firstName} ${item.beneficiary.lastName}`,
        link: '/admin/impact?tab=activities',
      })),
    ].sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json({
      success: true,
      data: {
        events,
        period: { year, month },
        stats: {
          total: events.length,
          activities: activities.length + impactLogs.length,
          deadlines: tasks.filter(task => task.status !== 'COMPLETED' && task.status !== 'CANCELLED').length,
          evaluations: evaluations.length,
        },
      },
    })
  } catch (error) {
    logger.error('Admin calendar GET error', error)
    return NextResponse.json({ success: false, message: 'تعذر تحميل التقويم التشغيلي' }, { status: 500 })
  }
}
