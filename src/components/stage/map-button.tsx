import { cn } from '@/lib/utils'

interface MapButtonProps {
  label: string
  thumb?: string
  active: boolean
  onClick: () => void
}

export function MapButton({ label, thumb, active, onClick }: MapButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-pressed={active}
      className={cn('flex flex-col gap-1.5 rounded-xl border p-1.5 text-left text-[12.5px] font-medium transition-colors', active ? 'border-foreground/50 bg-ink/10 text-foreground' : 'border-border text-muted-foreground hover:bg-ink/5 hover:text-foreground')}
    >
      {thumb
        ? <img src={thumb} alt="" loading="lazy" className="aspect-[2/1] w-full rounded-lg object-cover" />
        : <span className="aspect-[2/1] w-full rounded-lg bg-gradient-to-b from-secondary to-card" />}
      <span className="truncate px-1 pb-0.5">{label}</span>
    </button>
  )
}
