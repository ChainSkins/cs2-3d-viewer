import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd className={cn('pointer-events-none inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-[5px] bg-ink/12 px-1 font-sans text-[10px] font-medium leading-none tracking-normal text-current opacity-80 ring-1 ring-ink/15', className)}>
      {children}
    </kbd>
  )
}
