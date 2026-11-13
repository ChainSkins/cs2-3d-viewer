import { ASSET_BASE } from '@/lib/config'
import { VIEWER_DATA } from '@/lib/data/catalog'
import { cn } from '@/lib/utils'

const studioLight = `${ASSET_BASE}${VIEWER_DATA}maps/studio_light.jpg`
const studioDark = `${ASSET_BASE}${VIEWER_DATA}maps/studio_dark.jpg`

interface MapButtonProps {
  label: string
  thumb?: string
  active: boolean
  onClick: () => void
}

export function MapButton({ label, thumb, active, onClick }: MapButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-pressed={active}
      className={cn('flex flex-col gap-1.5 rounded-xl border p-1.5 text-left text-[12.5px] font-medium transition-colors', active ? 'border-foreground/50 bg-ink/10 text-foreground' : 'border-border text-muted-foreground hover:bg-ink/5 hover:text-foreground')}
    >
      {thumb
        ? <img src={thumb} alt="" loading="lazy" className="aspect-[2/1] w-full rounded-lg object-cover" />
        : (
          <span className="aspect-[2/1] w-full overflow-hidden rounded-lg">
            <img src={studioLight} alt="" className="size-full object-cover dark:hidden" />
            <img src={studioDark} alt="" className="hidden size-full object-cover dark:block" />
          </span>
        )}
      <span className="truncate px-1 pb-0.5">{label}</span>
    </button>
  )
}
