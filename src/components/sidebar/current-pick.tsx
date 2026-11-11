import { ItemImage } from '@/components/common/item-image'
import { Kbd } from '@/components/common/kbd'
import { MOD_KEY } from '@/lib/keys'

interface CurrentPickProps {
  over: string
  title: string
  color: string
  /** Its market image (an icon stands in without one). */
  icon?: string
  onClick: () => void
}

/** The current selection, as the panel's first row: its picture over a line of its rarity, its name, and the way to change it. */
export function CurrentPick({ over, title, color, icon, onClick }: CurrentPickProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={`Change (/ or ${MOD_KEY}+K)`}
      className="group flex shrink-0 items-center gap-3 border-b border-border px-4 py-3 text-left transition-colors hover:bg-white/[0.03]"
    >
      <span className="relative shrink-0 overflow-hidden rounded-lg border border-border bg-black/20">
        <ItemImage src={icon} color={color} className="h-11 w-[60px] rounded-none p-1" imageClassName="transition-transform duration-200 group-hover:scale-108" />
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-0.5" style={{ background: color }} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12px] text-muted-foreground">{over}</span>
        <span className="block truncate text-[14px] font-medium">{title}</span>
      </span>
      <span className="flex shrink-0 items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[12px] font-medium text-muted-foreground transition-colors group-hover:border-white/20 group-hover:text-foreground">
        Change <Kbd className="hidden sm:inline-flex">{MOD_KEY} K</Kbd>
      </span>
    </button>
  )
}
