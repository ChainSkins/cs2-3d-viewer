import { Gauge, Settings } from 'lucide-react'
import { useEffect, useState } from 'react'
import { DialogHeading } from '@/components/common/dialog-heading'
import { FieldGroup } from '@/components/common/field-group'
import { SegmentedControl } from '@/components/common/segmented-control'
import { SwitchField } from '@/components/common/switch-field'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { MapLightingOptions } from '@/components/stage/map-lighting-options'
import { StudioLightingOptions } from '@/components/stage/studio-lighting-options'
import type { Lighting, LightSource, MapLighting, RenderQuality } from '@/lib/viewer/skin-viewer'

interface SettingsButtonProps {
  quality: RenderQuality
  onChange: (changes: Partial<RenderQuality>) => void
  lighting: Lighting
  lightingPreset: string | null
  onLighting: (changes: Partial<Lighting>) => void
  mapLighting: MapLighting
  onMapLighting: (changes: Partial<MapLighting>) => void
  readStatus: () => RenderStatus | null
}

export interface RenderStatus { pixelRatio: number; fps: number; lights: LightSource[] }

const RESOLUTIONS: { value: RenderQuality['resolution']; label: string }[] = [
  { value: 'auto', label: 'Auto' }, { value: 1, label: '1×' }, { value: 1.5, label: '1.5×' }, { value: 2, label: '2×' },
]

export function SettingsButton({ quality, onChange, lighting, lightingPreset, onLighting, mapLighting, onMapLighting, readStatus }: SettingsButtonProps) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<RenderStatus | null>(null)

  useEffect(() => {
    if (!open) return
    const read = () => setStatus(readStatus())
    read()
    const timer = setInterval(read, 1000)
    return () => clearInterval(timer)
  }, [open, readStatus])

  return (
    <>
      <Button variant="ghost" className="pointer-events-auto size-9 rounded-lg text-muted-foreground" aria-label="Display and lighting settings" title="Display and lighting" onClick={() => setOpen(true)}>
        <Settings />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={false} className="flex max-h-[92vh] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-120">
          <DialogHeading icon={Settings} title="Display & lighting" description="How finely the viewer draws, and how the item is lit." onClose={() => setOpen(false)} />
          <div className="flex min-h-0 flex-col gap-4 overflow-y-auto p-5">
            <FieldGroup label="Resolution">
              <SegmentedControl options={RESOLUTIONS} value={quality.resolution} onChange={(resolution) => onChange({ resolution })} />
            </FieldGroup>
            <div className="flex flex-col gap-2.5">
              <SwitchField checked={quality.adaptive} label="Lower the resolution while it runs slow (Auto)" onChange={(adaptive) => onChange({ adaptive })} />
              <SwitchField checked={quality.antialias} label="Antialiasing (smooth edges; reloads the item)" onChange={(antialias) => onChange({ antialias })} />
              <SwitchField checked={quality.post} label="Map effects (bloom and color grading)" onChange={(post) => onChange({ post })} />
            </div>
            {status && (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-black/20 px-3 py-2 text-[12px] text-muted-foreground">
                <Gauge className="size-4" />
                Now drawing at <span className="font-mono text-foreground">{status.pixelRatio.toFixed(2)}×</span> · <span className="font-mono text-foreground">{status.fps}</span> fps
              </div>
            )}
            <div className="border-t border-white/10 pt-4">
              <StudioLightingOptions lighting={lighting} presetId={lightingPreset} onChange={onLighting} />
            </div>
            <div className="border-t border-white/10 pt-4">
              <MapLightingOptions lighting={mapLighting} sources={status?.lights ?? null} onChange={onMapLighting} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
