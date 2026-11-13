import { DraftSlider } from '@/components/common/draft-slider'
import { FieldRow } from '@/components/common/field-row'

interface LabeledSliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  format: (value: number) => string
  onChange: (value: number) => void
}

export function LabeledSlider({ label, ...slider }: LabeledSliderProps) {
  return (
    <FieldRow label={label}>
      <DraftSlider label={label} {...slider} />
    </FieldRow>
  )
}
