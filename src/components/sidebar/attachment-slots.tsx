import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface SlotProps {
  name?: string
  icon?: string
  badge?: string
  active?: boolean
  disabled?: boolean
  emptyLabel: string
  onClick: () => void
}

export function Slot({ name, icon, badge, active, disabled, emptyLabel, onClick }: SlotProps) {
  const filled = name !== undefined
  const [failed, setFailed] = useState(false)
  useEffect(() => { setFailed(false) }, [icon])
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={filled ? !!active : undefined}
      aria-label={filled ? name : emptyLabel}
      title={filled ? name : emptyLabel}
      onClick={onClick}
      className={cn(
        'relative grid aspect-square min-w-0 flex-1 place-items-center rounded-lg border outline-none transition-colors focus-visible:border-foreground/70 disabled:opacity-40',
        filled ? 'border-border bg-shade/25 hover:border-ink/25' : 'border-dashed border-ink/15 text-muted-foreground hover:border-ink/30 hover:bg-ink/4 hover:text-foreground',
        active && 'border-foreground/60 bg-ink/8 hover:border-foreground/60',
      )}
    >
      {!filled && <Plus className="size-4" />}
      {filled && (icon && !failed
        ? <img src={icon} alt="" draggable={false} onError={() => setFailed(true)} className="size-full object-contain p-1" />
        : <span className="px-1 text-[10px] leading-tight text-muted-foreground">{name.slice(0, 8)}</span>)}
      {badge && <span className="absolute bottom-0.5 right-1 font-mono text-[9px] leading-none text-muted-foreground">{badge}</span>}
    </button>
  )
}

export interface SlotSticker {
  name: string
  icon?: string
  slot: number
}

interface AttachmentSlotsProps {
  stickers: SlotSticker[]
  max: number
  charm: { name: string; icon?: string } | null
  hasCharmPoint: boolean
  focus: { kind: 'sticker'; index: number } | { kind: 'charm' } | null
  onSticker: (index: number) => void
  onAddSticker: () => void
  onCharm: () => void
}

export function AttachmentSlots({ stickers, max, charm, hasCharmPoint, focus, onSticker, onAddSticker, onCharm }: AttachmentSlotsProps) {
  return (
    <div className="flex gap-3">
      <div className="min-w-0 flex-[5]">
        <div className="mb-1.5 text-[11.5px] text-muted-foreground">Stickers</div>
        <div className="flex gap-1.5">
          {Array.from({ length: max }, (_, i) => {
            const s = stickers[i]
            return s
              ? <Slot key={i} name={s.name} icon={s.icon} badge={String(s.slot)} active={focus?.kind === 'sticker' && focus.index === i} emptyLabel="" onClick={() => onSticker(i)} />
              : <Slot key={i} emptyLabel="Add a sticker" onClick={onAddSticker} />
          })}
        </div>
      </div>
      <div className="min-w-0 flex-1 border-l border-border pl-3">
        <div className="mb-1.5 text-[11.5px] text-muted-foreground">Charm</div>
        <div className="flex">
          <Slot
            name={charm?.name}
            icon={charm?.icon}
            active={focus?.kind === 'charm'}
            disabled={!hasCharmPoint}
            emptyLabel={hasCharmPoint ? 'Add a charm' : 'No charm point on this model'}
            onClick={onCharm}
          />
        </div>
      </div>
    </div>
  )
}
