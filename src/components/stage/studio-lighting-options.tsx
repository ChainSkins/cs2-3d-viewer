import { ChevronDown, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { FieldRow } from '@/components/common/field-row'
import { LabeledSlider } from '@/components/common/labeled-slider'
import { SwitchField } from '@/components/common/switch-field'
import { Button } from '@/components/ui/button'
import { LIGHTING_PRESETS } from '@/hooks/use-lighting'
import { cn } from '@/lib/utils'
import { DEFAULT_LIGHTING, type Lighting } from '@/lib/viewer/viewer-options'

interface StudioLightingOptionsProps {
  lighting: Lighting
  presetId: string | null
  onChange: (changes: Partial<Lighting>) => void
}

/**
 * The studio's lights (they light the item when no map is behind it): the presets, and folded under them the
 * brightness, the key / rim / ambient lights, their angle and colors, and the orbit and follow-camera effects.
 */
export function StudioLightingOptions({ lighting, presetId, onChange }: StudioLightingOptionsProps) {
  const [fine, setFine] = useState(false)
  const onMap = !!lighting.map && lighting.map !== 'studio'
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-[13px] font-medium">Studio lighting</span>
        <span className="text-[12px] text-muted-foreground">{LIGHTING_PRESETS.find((p) => p.id === presetId)?.label ?? 'Custom'}</span>
        <Button variant="ghost" size="xs" className="ml-auto text-muted-foreground" disabled={presetId === 'studio'} onClick={() => onChange({ ...DEFAULT_LIGHTING, map: lighting.map })}>
          <RotateCcw /> Reset
        </Button>
      </div>
      {onMap && <p className="text-[12px] leading-relaxed text-muted-foreground">You are on a map, lit by the game’s own lights. These apply in the Studio backdrop.</p>}

      <div className="grid grid-cols-4 gap-1.5">
        {LIGHTING_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={presetId === p.id}
            onClick={() => onChange({ ...p.lighting, map: lighting.map })}
            className={cn(
              'flex flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-[11px] font-medium',
              presetId === p.id ? 'bevel-active text-foreground' : 'bevel text-foreground/80',
            )}
          >
            <span className="flex">
              <span className="size-3 rounded-full ring-1 ring-black/40" style={{ background: p.swatch[0] }} />
              <span className="-ml-1 size-3 rounded-full ring-1 ring-black/40" style={{ background: p.swatch[1] }} />
            </span>
            {p.label}
          </button>
        ))}
      </div>

      <button type="button" aria-expanded={fine} onClick={() => setFine((on) => !on)} className="flex items-center gap-1 self-start text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground">
        <ChevronDown className={cn('size-3.5 transition-transform duration-200', fine && 'rotate-180')} /> Fine tune
      </button>
      {fine && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <LabeledSlider label="Bright" value={lighting.exposure} min={0.3} max={2.2} step={0.01} format={(v) => v.toFixed(2)} onChange={(exposure) => onChange({ exposure })} />
            <LabeledSlider label="Key" value={lighting.key} min={0} max={6} step={0.05} format={(v) => v.toFixed(1)} onChange={(key) => onChange({ key })} />
            <LabeledSlider label="Rim" value={lighting.rim} min={0} max={5} step={0.05} format={(v) => v.toFixed(1)} onChange={(rim) => onChange({ rim })} />
            <LabeledSlider label="Ambient" value={lighting.ambient} min={0} max={2} step={0.01} format={(v) => v.toFixed(2)} onChange={(ambient) => onChange({ ambient })} />
            <LabeledSlider label="Angle" value={lighting.angle} min={-180} max={180} step={1} format={(v) => v.toFixed(0) + '°'} onChange={(angle) => onChange({ angle })} />
          </div>
          <FieldRow label="Colors">
            <label className="flex items-center gap-1.5 text-[11px] text-foreground/80">
              <input type="color" value={lighting.keyColor} onChange={(e) => onChange({ keyColor: e.target.value })} className="size-6 cursor-pointer rounded-md border border-white/15 bg-transparent p-0" />
              Key
            </label>
            <label className="flex items-center gap-1.5 text-[11px] text-foreground/80">
              <input type="color" value={lighting.rimColor} onChange={(e) => onChange({ rimColor: e.target.value })} className="size-6 cursor-pointer rounded-md border border-white/15 bg-transparent p-0" />
              Rim
            </label>
          </FieldRow>
          <div className="flex flex-col gap-2.5">
            <SwitchField checked={lighting.orbit} label="Rotating light" onChange={(orbit) => onChange({ orbit })} />
            <SwitchField checked={lighting.followCamera} label="Light follows the camera" onChange={(followCamera) => onChange({ followCamera })} />
          </div>
        </div>
      )}
    </div>
  )
}
