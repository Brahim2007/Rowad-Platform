'use client'

import * as React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const Select = SelectPrimitive.Root
const SelectGroup = SelectPrimitive.Group
const SelectValue = SelectPrimitive.Value

function SelectTrigger({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
  return <SelectPrimitive.Trigger data-slot="select-trigger" className={cn('flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-950 shadow-sm outline-none focus-visible:border-primary-500 focus-visible:ring-2 focus-visible:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1', className)} {...props}>{children}<SelectPrimitive.Icon asChild><ChevronDown className="size-4 text-neutral-400" /></SelectPrimitive.Icon></SelectPrimitive.Trigger>
}
function SelectContent({ className, children, position = 'popper', ...props }: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return <SelectPrimitive.Portal><SelectPrimitive.Content data-slot="select-content" className={cn('relative z-[120] max-h-96 min-w-32 overflow-hidden rounded-xl border border-neutral-200 bg-white text-neutral-950 shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out', position === 'popper' && 'data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1', className)} position={position} {...props}><SelectPrimitive.ScrollUpButton className="flex h-6 items-center justify-center"><ChevronUp className="size-4" /></SelectPrimitive.ScrollUpButton><SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport><SelectPrimitive.ScrollDownButton className="flex h-6 items-center justify-center"><ChevronDown className="size-4" /></SelectPrimitive.ScrollDownButton></SelectPrimitive.Content></SelectPrimitive.Portal>
}
function SelectLabel({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Label>) { return <SelectPrimitive.Label data-slot="select-label" className={cn('px-2 py-1.5 text-xs font-semibold text-neutral-500', className)} {...props} /> }
function SelectItem({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Item>) { return <SelectPrimitive.Item data-slot="select-item" className={cn('relative flex w-full cursor-default select-none items-center rounded-lg py-2 pe-8 ps-2 text-sm outline-none focus:bg-primary-50 focus:text-primary-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50', className)} {...props}><span className="absolute end-2 flex size-4 items-center justify-center"><SelectPrimitive.ItemIndicator><Check className="size-4" /></SelectPrimitive.ItemIndicator></span><SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText></SelectPrimitive.Item> }
function SelectSeparator({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Separator>) { return <SelectPrimitive.Separator data-slot="select-separator" className={cn('-mx-1 my-1 h-px bg-neutral-100', className)} {...props} /> }

export { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectLabel, SelectItem, SelectSeparator }
