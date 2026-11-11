import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ToolButtonProps {
  icon: LucideIcon
  label: string
  /** A toggle: lit while on. */
  pressed?: boolean
  disabled?: boolean
  iconClassName?: string
  onClick: () => void
}

/** A flat icon button of the stage's bars; with `pressed` it is a toggle, lit while on. */
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
        pressed ? 'bg-white/14 text-foreground' : 'text-muted-foreground hover:bg-white/8 hover:text-foreground',
      )}
    >
      <Icon className={cn('size-[18px]', iconClassName)} />
    </button>
  )
}
