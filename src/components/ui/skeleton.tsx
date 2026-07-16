import { cn } from '@/lib/utils/cn'

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="skeleton" className={cn('animate-pulse rounded-xl bg-neutral-200/75', className)} {...props} />
}

export { Skeleton }
