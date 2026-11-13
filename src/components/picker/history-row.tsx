import { Link2, X } from 'lucide-react'
import { ItemImage } from '@/components/common/item-image'
import { ItemTag } from '@/components/inspect/item-tag'
import type { InspectPreview } from '@/lib/inspect-preview'
import { timeAgo } from '@/lib/time'

interface HistoryRowProps {
  preview: InspectPreview
  at: number
  onLoad: () => void
  onRemove: () => void
}

export function HistoryRow({ preview, at, onLoad, onRemove }: HistoryRowProps) {
  const facts: [string, string, string?][] = preview.kind === 'skin'
    ? [['Float', preview.float.toFixed(6)], ['Wear', preview.wear.name, preview.wear.color], ['Pattern', `#${preview.seed}`]]
    : [['Type', preview.weapon], ...(preview.charm && preview.kind === 'charm' ? [['Pattern', `#${preview.charm.pattern}`] as [string, string]] : [])]
  const attachments = preview.kind === 'charm' ? [] : preview.stickers

  return (
    <div className="group/row relative">
      <button
        type="button"
        onClick={onLoad}
        className="tile flex w-full items-center gap-3 p-2.5 pr-10 text-left transition-colors hover:border-ink/20 hover:bg-ink/[0.06] sm:gap-4 sm:pr-12"
      >
        <ItemImage src={preview.image} color={preview.color} className="h-16 w-20 shrink-0 rounded-lg sm:h-20 sm:w-28" imageClassName="transition-transform duration-200 group-hover/row:scale-110" />

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          {/* The tags drop below the name when they don't fit beside it (a phone). */}
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <span className="flex min-w-0 max-w-full items-center gap-2">
              <span className="h-4 w-0.5 shrink-0 rounded-full" style={{ background: preview.color }} />
              <span className="truncate text-[14px] font-medium" title={preview.title}>{preview.title}</span>
            </span>
            {preview.statTrak !== null && <ItemTag className="shrink-0 bg-orange-500/15 text-orange-300">StatTrak™</ItemTag>}
            {preview.souvenir && <ItemTag className="shrink-0 bg-yellow-500/15 text-yellow-300">Souvenir</ItemTag>}
            {preview.rarityLabel && <ItemTag className="shrink-0" style={{ color: preview.color, background: `${preview.color}22` }}>{preview.rarityLabel}</ItemTag>}
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[12px] sm:gap-x-5">
            {facts.map(([label, value, color]) => (
              <span key={label} className="flex items-baseline gap-1.5">
                <span className="text-[11px] text-muted-foreground">{label}</span>
                <span className="whitespace-nowrap font-mono tabular-nums" style={color ? { color } : undefined}>{value}</span>
              </span>
            ))}
            {preview.nameTag && <span className="max-w-full truncate italic text-muted-foreground">“{preview.nameTag}”</span>}
          </div>

          {(attachments.length > 0 || (preview.charm && preview.kind === 'skin')) && (
            <div className="flex flex-wrap items-center gap-1.5">
              {attachments.map((s) => (
                <span key={s.slot} title={s.name}>
                  <ItemImage src={s.image} color={preview.color} className="size-7 rounded-md bg-shade/20 sm:size-8" lazy />
                </span>
              ))}
              {preview.charm && preview.kind === 'skin' && (
                <span className="flex items-center gap-1 rounded-md bg-shade/20 pr-2 text-[11px] text-muted-foreground sm:ml-1" title={preview.charm.name}>
                  <ItemImage src={preview.charm.image} color={preview.color} fallback={Link2} className="size-7 rounded-md sm:size-8" lazy />
                  #{preview.charm.pattern}
                </span>
              )}
            </div>
          )}
          <span className="text-[11px] text-muted-foreground sm:hidden">{timeAgo(at)}</span>
        </div>

        <span className="hidden shrink-0 self-start pt-0.5 text-[11px] text-muted-foreground sm:block">{timeAgo(at)}</span>
      </button>
      <button
        type="button"
        aria-label="Remove from history"
        title="Remove from history"
        onClick={onRemove}
        className="absolute right-2 top-2 grid size-7 place-items-center rounded-md text-muted-foreground opacity-0 transition hover:bg-ink/10 hover:text-foreground focus-visible:opacity-100 group-hover/row:opacity-100 pointer-coarse:opacity-100 sm:right-2.5 sm:top-1/2 sm:-translate-y-1/2"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}
