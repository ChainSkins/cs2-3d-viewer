import { cn } from '@/lib/utils'

interface SegmentedControlProps<T extends string | number> {
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  className?: string
}

export function SegmentedControl<T extends string | number>({ options, value, onChange, className }: SegmentedControlProps<T>) {
  return (
    <div className={cn('flex gap-0.5 rounded-lg bg-black/25 p-0.5', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn('h-7 flex-1 rounded-md px-2.5 text-[12px] font-medium transition-colors', o.value === value ? 'bg-white/12 text-foreground' : 'text-muted-foreground hover:text-foreground')}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
