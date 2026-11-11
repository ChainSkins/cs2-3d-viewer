import { Dices } from 'lucide-react'
import { ColorBarSlider } from '@/components/common/color-bar-slider'
import { DraftSlider } from '@/components/common/draft-slider'
import { NumberField } from '@/components/common/number-field'
import { cn } from '@/lib/utils'

interface SeedControlProps {
  label: string
  value: number
  min: number
  max: number
  background?: string
  fieldClassName?: string
  onChange: (value: number) => void
}

export function SeedControl({ label, value, min, max, background, fieldClassName, onChange }: SeedControlProps) {
  const set = (v: number) => onChange(Math.max(min, Math.min(max, Math.round(v) || min)))
  return (
    <div className="flex items-center gap-3">
      {background
        ? <ColorBarSlider label={label} value={value} min={min} max={max} step={1} background={background} onChange={set} />
        : <DraftSlider label={label} value={value} min={min} max={max} step={1} onChange={set} />}
      <div className="flex h-8 shrink-0 items-center rounded-md border border-border bg-black/25 transition-colors focus-within:border-white/25">
        <NumberField label={`${label} value`} value={value} min={min} max={max} className={cn('h-full w-14 border-0 bg-transparent pr-1 focus-visible:ring-0', fieldClassName)} onChange={set} />
        <button
          type="button"
          aria-label={`Random ${label.toLowerCase()}`}
          title={`Random ${label.toLowerCase()}`}
          onClick={() => set(min + Math.floor(Math.random() * (max - min + 1)))}
          className="grid h-full w-8 place-items-center rounded-r-md border-l border-border text-muted-foreground transition-colors hover:bg-white/6 hover:text-foreground"
        >
          <Dices className="size-4" />
        </button>
      </div>
    </div>
  )
}
