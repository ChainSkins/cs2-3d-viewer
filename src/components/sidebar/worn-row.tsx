import { X, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WornRowProps {
  kind: string
  name: string | null
  placeholder: string
  image?: string
  icon: LucideIcon
  clearLabel: string
  open?: boolean
  onToggle?: () => void
  onChoose: () => void
  onClear: () => void
}

export function WornRow({ kind, name, placeholder, image, icon: Icon, clearLabel, open, onToggle, onChoose, onClear }: WornRowProps) {
  const body = (
    <>
      <span className={cn('grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg border bg-shade/25 transition-colors', open ? 'border-foreground/60' : 'border-border')}>
        {image ? <img src={image} alt="" draggable={false} className="size-full object-contain p-0.5" /> : <Icon className="size-[18px] text-muted-foreground" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11.5px] text-muted-foreground">{kind}</span>
        <span className={cn('block truncate text-[13px] font-medium', !name && 'text-foreground/70')} title={name ?? placeholder}>{name ?? placeholder}</span>
      </span>
    </>
  )
  return (
    <div className="flex items-center gap-1.5">
      {onToggle
        ? <button type="button" aria-expanded={open} title={open ? 'Hide its settings' : 'Show its settings'} onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/60">{body}</button>
        : <div className="flex min-w-0 flex-1 items-center gap-3">{body}</div>}
      <button type="button" onClick={onChoose} className="h-7 shrink-0 rounded-md border border-border px-2 text-[12px] font-medium text-muted-foreground transition-colors hover:border-ink/20 hover:text-foreground">Change</button>
      {name && (
        <button type="button" aria-label={clearLabel} title={clearLabel} onClick={onClear} className="grid size-7 shrink-0 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:border-ink/20 hover:text-foreground">
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}
