import { useMemo } from 'react'
import { Section } from '@/components/common/section'
import { cn } from '@/lib/utils'
import { defaultPetClip, petClips, type PetEntry, type PetIndex } from '@/lib/data/pets'

interface PetSectionProps {
  pet: PetEntry | undefined
  pets: PetIndex | null
  variant: number
  /** The clip playing (null: the default idle). */
  clip: string | null
  onVariant: (index: number) => void
  onClip: (name: string | null) => void
}

const GROUP_TITLE: Record<string, string> = { world: 'In the world', ui: 'Menu', snapshot: 'Snapshots', egg: 'Egg' }

const GROUP_ORDER = ['world', 'egg', 'ui', 'snapshot']

/** `chick_trick03` → `Trick 03`: a clip's name without its breed prefix. */
const clipLabel = (name: string) => name.replace(/^chick_(egg_)?/, '').replace(/_/g, ' ').replace(/(\D)(\d+)/g, '$1 $2').replace(/^./, (c) => c.toUpperCase())

const chip = (on: boolean) => cn('rounded-lg px-2.5 py-1 text-[12px] font-medium', on ? 'bevel-primary text-white' : 'bevel text-foreground/80')

/** A pet's colours (one per material of its model) and the animation it plays. */
export function PetSection({ pet, pets, variant, clip, onVariant, onClip }: PetSectionProps) {
  const model = pet && pets?.models[pet.model]
  const clips = useMemo(() => (pet && pets ? petClips(pets, pet) : []), [pet, pets])
  const groups = useMemo(() => {
    const out = new Map<string, typeof clips>()
    for (const c of clips) out.set(c.group, [...(out.get(c.group) ?? []), c])
    return [...out].sort(([a], [b]) => GROUP_ORDER.indexOf(a) - GROUP_ORDER.indexOf(b))
  }, [clips])
  const playing = clip ?? defaultPetClip(clips)?.name
  if (!model) return null
  return (
    <>
      {model.variants.length > 1 && (
        <Section title="Colour" collapsible={{ id: 'pet-colour' }} aside={<span className="text-[11px] tabular-nums text-muted-foreground">{Math.min(variant, model.variants.length - 1) + 1}/{model.variants.length}</span>}>
          <div className="flex flex-wrap gap-1.5">
            {model.variants.map((v, i) => (
              <button key={i} type="button" aria-pressed={i === variant} className={chip(i === variant)} onClick={() => onVariant(i)}>{v.name}</button>
            ))}
          </div>
        </Section>
      )}
      {clips.length > 0 && (
        <Section title="Animation" collapsible={{ id: 'pet-animation' }} aside={<span className="text-[11px] tabular-nums text-muted-foreground">{clips.length}</span>}>
          <div className="flex max-h-72 flex-col gap-3 overflow-y-auto pr-1">
            {groups.map(([group, list]) => (
              <div key={group}>
                <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{GROUP_TITLE[group] ?? group}</div>
                <div className="flex flex-wrap gap-1.5">
                  {list.map((c) => (
                    <button key={c.file} type="button" aria-pressed={c.name === playing} className={chip(c.name === playing)} onClick={() => onClip(c.name)}>{clipLabel(c.name)}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}
    </>
  )
}
