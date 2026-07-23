import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

type NativeSelectProps = React.ComponentProps<'select'> & { wrapperClassName?: string }

function NativeSelect({ className, wrapperClassName, children, ...props }: NativeSelectProps) {
  return (
    <span className={cn('relative block w-full', wrapperClassName)} data-slot="native-select-wrapper">
      <select data-slot="native-select" className={cn('flex h-10 w-full appearance-none rounded-xl border border-neutral-300 bg-white px-3 py-2 pe-9 text-sm text-neutral-950 shadow-sm outline-none transition-[border-color,box-shadow] focus-visible:border-primary-500 focus-visible:ring-2 focus-visible:ring-primary-100 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:opacity-60', className)} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
    </span>
  )
}

export { NativeSelect }
