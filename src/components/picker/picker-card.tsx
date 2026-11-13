import { Check, Star } from 'lucide-react'
import type { CSSProperties } from 'react'
import { ItemImage } from '@/components/common/item-image'
import type { PickerCard as Card } from '@/lib/picker'
import { GRID_ITEM } from '@/lib/grid-focus'
import { cn } from '@/lib/utils'

interface PickerCardProps {
  /** extras: small pictures over the image (what a dressed weapon carries). */
  card: Pick<Card, 'title' | 'subtitle' | 'color' | 'icon'> & { ported?: boolean; extras?: string[] }
  current: boolean
  onPick: () => void
  favorite?: boolean
  onFavorite?: () => void
}

export function PickerCard({ card, current, onPick, favorite, onFavorite }: PickerCardProps) {
  return (
    <div className="group/card relative">
      <button
        type="button"
        {...{ [GRID_ITEM]: '' }}
        style={{ '--rarity': card.color } as CSSProperties}
        className={cn(
          // No backdrop-filter or shadows: there can be hundreds of these on screen.
          'relative flex w-full flex-col overflow-hidden rounded-xl border border-border bg-ink/[0.03] text-left outline-none transition-colors',
          'hover:border-[color-mix(in_oklch,var(--rarity),transparent_50%)] hover:bg-ink/[0.06]',
          'focus-visible:border-foreground/70 focus-visible:bg-ink/[0.06]',
          current && 'border-foreground/60 bg-ink/[0.06]',
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
        {!!card.extras?.length && (
          <span className="absolute bottom-[calc(theme(spacing.14)+2px)] right-2 flex -space-x-1.5">
            {card.extras.map((src, i) => (
              <img key={i} src={src} alt="" loading="lazy" className="size-7 rounded-md border border-border bg-background/80 object-contain p-0.5" />
            ))}
          </span>
        )}
        {current && (
          <span className="absolute right-2 top-2 grid size-5 place-items-center rounded-full bg-foreground text-background" title="Shown now"><Check className="size-3" strokeWidth={3} /></span>
        )}
        <span className="block border-t border-border px-3 pb-2.5 pt-2">
          <span className="block truncate text-[13px] font-medium" title={card.title}>{card.title}</span>
          <span className="block truncate text-[11.5px] text-muted-foreground">{card.subtitle}</span>
        </span>
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 opacity-70 transition-opacity group-hover/card:opacity-100" style={{ background: card.color }} />
      </button>
      {onFavorite && (
        <button
          type="button"
          tabIndex={-1}
          aria-label={favorite ? `Remove ${card.title} from favorites` : `Add ${card.title} to favorites`}
          aria-pressed={favorite}
          title={favorite ? 'Remove from favorites' : 'Add to favorites'}
          onClick={onFavorite}
          className={cn(
            'absolute left-1.5 top-1.5 grid size-7 place-items-center rounded-lg transition',
            favorite ? 'text-amber-400 opacity-100' : 'text-muted-foreground opacity-0 hover:bg-ink/8 hover:text-foreground group-hover/card:opacity-100 group-focus-within/card:opacity-100 pointer-coarse:opacity-70',
          )}
        >
          <Star className="size-4" fill={favorite ? 'currentColor' : 'none'} />
        </button>
      )}
    </div>
  )
}
