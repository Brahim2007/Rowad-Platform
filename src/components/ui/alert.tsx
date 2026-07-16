import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'

const alertVariants = cva('relative w-full rounded-xl border p-4 text-sm [&>svg+div]:translate-y-[-2px] [&>svg]:absolute [&>svg]:start-4 [&>svg]:top-4 [&>svg~*]:ps-7', { variants: { variant: { default: 'border-neutral-200 bg-white text-neutral-950', success: 'border-success-500/25 bg-success-50 text-success-700', warning: 'border-warning-500/25 bg-warning-50 text-warning-700', destructive: 'border-error-500/25 bg-error-50 text-error-700', info: 'border-info-500/25 bg-info-50 text-info-700' } }, defaultVariants: { variant: 'default' } })
function Alert({ className, variant, ...props }: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) { return <div role="alert" data-slot="alert" className={cn(alertVariants({ variant }), className)} {...props} /> }
function AlertTitle({ className, ...props }: React.ComponentProps<'h5'>) { return <h5 data-slot="alert-title" className={cn('mb-1 font-semibold leading-none tracking-tight', className)} {...props} /> }
function AlertDescription({ className, ...props }: React.ComponentProps<'div'>) { return <div data-slot="alert-description" className={cn('text-sm leading-relaxed', className)} {...props} /> }

export { Alert, AlertTitle, AlertDescription }
