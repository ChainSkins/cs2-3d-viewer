import { cn } from '@/lib/utils'

interface PillSwitchProps<T extends string> {
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  label: string
  className?: string
}

/** A flat segmented choice for the stage's bars (two or three options); a click on the chosen one moves on to the next. */
export function PillSwitch<T extends string>({ options, value, onChange, label, className }: PillSwitchProps<T>) {
  const index = Math.max(0, options.findIndex((o) => o.value === value))
  const next = options[(index + 1) % options.length].value
  return (
    <div role="radiogroup" aria-label={label} className={cn('pointer-events-auto flex h-9 shrink-0 items-center gap-0.5 rounded-lg bg-black/30 p-0.5 text-[12.5px] font-medium', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value === value ? next : o.value)}
          className={cn('h-full rounded-md px-3 transition-colors', o.value === value ? 'bg-white/12 text-foreground' : 'text-muted-foreground hover:text-foreground')}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
