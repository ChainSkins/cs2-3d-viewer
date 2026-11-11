import { LabeledSlider } from '@/components/common/labeled-slider'
import { CharmSeedControl } from '@/components/common/charm-seed-control'
import { PickerField } from '@/components/common/picker-field'
import { AttachmentHeader } from '@/components/sidebar/attachment-header'
import { Button } from '@/components/ui/button'
import { CHARM_MOVE_RANGE } from '@/lib/config'
import type { CharmDef } from '@/lib/data/attachments'
import type { CharmState } from '@/hooks/use-viewer-state'

interface CharmEditorProps {
  charm: CharmState
  isSlab: boolean
  charmDef: CharmDef | undefined
  charmName: string
  stickerName: string
  onChange: (changes: Partial<CharmState>) => void
  onChoose: () => void
  onChooseSticker: () => void
}

export function CharmEditor({ charm, isSlab, charmDef, charmName, stickerName, onChange, onChoose, onChooseSticker }: CharmEditorProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <AttachmentHeader name={charmName} removeLabel="Remove charm" onChange={onChoose} onRemove={() => onChange({ id: null })} />
      {isSlab && (
        <PickerField label="Sticker" value={charm.sticker ? stickerName : null} clearLabel="Remove slab sticker" onChoose={onChooseSticker} onClear={() => onChange({ sticker: null })} />
      )}
      <CharmSeedControl charm={charmDef} seed={charm.seed} onChange={(seed) => onChange({ seed })} />
      <LabeledSlider label="Along" value={charm.offset[0]} min={-CHARM_MOVE_RANGE[0]} max={CHARM_MOVE_RANGE[0]} step={0.05} format={(v) => v.toFixed(2) + '″'} onChange={(v) => onChange({ offset: [v, charm.offset[1]] })} />
      <LabeledSlider label="Height" value={charm.offset[1]} min={-CHARM_MOVE_RANGE[1]} max={CHARM_MOVE_RANGE[1]} step={0.05} format={(v) => v.toFixed(2) + '″'} onChange={(v) => onChange({ offset: [charm.offset[0], v] })} />
      <Button variant="link" size="xs" className="self-start px-0" onClick={() => onChange({ offset: [0, 0], position: null })}>Reset placement</Button>
    </div>
  )
}
