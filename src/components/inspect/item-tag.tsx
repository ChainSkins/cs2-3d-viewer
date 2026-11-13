import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ItemTagProps {
  className?: string
  style?: CSSProperties
  children: ReactNode
}

export function ItemTag({ className, style, children }: ItemTagProps) {
  return <span className={cn('rounded-md px-1.5 py-0.5 text-[11px] font-medium', className)} style={style}>{children}</span>
}
