import { ChevronDown, Map as MapIcon } from 'lucide-react'
import { useState } from 'react'
import { DialogHeading } from '@/components/common/dialog-heading'
import { MapButton } from '@/components/stage/map-button'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useInspectMaps } from '@/hooks/data/use-inspect-maps'
import { ASSET_BASE } from '@/lib/config'
import { VIEWER_DATA } from '@/lib/data/catalog'

interface MapPickerProps {
  map: string | null
  onChange: (map: string | null) => void
}

export function MapPicker({ map, onChange }: MapPickerProps) {
  const maps = useInspectMaps()
  const [open, setOpen] = useState(false)
  if (!maps.length) return null
  const current = maps.find((m) => m.id === map)?.name ?? 'Studio'
  const choose = (next: string | null) => {
    onChange(next)
    setOpen(false)
  }

  return (
    <>
      <Button variant="ghost" className="pointer-events-auto h-9 rounded-lg px-2.5 text-[13px]" title="Change the map behind the item" aria-label={`Map: ${current}. Change it`} aria-haspopup="dialog" onClick={() => setOpen(true)}>
        <MapIcon /> <span className="hidden sm:inline">{current}</span> <ChevronDown className="size-3.5 opacity-60" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={false} className="flex max-h-[min(760px,90vh)] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-180">
          <DialogHeading icon={MapIcon} title="Map" description="Where the item is shown: the studio or an inspect map." onClose={() => setOpen(false)} />
          <div className="grid grid-cols-2 gap-3 overflow-y-auto p-5 sm:grid-cols-3">
            <MapButton label="Studio" active={!map} onClick={() => choose(null)} />
            {maps.map((m) => (
              <MapButton key={m.id} label={m.name} thumb={ASSET_BASE + VIEWER_DATA + m.thumb} active={map === m.id} onClick={() => choose(m.id)} />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
