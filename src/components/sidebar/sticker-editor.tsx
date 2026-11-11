import { LabeledSlider } from '@/components/common/labeled-slider'
import { AttachmentHeader } from '@/components/sidebar/attachment-header'
import { Button } from '@/components/ui/button'
import { STICKER_MOVE_RANGE } from '@/lib/config'
import type { StickerOptions } from '@/lib/viewer/skin-viewer'
import { cn } from '@/lib/utils'

interface StickerEditorProps {
  sticker: StickerOptions
  name: string
  slotCount: number
  onChange: (patch: Partial<StickerOptions>) => void
  onRemove: () => void
  onReplace: () => void
}

export function StickerEditor({ sticker, name, slotCount, onChange, onRemove, onReplace }: StickerEditorProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <AttachmentHeader name={name} removeLabel="Remove sticker" onChange={onReplace} onRemove={onRemove} />
      <div className="flex items-center gap-2">
        <span className="w-14 shrink-0 text-[11px] text-muted-foreground">Position</span>
        <div className="flex gap-0.5 rounded-md bg-black/25 p-0.5">
          {Array.from({ length: slotCount }, (_, i) => (
            <button
              key={i}
              type="button"
              aria-pressed={sticker.slot === i}
              onClick={() => onChange({ slot: i })}
              className={cn('h-6 w-7 rounded font-mono text-[11.5px] transition-colors', sticker.slot === i ? 'bg-white/14 text-foreground' : 'text-muted-foreground hover:text-foreground')}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
      <LabeledSlider label="Wear" value={sticker.wear} min={0} max={1} step={0.01} format={(v) => (v * 100).toFixed(0) + '%'} onChange={(v) => onChange({ wear: v })} />
      <LabeledSlider label="Move ↔" value={sticker.offset[0]} min={-STICKER_MOVE_RANGE[0]} max={STICKER_MOVE_RANGE[0]} step={0.001} format={(v) => v.toFixed(3)} onChange={(v) => onChange({ offset: [v, sticker.offset[1]] })} />
      <LabeledSlider label="Move ↕" value={sticker.offset[1]} min={-STICKER_MOVE_RANGE[1]} max={STICKER_MOVE_RANGE[1]} step={0.001} format={(v) => v.toFixed(3)} onChange={(v) => onChange({ offset: [sticker.offset[0], v] })} />
      <LabeledSlider label="Rotate" value={sticker.rotation} min={-180} max={180} step={1} format={(v) => v.toFixed(0) + '°'} onChange={(v) => onChange({ rotation: v })} />
      <LabeledSlider label="Size" value={sticker.scale ?? 1} min={0.5} max={1.5} step={0.01} format={(v) => '×' + v.toFixed(2)} onChange={(v) => onChange({ scale: v })} />
      <Button variant="link" size="xs" className="self-start px-0" onClick={() => onChange({ offset: [0, 0], rotation: 0, scale: 1 })}>Reset placement</Button>
    </div>
  )
}
