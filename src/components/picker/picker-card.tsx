import { Check } from 'lucide-react'
import type { CSSProperties } from 'react'
import { ItemImage } from '@/components/common/item-image'
import type { PickerCard as Card } from '@/lib/picker'
import { GRID_ITEM } from '@/lib/grid-focus'
import { cn } from '@/lib/utils'

interface PickerCardProps {
  /** What the card shows (a catalog card, or anything shaped like one: `ported` false dims it). */
  card: Pick<Card, 'title' | 'subtitle' | 'color' | 'icon'> & { ported?: boolean }
  current: boolean
  onPick: () => void
}

/** A picker card: a flat tile with the market icon over its rarity glow, the name and subtitle, and a line of its rarity along the foot. */
export function PickerCard({ card, current, onPick }: PickerCardProps) {
  return (
    <button
      type="button"
      {...{ [GRID_ITEM]: '' }}
      style={{ '--rarity': card.color } as CSSProperties}
      className={cn(
        // No backdrop-filter or shadows: there can be hundreds of these on screen.
        'group/card relative flex flex-col overflow-hidden rounded-xl border border-border bg-white/[0.03] text-left outline-none transition-colors',
        'hover:border-[color-mix(in_oklch,var(--rarity),transparent_50%)] hover:bg-white/[0.06]',
        'focus-visible:border-foreground/70 focus-visible:bg-white/[0.06]',
        current && 'border-foreground/60 bg-white/[0.06]',
        card.ported === false && 'opacity-55',
      )}
      onClick={onPick}
    >
      <ItemImage
        src={card.icon}
        color={card.color}
        lazy
        className="aspect-[4/3] w-full rounded-none p-2"
        imageClassName="transition-transform duration-200 group-hover/card:scale-108"
      />
      {current && (
        <span className="absolute right-2 top-2 grid size-5 place-items-center rounded-full bg-foreground text-background" title="Shown now"><Check className="size-3" strokeWidth={3} /></span>
      )}
      <span className="block border-t border-border px-3 pb-2.5 pt-2">
        <span className="block truncate text-[13px] font-medium" title={card.title}>{card.title}</span>
        <span className="block truncate text-[11.5px] text-muted-foreground">{card.subtitle}</span>
      </span>
      <span aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 opacity-70 transition-opacity group-hover/card:opacity-100" style={{ background: card.color }} />
    </button>
  )
}
