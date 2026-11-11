import { ArrowDownWideNarrow, X } from 'lucide-react'
import { SelectMenu } from '@/components/common/select-menu'
import { SwitchField } from '@/components/common/switch-field'
import { PICKER_SORTS, STICKER_KIND, type PickerSort } from '@/lib/picker'
import { getColorByRarity, rarityName } from '@/lib/rarity'
import { cn } from '@/lib/utils'

interface PickerArrangeBarProps {
  /** The line on the left ("120 items"…). */
  summary: string
  sort: PickerSort
  /** The rarities the current cards have, and the ones kept (none: all). */
  available: number[]
  rarities: number[]
  /** How this category names its rarities. */
  naming: 'skin' | 'other' | 'agent'
  /** The sticker finish filter, when browsing stickers (undefined hides it). */
  stickerKind?: string | null
  /** The "only ported" switch, when it applies (undefined hides it). */
  portedOnly?: boolean
  onSort: (sort: PickerSort) => void
  onRarities: (rarities: number[]) => void
  onStickerKind: (kind: string | null) => void
  onPortedOnly: (on: boolean) => void
}

/** Above the cards: their count, then every way to narrow or order them (finish, rarity, ported, sort). */
export function PickerArrangeBar({ summary, sort, available, rarities, naming, stickerKind, portedOnly, onSort, onRarities, onStickerKind, onPortedOnly }: PickerArrangeBarProps) {
  const toggle = (r: number) => onRarities(rarities.includes(r) ? rarities.filter((x) => x !== r) : [...rarities, r])
  return (
    <div className="flex min-h-12 shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-border px-5 py-2 text-[12px] text-muted-foreground">
      <span className="mr-auto tabular-nums">{summary}</span>
      {stickerKind !== undefined && (
        <div className="flex items-center gap-0.5 rounded-lg bg-black/25 p-0.5" role="group" aria-label="Sticker finish">
          {[null, ...Object.keys(STICKER_KIND)].map((k) => (
            <button
              key={k ?? 'all'}
              type="button"
              aria-pressed={stickerKind === k}
              onClick={() => onStickerKind(k)}
              className={cn('h-6 rounded-md px-2 text-[11.5px] font-medium transition', stickerKind === k ? 'bg-white/12 text-foreground' : 'hover:text-foreground')}
            >
              {k ? STICKER_KIND[k] : 'All'}
            </button>
          ))}
        </div>
      )}
      {available.length > 1 && (
        <div className="flex items-center gap-0.5" role="group" aria-label="Filter by rarity">
          {available.map((r) => {
            const on = rarities.includes(r)
            const color = getColorByRarity(r) ?? '#71717a'
            return (
              <button
                key={r}
                type="button"
                aria-pressed={on}
                title={rarityName(r, naming)}
                onClick={() => toggle(r)}
                className={cn('grid size-6 place-items-center rounded-md transition', on ? 'bg-white/12' : 'hover:bg-white/8', rarities.length && !on && 'opacity-40')}
              >
                <span className="size-2.5 rounded-full" style={{ background: color }} />
              </button>
            )
          })}
          {rarities.length > 0 && (
            <button type="button" aria-label="Show every rarity" title="Show every rarity" onClick={() => onRarities([])} className="grid size-6 place-items-center rounded-md hover:bg-white/8 hover:text-foreground">
              <X className="size-3.5" />
            </button>
          )}
        </div>
      )}
      {portedOnly !== undefined && <SwitchField checked={portedOnly} label="Only ported" onChange={onPortedOnly} />}
      <SelectMenu label="Sort" icon={ArrowDownWideNarrow} options={PICKER_SORTS} value={sort} onChange={onSort} />
    </div>
  )
}
