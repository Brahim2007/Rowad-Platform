import * as React from 'react'
import { cn } from '@/lib/utils/cn'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return <textarea data-slot="textarea" className={cn('flex min-h-24 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-950 shadow-sm outline-none transition-[border-color,box-shadow] placeholder:text-neutral-400 focus-visible:border-primary-500 focus-visible:ring-2 focus-visible:ring-primary-100 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:opacity-60', className)} {...props} />
}

export { Textarea }
