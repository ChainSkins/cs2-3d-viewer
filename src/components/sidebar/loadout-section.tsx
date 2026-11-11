import { Crosshair, Eye, Hand } from 'lucide-react'
import { useState } from 'react'
import { ColorBarSlider } from '@/components/common/color-bar-slider'
import { NumberField } from '@/components/common/number-field'
import { Section } from '@/components/common/section'
import { SeedControl } from '@/components/common/seed-control'
import { GloveSettings } from '@/components/sidebar/glove-settings'
import { WornRow } from '@/components/sidebar/worn-row'
import { SEED_MAX } from '@/lib/config'
import type { Item } from '@/lib/data/items'
import type { Viewmodel } from '@/lib/viewer/skin-viewer'
import { bandsGradient, wearOf } from '@/lib/wear'

interface LoadoutSectionProps {
  weapon: Item | null
  weaponName: string | null
  weaponImage?: string
  weaponSeed: number
  weaponFloat: number
  glovesName: string | null
  glovesImage?: string
  viewmodel: Viewmodel
  onChooseWeapon: () => void
  onNoWeapon: () => void
  onWeaponSeed: (seed: number) => void
  onWeaponFloat: (float: number) => void
  onChooseGloves: () => void
  onAgentGloves: () => void
  onViewmodel: (changes: Partial<Viewmodel>) => void
  onFirstPerson: (() => void) | null
}

export function LoadoutSection({
  weapon, weaponName, weaponImage, weaponSeed, weaponFloat, glovesName, glovesImage, viewmodel,
  onChooseWeapon, onNoWeapon, onWeaponSeed, onWeaponFloat, onChooseGloves, onAgentGloves, onViewmodel, onFirstPerson,
}: LoadoutSectionProps) {
  const [weaponOpen, setWeaponOpen] = useState(true)
  const [glovesOpen, setGlovesOpen] = useState(true)
  const wear = wearOf(weaponFloat)
  const summary = [weaponName ? weaponName.split(' | ')[0] : 'No weapon', glovesName ? 'gloves' : null].filter(Boolean).join(' · ')

  return (
    <Section title="Loadout" collapsible={{ id: 'loadout', defaultOpen: true }} aside={<span className="section-value max-w-40 truncate">{summary}</span>}>
      <div className="flex flex-col gap-3">
        <WornRow
          kind="Weapon"
          name={weaponName}
          placeholder="No weapon"
          image={weaponImage}
          icon={Crosshair}
          clearLabel="No weapon"
          open={weapon ? weaponOpen : undefined}
          onToggle={weapon ? () => setWeaponOpen((on) => !on) : undefined}
          onChoose={onChooseWeapon}
          onClear={onNoWeapon}
        />
        {weapon && weaponOpen && (
          <div className="flex flex-col gap-2.5 rounded-lg border border-border bg-black/15 p-3">
            <div className="flex items-baseline justify-between text-[11.5px] text-muted-foreground">
              Float <span className="font-medium" style={{ color: wear.color }}>{wear.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <ColorBarSlider label="Float" value={weaponFloat} min={weapon.floatMin} max={weapon.floatMax} step={0.0001} background={bandsGradient(weapon)} onChange={onWeaponFloat} />
              <NumberField label="Float value" value={weaponFloat} min={weapon.floatMin} max={weapon.floatMax} decimals={4} className="w-[88px] shrink-0" onChange={onWeaponFloat} />
            </div>
            <div className="mt-1 text-[11.5px] text-muted-foreground">Pattern</div>
            <SeedControl label="Pattern seed" value={weaponSeed} min={1} max={SEED_MAX} onChange={onWeaponSeed} />
          </div>
        )}

        <WornRow
          kind="Gloves"
          name={glovesName}
          placeholder="The agent’s gloves"
          image={glovesImage}
          icon={Hand}
          clearLabel="The agent’s gloves"
          open={glovesName ? glovesOpen : undefined}
          onToggle={glovesName ? () => setGlovesOpen((on) => !on) : undefined}
          onChoose={onChooseGloves}
          onClear={onAgentGloves}
        />
        {glovesName && glovesOpen && <GloveSettings viewmodel={viewmodel} onViewmodel={onViewmodel} />}

        {onFirstPerson && (
          <button type="button" onClick={onFirstPerson} className="flex h-9 items-center justify-center gap-2 rounded-lg border border-border text-[13px] font-medium text-foreground/90 transition-colors hover:border-white/20 hover:bg-white/4">
            <Eye className="size-4 text-muted-foreground" /> See in first person
          </button>
        )}
      </div>
    </Section>
  )
}
