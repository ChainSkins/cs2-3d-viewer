import { ChevronDown, Hand, RotateCcw, UserRound } from 'lucide-react'
import { useState } from 'react'
import { FieldRow } from '@/components/common/field-row'
import { LabeledSlider } from '@/components/common/labeled-slider'
import { Section } from '@/components/common/section'
import { Segments } from '@/components/common/segments'
import { SwitchField } from '@/components/common/switch-field'
import { GloveSettings } from '@/components/sidebar/glove-settings'
import { WornRow } from '@/components/sidebar/worn-row'
import { useLocalStorage } from '@/hooks/common/use-local-storage'
import { cn } from '@/lib/utils'
import { DEFAULT_VIEWMODEL, type Viewmodel } from '@/lib/viewer/viewer-options'

interface FirstPersonSectionProps {
  agentName: string | null
  agentImage?: string
  glovesName: string | null
  glovesImage?: string
  viewmodel: Viewmodel
  onViewmodel: (changes: Partial<Viewmodel>) => void
  onChooseAgent: () => void
  onDefaultAgent: () => void
  onChooseGloves: () => void
  onBareArms: () => void
}

type Placement = Pick<Viewmodel, 'fov' | 'offsetX' | 'offsetY' | 'offsetZ'>

const PRESETS: { value: string; label: string; placement: Placement }[] = [
  { value: 'desktop', label: 'Desktop', placement: { fov: 60, offsetX: 1, offsetY: 1, offsetZ: -1 } },
  { value: 'couch', label: 'Couch', placement: { fov: 54, offsetX: 0, offsetY: 0, offsetZ: -1.5 } },
  { value: 'classic', label: 'Classic', placement: { fov: 68, offsetX: 2.5, offsetY: 0, offsetZ: -1.5 } },
]

export function FirstPersonSection({ agentName, agentImage, glovesName, glovesImage, viewmodel, onViewmodel, onChooseAgent, onDefaultAgent, onChooseGloves, onBareArms }: FirstPersonSectionProps) {
  const [glovesOpen, setGlovesOpen] = useState(true)
  const [tuning, setTuning] = useLocalStorage('section:viewmodel', false)
  const preset = PRESETS.find(({ placement: p }) => p.fov === viewmodel.fov && p.offsetX === viewmodel.offsetX && p.offsetY === viewmodel.offsetY && p.offsetZ === viewmodel.offsetZ)
  const isDefault = preset?.value === 'classic' && !viewmodel.leftHanded && viewmodel.sway === DEFAULT_VIEWMODEL.sway
  const resetViewmodel = () => onViewmodel({
    fov: DEFAULT_VIEWMODEL.fov, offsetX: DEFAULT_VIEWMODEL.offsetX, offsetY: DEFAULT_VIEWMODEL.offsetY, offsetZ: DEFAULT_VIEWMODEL.offsetZ, leftHanded: false, sway: DEFAULT_VIEWMODEL.sway,
  })

  return (
    <Section
      title="First person"
      collapsible={{ id: 'first-person', defaultOpen: true }}
      aside={<span className="section-value max-w-40 truncate">{agentName?.split(' | ')[0] ?? 'Default agent'} · FOV {viewmodel.fov}</span>}
    >
      <div className="flex flex-col gap-3">
        <WornRow kind="Agent" name={agentName} placeholder="Default CT agent" image={agentImage} icon={UserRound} clearLabel="Default agent" onChoose={onChooseAgent} onClear={onDefaultAgent} />
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
          onClear={onBareArms}
        />
        {glovesName && glovesOpen && <GloveSettings viewmodel={viewmodel} onViewmodel={onViewmodel} />}

        <div className="border-t border-border pt-2.5">
          <div className="flex items-center gap-2">
            <button type="button" aria-expanded={tuning} onClick={() => setTuning(!tuning)} className="flex min-h-7 flex-1 items-center gap-2 text-left">
              <span className="text-[12.5px] font-medium">Viewmodel</span>
            </button>
            <span className="section-value">{preset?.label ?? 'Custom'}{viewmodel.leftHanded ? ' · left hand' : ''}</span>
            <button type="button" aria-label="Reset viewmodel" title="Reset viewmodel" disabled={isDefault} onClick={resetViewmodel} className="grid size-6 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-white/6 hover:text-foreground disabled:pointer-events-none disabled:opacity-35">
              <RotateCcw className="size-3.5" />
            </button>
            <button type="button" tabIndex={-1} aria-hidden onClick={() => setTuning(!tuning)} className="-mr-1 grid size-6 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-white/6 hover:text-foreground">
              <ChevronDown className={cn('size-4 transition-transform duration-200', tuning && 'rotate-180')} />
            </button>
          </div>
          {tuning && (
            <div className="mt-2.5 flex flex-col gap-2.5">
              <Segments label="Viewmodel preset" options={PRESETS} value={preset?.value ?? null} onChange={(v) => onViewmodel(PRESETS.find((p) => p.value === v)!.placement)} />
              <LabeledSlider label="FOV" value={viewmodel.fov} min={54} max={68} step={1} format={(v) => v.toFixed(0)} onChange={(fov) => onViewmodel({ fov })} />
              <LabeledSlider label="Side ↔" value={viewmodel.offsetX} min={-2} max={2.5} step={0.1} format={(v) => v.toFixed(1)} onChange={(offsetX) => onViewmodel({ offsetX })} />
              <LabeledSlider label="Depth" value={viewmodel.offsetY} min={-2} max={2} step={0.1} format={(v) => v.toFixed(1)} onChange={(offsetY) => onViewmodel({ offsetY })} />
              <LabeledSlider label="Height ↕" value={viewmodel.offsetZ} min={-2} max={2} step={0.1} format={(v) => v.toFixed(1)} onChange={(offsetZ) => onViewmodel({ offsetZ })} />
              <FieldRow label="Hand">
                <Segments label="Hand" className="flex-1" options={[{ value: 'right', label: 'Right' }, { value: 'left', label: 'Left' }]} value={viewmodel.leftHanded ? 'left' : 'right'} onChange={(v) => onViewmodel({ leftHanded: v === 'left' })} />
              </FieldRow>
              <SwitchField checked={viewmodel.sway} label="Weapon sway" onChange={(sway) => onViewmodel({ sway })} />
            </div>
          )}
        </div>
      </div>
    </Section>
  )
}
