import { Bird, Box, Clock, Crosshair, Hand, LayoutGrid, MapPin, Shield, Star, Sticker, Swords, Target, UserRound, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { categoryImageUrl, type PickerCategory } from '@/lib/picker'
import { cn } from '@/lib/utils'

const ICONS: Record<PickerCategory['icon'], LucideIcon> = {
  recent: Clock, star: Star, grid: LayoutGrid, rifle: Crosshair, target: Target, pistol: Crosshair, knife: Swords, glove: Hand, cube: Box, sticker: Sticker, charm: Sticker, agent: UserRound, pin: MapPin, patch: Shield, pet: Bird,
}

export function CategoryIcon({ category, active }: { category: PickerCategory; active: boolean }) {
  const [failed, setFailed] = useState(false)
  const Icon = ICONS[category.icon]
  if (!category.image || failed) return <span className="grid size-7 shrink-0 place-items-center"><Icon className="size-4 opacity-80" /></span>
  return (
    <img
      src={categoryImageUrl(category.image)}
      alt=""
      draggable={false}
      onError={() => setFailed(true)}
      className={cn('size-7 shrink-0 object-contain transition', !active && 'opacity-70')}
    />
  )
}
