import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ToolButtonProps {
  icon: LucideIcon
  label: string
  pressed?: boolean
  disabled?: boolean
  iconClassName?: string
  onClick: () => void
}

export function ToolButton({ icon: Icon, label, pressed, disabled, iconClassName, onClick }: ToolButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'pointer-events-auto grid size-9 shrink-0 place-items-center rounded-lg outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/60 disabled:pointer-events-none disabled:opacity-40',
        pressed ? 'bg-ink/14 text-foreground' : 'text-muted-foreground hover:bg-ink/8 hover:text-foreground',
      )}
    >
      <Icon className={cn('size-[18px]', iconClassName)} />
    </button>
  )
}
