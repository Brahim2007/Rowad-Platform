import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'

const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap [&>svg]:size-3',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary-100 text-primary-800',
        primary: 'border-transparent bg-primary-100 text-primary-800',
        secondary: 'border-transparent bg-secondary-100 text-secondary-800',
        success: 'border-transparent bg-success-50 text-success-700',
        warning: 'border-transparent bg-warning-50 text-warning-700',
        destructive: 'border-transparent bg-error-50 text-error-700',
        error: 'border-transparent bg-error-50 text-error-700',
        info: 'border-transparent bg-info-50 text-info-700',
        neutral: 'border-transparent bg-neutral-100 text-neutral-700',
        outline: 'border-neutral-200 bg-white text-neutral-700',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

function Badge({ className, variant, ...props }: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
