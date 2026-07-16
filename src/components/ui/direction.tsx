'use client'

import { DirectionProvider as RadixDirectionProvider } from '@radix-ui/react-direction'

export function DirectionProvider({ children, direction = 'rtl' }: { children: React.ReactNode; direction?: 'ltr' | 'rtl' }) {
  return <RadixDirectionProvider dir={direction}>{children}</RadixDirectionProvider>
}
