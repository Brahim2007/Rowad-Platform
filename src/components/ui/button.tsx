import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'

const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-[color,background-color,border-color,box-shadow,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary-600 text-white shadow-sm hover:bg-primary-700 hover:shadow-md active:translate-y-px',
        secondary: 'bg-secondary-500 text-white shadow-sm hover:bg-secondary-600 hover:shadow-md active:translate-y-px',
        outline: 'border border-neutral-200 bg-white text-neutral-800 shadow-sm hover:border-primary-300 hover:bg-primary-50 hover:text-primary-800',
        ghost: 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950',
        subtle: 'bg-primary-50 text-primary-800 hover:bg-primary-100',
        destructive: 'bg-error-500 text-white shadow-sm hover:bg-error-700',
        glass: 'border border-white/20 bg-white/10 text-white shadow-sm backdrop-blur-md hover:bg-white/20',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-lg px-3 text-xs',
        lg: 'h-12 px-6 text-base',
        icon: 'size-10 p-0',
        'icon-sm': 'size-8 rounded-lg p-0',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

function Button({ className, variant, size, asChild = false, unstyled = false, ...props }: React.ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean; unstyled?: boolean }) {
  const Comp = asChild ? Slot : 'button'
  return <Comp data-slot="button" className={unstyled ? className : cn(buttonVariants({ variant, size }), className)} {...props} />
}

export { Button, buttonVariants }
