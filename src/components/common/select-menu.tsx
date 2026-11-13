import type { LucideIcon } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'

interface SelectMenuProps<T extends string> {
  label: string
  icon?: LucideIcon
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  align?: 'left' | 'right'
}

export function SelectMenu<T extends string>({ label, icon: Icon, options, value, onChange, align = 'right' }: SelectMenuProps<T>) {
  const current = options.find((o) => o.value === value) ?? options[0]
  return (
    <Select<T> value={value} onValueChange={(next) => { if (next !== null) onChange(next) }}>
      <SelectTrigger
        aria-label={`${label}: ${current.label}`}
        className="h-7 gap-1.5 border-0 bg-transparent px-2.5 text-[11.5px] text-foreground/90 hover:bg-ink/6 data-popup-open:bg-ink/10 dark:bg-transparent dark:hover:bg-ink/6 [&_svg]:size-3.5"
      >
        {Icon && <Icon className="text-muted-foreground" />}
        <span className="text-muted-foreground">{label}:</span> {current.label}
      </SelectTrigger>
      <SelectContent
        alignItemWithTrigger={false}
        align={align === 'right' ? 'end' : 'start'}
        sideOffset={6}
        className="glass-strong w-auto min-w-48 max-h-72 rounded-xl p-1 shadow-[0_18px_40px_-12px_oklch(0_0_0/80%)] ring-0"
      >
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} className="rounded-lg py-1.5 pl-2.5 text-[12px] text-foreground/80 focus:bg-ink/10 focus:text-foreground">
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
