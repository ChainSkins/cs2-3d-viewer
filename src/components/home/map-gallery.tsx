import { ArrowRight } from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'
import { useInspectMaps } from '@/hooks/data/use-inspect-maps'
import { useLighting } from '@/hooks/viewer/use-viewer-settings'
import { ASSET_BASE, DEFAULT_SKIN } from '@/lib/config'
import { VIEWER_DATA } from '@/lib/data/catalog'
import { selectionPath } from '@/lib/selection'
import { cn } from '@/lib/utils'

const FEATURED = 'de_mirage'
const MAP_COUNT = 15

export function MapGallery() {
  const maps = useInspectMaps()
  const { setLighting } = useLighting()
  const navigate = useNavigate()
  const ordered = useMemo(() => {
    const lead = maps.find((m) => m.id === FEATURED) ?? maps[0]
    return lead ? [lead, ...maps.filter((m) => m !== lead)] : []
  }, [maps])

  const open = (map: string) => {
    setLighting({ map })
    navigate(selectionPath({ kind: 'skin', ...DEFAULT_SKIN }))
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
      {!maps.length && Array.from({ length: MAP_COUNT },(_, i) => <Skeleton key={i} className={cn('aspect-2/1 rounded-xl', i === 0 && 'col-span-2 lg:row-span-2 lg:aspect-auto')} />)}
      {ordered.map((m, i) => {
        const lead = i === 0
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => open(m.id)}
            className={cn(
              'group relative overflow-hidden rounded-xl border border-border bg-ink/[0.03] text-left outline-none transition-colors hover:border-ink/25 focus-visible:border-foreground/70',
              lead ? 'col-span-2 aspect-2/1 lg:row-span-2 lg:aspect-auto' : 'aspect-2/1',
            )}
          >
            <img src={ASSET_BASE + VIEWER_DATA + (m.view ?? m.thumb)} alt="" loading="lazy" className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <span aria-hidden className="absolute inset-0 bg-linear-to-t from-black/80 via-black/10 to-transparent" />
            <span className={cn('absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 font-medium text-white', lead ? 'p-4 text-[18px] lg:p-5 lg:text-[22px]' : 'px-3 pb-2.5 text-[13px]')}>
              <span className="min-w-0 truncate">{m.name}</span>
              <span className={cn('flex shrink-0 items-center gap-1 text-[12px] text-white/85 transition-opacity', !lead && 'opacity-0 group-hover:opacity-100 max-sm:hidden')}>
                View here <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
