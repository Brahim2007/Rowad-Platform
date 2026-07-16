'use client'

import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'
import { cn } from '@/lib/utils/cn'

function Progress({ className, value, indicatorClassName, ...props }: React.ComponentProps<typeof ProgressPrimitive.Root> & { indicatorClassName?: string }) {
  const safeValue = Math.max(0, Math.min(100, value ?? 0))
  return (
    <ProgressPrimitive.Root data-slot="progress" className={cn('relative h-2.5 w-full overflow-hidden rounded-full bg-neutral-100', className)} value={safeValue} {...props}>
      <ProgressPrimitive.Indicator data-slot="progress-indicator" className={cn('h-full w-full flex-1 bg-primary-600 transition-transform duration-700', indicatorClassName)} style={{ transform: `translateX(${100 - safeValue}%)` }} />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
