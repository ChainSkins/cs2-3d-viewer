import { DraftSlider } from '@/components/common/draft-slider'
import { NumberField } from '@/components/common/number-field'
import { SeedControl } from '@/components/common/seed-control'
import { SEED_MAX } from '@/lib/config'
import type { Viewmodel } from '@/lib/viewer/viewer-options'
import { clampSeed, wearOf } from '@/lib/wear'

interface GloveSettingsProps {
  viewmodel: Viewmodel
  onViewmodel: (changes: Partial<Viewmodel>) => void
}

export function GloveSettings({ viewmodel, onViewmodel }: GloveSettingsProps) {
  const wear = wearOf(viewmodel.gloveFloat)
  return (
    <div className="flex flex-col gap-2.5 rounded-lg border border-border bg-black/15 p-3">
      <div className="flex items-baseline justify-between text-[11.5px] text-muted-foreground">
        Glove float <span className="font-medium" style={{ color: wear.color }}>{wear.name}</span>
      </div>
      <div className="flex items-center gap-3">
        <DraftSlider label="Glove float" value={viewmodel.gloveFloat} min={0} max={1} step={0.001} onChange={(gloveFloat) => onViewmodel({ gloveFloat })} />
        <NumberField label="Glove float value" value={viewmodel.gloveFloat} min={0} max={1} decimals={4} className="w-[88px] shrink-0" onChange={(gloveFloat) => onViewmodel({ gloveFloat })} />
      </div>
      <div className="mt-1 flex items-baseline justify-between text-[11.5px] text-muted-foreground">
        Glove pattern
        {viewmodel.gloveSeed === null
          ? <span>The gloves’ own</span>
          : <button type="button" onClick={() => onViewmodel({ gloveSeed: null })} className="underline decoration-white/25 underline-offset-2 transition-colors hover:text-foreground">Use the gloves’ own</button>}
      </div>
      <SeedControl label="Glove pattern" value={viewmodel.gloveSeed ?? 1} min={1} max={SEED_MAX} onChange={(v) => onViewmodel({ gloveSeed: clampSeed(v) })} />
    </div>
  )
}
