'use client'

import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils/cn'

function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) { return <TabsPrimitive.Root data-slot="tabs" className={cn('flex flex-col gap-4', className)} {...props} /> }
function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) { return <TabsPrimitive.List data-slot="tabs-list" className={cn('inline-flex h-10 w-fit items-center justify-center rounded-xl bg-neutral-100 p-1 text-neutral-500', className)} {...props} /> }
function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) { return <TabsPrimitive.Trigger data-slot="tabs-trigger" className={cn('inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border border-transparent px-3 text-sm font-semibold whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-primary-500 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-neutral-200 data-[state=active]:bg-white data-[state=active]:text-neutral-950 data-[state=active]:shadow-sm', className)} {...props} /> }
function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) { return <TabsPrimitive.Content data-slot="tabs-content" className={cn('outline-none', className)} {...props} /> }

export { Tabs, TabsList, TabsTrigger, TabsContent }
