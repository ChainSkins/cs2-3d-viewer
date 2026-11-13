import { SeedControl } from '@/components/common/seed-control'
import { useCharmGradient } from '@/hooks/data/use-charm-gradient'
import { CHARM_PATTERN_MAX, type CharmDef } from '@/lib/data/attachments'

interface CharmSeedControlProps {
  charm: CharmDef | undefined
  seed: number
  onChange: (seed: number) => void
}

export function CharmSeedControl({ charm, seed, onChange }: CharmSeedControlProps) {
  const gradient = useCharmGradient(charm)
  return (
    <SeedControl
      label="Charm pattern"
      value={seed}
      min={0}
      max={CHARM_PATTERN_MAX}
      background={gradient ?? 'color-mix(in oklab, var(--ink) 12%, transparent)'}
      fieldClassName="w-20"
      onChange={onChange}
    />
  )
}
