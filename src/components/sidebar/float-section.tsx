import { ColorBarSlider } from '@/components/common/color-bar-slider'
import { NumberField } from '@/components/common/number-field'
import { Section } from '@/components/common/section'
import type { Item } from '@/lib/data/items'
import { bandsGradient, wearOf } from '@/lib/wear'

interface FloatSectionProps {
  item: Item
  float: number
  onChange: (value: number) => void
}

export function FloatSection({ item, float, onChange }: FloatSectionProps) {
  const wear = wearOf(float)
  return (
    <Section title="Float" collapsible={{ id: 'float' }} aside={<span className="section-value" style={{ color: wear.color }}>{wear.name}</span>}>
      <div className="flex items-center gap-3">
        <ColorBarSlider label="Float" value={float} min={item.floatMin} max={item.floatMax} step={0.0001} background={bandsGradient(item)} onChange={onChange} />
        <NumberField label="Float value" value={float} min={item.floatMin} max={item.floatMax} decimals={4} className="w-[88px] shrink-0" onChange={onChange} />
      </div>
    </Section>
  )
}
