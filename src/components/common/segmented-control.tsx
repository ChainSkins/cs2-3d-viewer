import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'

interface SegmentedControlProps<T extends string | number> {
  options: { value: T; label: string }[]
  value: T | null
  onChange: (value: T) => void
  label?: string
  size?: 'default' | 'pill'
  className?: string
}

export function SegmentedControl<T extends string | number>({ options, value, onChange, label, size = 'default', className }: SegmentedControlProps<T>) {
  const pill = size === 'pill'
  const index = options.findIndex((o) => o.value === value)
  const choose = (next: readonly string[]) => {
    const picked = options.find((o) => String(o.value) === next[0])
    if (picked) onChange(picked.value)
    else if (pill && options.length) onChange(options[(index + 1) % options.length].value)
  }

  return (
    <ToggleGroup
      aria-label={label}
      spacing={0.5}
      value={value === null ? [] : [String(value)]}
      onValueChange={choose}
      className={cn('w-full p-0.5', pill ? 'pointer-events-auto h-9 w-auto shrink-0 bg-shade/30' : 'bg-shade/25', className)}
    >
      {options.map((o) => (
        <ToggleGroupItem
          key={o.value}
          value={String(o.value)}
          className={cn(
            'rounded-md font-medium text-muted-foreground hover:bg-transparent hover:text-foreground aria-pressed:bg-ink/12 aria-pressed:text-foreground',
            pill ? 'h-full px-3 text-[12.5px]' : 'h-7 min-w-0 flex-1 px-2.5 text-[12px]',
          )}
        >
          {o.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
