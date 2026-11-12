import { useState } from 'react'
import { LabeledSlider } from '@/components/common/labeled-slider'
import { Section } from '@/components/common/section'
import { AttachmentHeader } from '@/components/sidebar/attachment-header'
import { Slot } from '@/components/sidebar/attachment-slots'
import { useDb } from '@/context/db-context'
import type { PatchIndex } from '@/lib/data/patches'
import { PATCH_SLOTS } from '@/lib/url-state'
import type { AgentPatch } from '@/lib/viewer/agent-patches'

interface AgentPatchesSectionProps {
  worn: (AgentPatch | null)[]
  patches: PatchIndex | null
  onChoose: (slot: number) => void
  onChange: (slot: number, patch: AgentPatch | null) => void
}

export function AgentPatchesSection({ worn, patches, onChoose, onChange }: AgentPatchesSectionProps) {
  const db = useDb()
  const [wanted, setWanted] = useState(0)
  const count = worn.filter(Boolean).length
  const selected = worn[wanted] ? wanted : worn.findIndex(Boolean)
  const patch = selected >= 0 ? worn[selected] : null
  const def = (id: string) => patches?.patch.get(id)

  return (
    <Section title="Patches" collapsible={{ id: 'agent-patches', defaultOpen: true }} aside={<span className="section-value">{count}/{PATCH_SLOTS}</span>}>
      <div className="flex flex-col gap-3.5">
        <div className="grid grid-cols-5 gap-1.5">
          {Array.from({ length: PATCH_SLOTS }, (_, slot) => {
            const p = worn[slot]
            return p
              ? <Slot key={slot} name={def(p.id)?.name ?? p.id} icon={def(p.id) ? db.patch(def(p.id)!.index).image : undefined} badge={String(slot + 1)} active={slot === selected} emptyLabel="" onClick={() => setWanted(slot)} />
              : <Slot key={slot} emptyLabel={`Add a patch in slot ${slot + 1}`} onClick={() => { setWanted(slot); onChoose(slot) }} />
          })}
        </div>
        {patch && (
          <div className="flex flex-col gap-2.5">
            <AttachmentHeader name={def(patch.id)?.name ?? patch.id} removeLabel={`Remove the patch in slot ${selected + 1}`} onChange={() => onChoose(selected)} onRemove={() => onChange(selected, null)} />
            <LabeledSlider label="Size" value={patch.scale} min={0.5} max={1.5} step={0.01} format={(v) => v.toFixed(2) + '×'} onChange={(scale) => onChange(selected, { ...patch, scale })} />
          </div>
        )}
      </div>
    </Section>
  )
}
