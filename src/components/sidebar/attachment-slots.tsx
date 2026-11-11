import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SlotProps {
  /** What it holds (none: an empty slot). */
  name?: string
  icon?: string
  /** A small mark in its corner (a sticker's position on the weapon). */
  badge?: string
  active?: boolean
  disabled?: boolean
  /** The empty slot's accessible name and tooltip. */
  emptyLabel: string
  onClick: () => void
}

/** One slot: the picture of what it holds, or a plus to fill it. */
function Slot({ name, icon, badge, active, disabled, emptyLabel, onClick }: SlotProps) {
  const filled = name !== undefined
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
        filled ? 'border-border bg-black/25 hover:border-white/25' : 'border-dashed border-white/15 text-muted-foreground hover:border-white/30 hover:bg-white/4 hover:text-foreground',
        active && 'border-foreground/60 bg-white/8 hover:border-foreground/60',
      )}
    >
      {!filled && <Plus className="size-4" />}
      {filled && (icon
        ? <img src={icon} alt="" draggable={false} className="size-full object-contain p-1" />
        : <span className="px-1 text-[10px] leading-tight text-muted-foreground">{name.slice(0, 8)}</span>)}
      {badge && <span className="absolute bottom-0.5 right-1 font-mono text-[9px] leading-none text-muted-foreground">{badge}</span>}
    </button>
  )
}

export interface SlotSticker {
  name: string
  icon?: string
  /** Its position on the weapon, 1-based. */
  slot: number
}

interface AttachmentSlotsProps {
  stickers: SlotSticker[]
  /** How many stickers a weapon takes. */
  max: number
  /** The charm it wears (null: none). */
  charm: { name: string; icon?: string } | null
  hasCharmPoint: boolean
  /** What the controls below edit. */
  focus: { kind: 'sticker'; index: number } | { kind: 'charm' } | null
  onSticker: (index: number) => void
  onAddSticker: () => void
  onCharm: () => void
}

/** What the weapon wears, at a glance: a slot per sticker it can take, then its charm. A filled slot selects it, an empty one opens the picker. */
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
