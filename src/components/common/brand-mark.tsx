import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface BrandMarkProps {
  compact?: boolean
  className?: string
}

export function BrandMark({ compact, className }: BrandMarkProps) {
  return (
    <Link to="/" title="chainskins 3D" className={cn('flex min-w-0 items-center gap-2 rounded-lg py-1 transition-opacity hover:opacity-85', className)}>
      <img src="/logo/favicon.svg" alt="" className="size-6 shrink-0" />
      <span className={cn('truncate text-[13.5px] font-medium tracking-tight', compact && 'lg:hidden')}>chainskins</span>
      <span className={cn('rounded-md bg-white/[0.07] px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground', compact && 'lg:hidden')}>3D</span>
    </Link>
  )
}
