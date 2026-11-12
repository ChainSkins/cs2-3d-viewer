import { cn } from '@/lib/utils'

interface SegmentsProps<T extends string> {
  label: string
  options: { value: T; label: string }[]
  value: T | null
  onChange: (value: T) => void
  className?: string
}

export function Segments<T extends string>({ label, options, value, onChange, className }: SegmentsProps<T>) {
  return (
    <div role="group" aria-label={label} className={cn('flex gap-0.5 rounded-lg bg-shade/25 p-0.5', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn('h-7 flex-1 rounded-md px-2 text-[12px] font-medium transition-colors', o.value === value ? 'bg-ink/12 text-foreground' : 'text-muted-foreground hover:text-foreground')}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
