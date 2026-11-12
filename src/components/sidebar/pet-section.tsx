import { ChevronDown, UserRound } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Section } from '@/components/common/section'
import { WornRow } from '@/components/sidebar/worn-row'
import { ASSET_BASE } from '@/lib/config'
import { loadPetHats, type PetHat } from '@/lib/data/pet-hats'
import { CLIP_CATEGORIES, petClipCategory, petClipLabel } from '@/lib/data/pet-labels'
import { defaultPetClip, petClips, type PetClip, type PetEntry, type PetIndex } from '@/lib/data/pets'
import { cn } from '@/lib/utils'

interface PetSectionProps {
  pet: PetEntry | undefined
  pets: PetIndex | null
  variant: number
  clip: string | null
  onVariant: (index: number) => void
  onClip: (name: string | null) => void
  hat: string | null
  onHat: (name: string | null) => void
  agentName: string | null
  agentImage?: string
  onChooseAgent: () => void
  onDefaultAgent: () => void
}

const chip = (on: boolean) => cn('rounded-md border px-2.5 py-1 text-[12px] font-medium transition-colors', on ? 'border-foreground/50 bg-ink/10 text-foreground' : 'border-border text-muted-foreground hover:bg-ink/5 hover:text-foreground')

export function PetSection({ pet, pets, variant, clip, onVariant, onClip, hat, onHat, agentName, agentImage, onChooseAgent, onDefaultAgent }: PetSectionProps) {
  const model = pet && pets?.models[pet.model]
  const clips = useMemo(() => (pet && pets ? petClips(pets, pet) : []), [pet, pets])
  const playing = clip ?? defaultPetClip(clips)?.name
  const [query, setQuery] = useState('')
  const [hats, setHats] = useState<PetHat[]>([])
  useEffect(() => { void loadPetHats(ASSET_BASE).then((d) => setHats(d.hats)).catch(() => {}) }, [])
  const [toggled, setToggled] = useState<Record<string, boolean>>({})
  const searching = query.trim().length > 0

  const folders = useMemo(() => {
    const q = query.trim().toLowerCase()
    const out = new Map<string, PetClip[]>()
    for (const c of clips) {
      if (q && !petClipLabel(c.name).toLowerCase().includes(q)) continue
      const title = petClipCategory(c.group, c.name)
      out.set(title, [...(out.get(title) ?? []), c])
    }
    return CLIP_CATEGORIES.filter((t) => out.has(t)).map((t) => [t, out.get(t)!] as const)
  }, [clips, query])

  if (!model) return null
  const wearsHats = hats.length > 0 && !!pet && !/egg/.test(pet.model)
  const inPose = /snapshots_\d/.test(playing ?? '')
  const isOpen = (title: string, list: PetClip[]) => searching || (toggled[title] ?? list.some((c) => c.name === playing))
  return (
    <>
      {model.variants.length > 1 && (
        <Section title="Colour" collapsible={{ id: 'pet-colour' }} aside={<span className="section-value">{Math.min(variant, model.variants.length - 1) + 1}/{model.variants.length}</span>}>
          <div className="flex flex-wrap gap-1.5">
            {model.variants.map((v, i) => (
              <button key={i} type="button" aria-pressed={i === variant} className={chip(i === variant)} onClick={() => onVariant(i)}>{v.name}</button>
            ))}
          </div>
        </Section>
      )}
      {wearsHats && (
        <Section title="Hat" collapsible={{ id: 'pet-hat' }} aside={<span className="section-value">{hats.length}</span>}>
          <div className="flex flex-wrap gap-1.5">
            <button type="button" aria-pressed={!hat} className={chip(!hat)} onClick={() => onHat(null)}>None</button>
            {hats.map((h) => (
              <button key={h.name} type="button" aria-pressed={h.name === hat} className={chip(h.name === hat)} onClick={() => onHat(h.name)}>{h.label}</button>
            ))}
          </div>
        </Section>
      )}
      {inPose && (
        <Section title="Player" collapsible={{ id: 'pet-player' }}>
          <WornRow kind="Agent" name={agentName} placeholder="Default CT agent" image={agentImage} icon={UserRound} clearLabel="Default agent" onChoose={onChooseAgent} onClear={onDefaultAgent} />
          <p className="mt-2.5 text-[11.5px] leading-relaxed text-muted-foreground">The photo poses are the pet with a player: the agent is the one first person uses.</p>
        </Section>
      )}
      {clips.length > 0 && (
        <Section title="Animation" collapsible={{ id: 'pet-animation' }} aside={<span className="section-value">{clips.length}</span>}>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search: dance, sit, sleep…" aria-label="Search the animations" className="mb-2.5 h-8 w-full rounded-md border border-border bg-shade/25 px-2.5 text-[13px] outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-ink/25" />
          <div className="flex max-h-80 flex-col gap-1 overflow-y-auto pr-1">
            {folders.length === 0 && <p className="px-1 py-2 text-[12px] text-muted-foreground">No animation matches “{query}”.</p>}
            {folders.map(([title, list]) => {
              const open = isOpen(title, list)
              return (
                <div key={title}>
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setToggled((t) => ({ ...t, [title]: !open }))}
                    className="flex w-full items-center gap-2 rounded-lg px-1.5 py-1.5 text-left transition-colors hover:bg-ink/4"
                  >
                    <span className="text-[11.5px] font-medium text-muted-foreground">{title}</span>
                    <span className="text-[11px] tabular-nums text-muted-foreground/70">{list.length}</span>
                    <ChevronDown className={cn('ml-auto size-3.5 text-muted-foreground transition-transform', open && 'rotate-180')} />
                  </button>
                  {open && (
                    <div className="flex flex-wrap gap-1.5 px-1 pb-2 pt-1">
                      {list.map((c) => (
                        <button key={c.file} type="button" aria-pressed={c.name === playing} className={chip(c.name === playing)} onClick={() => onClip(c.name)}>{petClipLabel(c.name)}</button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Section>
      )}
    </>
  )
}
