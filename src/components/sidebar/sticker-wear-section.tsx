import { LabeledSlider } from '@/components/common/labeled-slider'
import { Section } from '@/components/common/section'
import { SwitchField } from '@/components/common/switch-field'
import { SegmentedControl } from '@/components/common/segmented-control'

interface StickerWearSectionProps {
  wear: number
  onChange: (wear: number) => void
}

const PRESETS = [0, 0.25, 0.5, 0.8]

export function StickerWearSection({ wear, onChange }: StickerWearSectionProps) {
  return (
    <Section title="Sticker wear" collapsible={{ id: 'sticker-wear' }} aside={<span className="section-value font-mono">{(wear * 100).toFixed(0)}%</span>}>
      <LabeledSlider label="Wear" value={wear} min={0} max={1} step={0.01} format={(v) => v.toFixed(2)} onChange={onChange} />
      <SegmentedControl
        label="Wear preset"
        className="mt-3"
        options={PRESETS.map((w) => ({ value: String(w), label: w === 0 ? 'Pristine' : w * 100 + '%' }))}
        value={PRESETS.includes(wear) ? String(wear) : null}
        onChange={(v) => onChange(Number(v))}
      />
    </Section>
  )
}

export function StickerCardSection({ card, onCard }: { card: boolean; onCard: (on: boolean) => void }) {
  return (
    <Section title="Card" collapsible={{ id: 'sticker-card' }}>
      <SwitchField checked={card} label="Show on the inspect card" onChange={onCard} />
    </Section>
  )
}
