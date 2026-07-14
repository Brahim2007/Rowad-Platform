import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

type ActivityLogInput = {
  entity: string
  entityId: string
  action: string
  actor?: string | null
  changes?: unknown
  metadata?: unknown
}

function toJsonText(value: unknown) {
  if (value === undefined || value === null) return null
  return typeof value === 'string' ? value : JSON.stringify(value)
}

export async function recordActivityLog(input: ActivityLogInput) {
  try {
    await prisma.activityLog.create({
      data: {
        entity: input.entity,
        entityId: input.entityId,
        action: input.action,
        actor: input.actor || null,
        changes: toJsonText(input.changes),
        metadata: toJsonText(input.metadata),
      },
    })
  } catch (error) {
    logger.error('[activity-log] Failed to record activity', error)
  }
}
