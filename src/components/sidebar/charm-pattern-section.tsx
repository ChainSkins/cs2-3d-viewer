import { Section } from '@/components/common/section'
import { CharmSeedControl } from '@/components/common/charm-seed-control'
import type { CharmDef } from '@/lib/data/attachments'

interface CharmPatternSectionProps {
  charm: CharmDef | undefined
  seed: number
  onSeed: (seed: number) => void
}

export function CharmPatternSection({ charm, seed, onSeed }: CharmPatternSectionProps) {
  return (
    <Section title="Charm pattern" collapsible={{ id: 'charm-pattern' }} aside={<span className="section-value font-mono">#{seed}</span>}>
      <CharmSeedControl charm={charm} seed={seed} onChange={onSeed} />
    </Section>
  )
}
