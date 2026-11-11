import { Maximize2, Minimize2 } from 'lucide-react'
import type { RefObject } from 'react'
import { Callout } from '@/components/common/callout'
import { Spinner } from '@/components/common/spinner'
import { EditButton } from '@/components/stage/edit-button'
import { PillSwitch } from '@/components/stage/pill-switch'
import { MapPicker } from '@/components/stage/map-picker'
import { SettingsButton, type RenderStatus } from '@/components/stage/settings-button'
import { ShareButton } from '@/components/stage/share-button'
import { StageHeading } from '@/components/stage/stage-heading'
import { StageToolbar, type StageToolbarProps } from '@/components/stage/stage-toolbar'
import { ToolButton } from '@/components/stage/tool-button'
import { StudioBackdrop } from '@/components/stage/studio-backdrop'
import { IS_MOBILE_DEVICE } from '@/lib/device'
import type { Heading } from '@/lib/heading'
import type { ShareSource } from '@/lib/share-card'
import type { Lighting, MapLighting, RenderQuality } from '@/lib/viewer/skin-viewer'

interface StageProps extends StageToolbarProps {
  viewportRef: RefObject<HTMLDivElement | null>
  heading: Heading
  loading: boolean
  error: string
  map: string | null
  onMap: (map: string | null) => void
  getShare: () => ShareSource
  canEdit: boolean
  editing: boolean
  onToggleEditing: () => void
  quality: RenderQuality
  onQuality: (changes: Partial<RenderQuality>) => void
  lighting: Lighting
  lightingPreset: string | null
  onLighting: (changes: Partial<Lighting>) => void
  mapLighting: MapLighting
  onMapLighting: (changes: Partial<MapLighting>) => void
  readRenderStatus: () => RenderStatus | null
  gloveGameLight: boolean | null
  onGloveGameLight: (on: boolean) => void
  hideUi: boolean
  onToggleUi: () => void
}

export function Stage({ viewportRef, heading, loading, error, map, onMap, getShare, canEdit, editing, onToggleEditing, quality, onQuality, lighting, lightingPreset, onLighting, mapLighting, onMapLighting, readRenderStatus, gloveGameLight, onGloveGameLight, hideUi, onToggleUi, ...toolbar }: StageProps) {
  return (
    <main className="relative order-1 min-h-[62dvh] flex-1 overflow-hidden border-white/10 lg:order-2 lg:min-h-0">
      <StudioBackdrop />
      <div ref={viewportRef} className="absolute inset-0" />
      {!hideUi && <StageHeading heading={heading} />}
      <div className="absolute right-4 top-4 flex flex-col items-end gap-2 lg:right-5 lg:top-5">
        <div className="glass-panel pointer-events-auto flex items-center gap-1 rounded-xl p-1">
          {!hideUi && (
            <>
              {canEdit && <EditButton editing={editing} onToggle={onToggleEditing} />}
              {!IS_MOBILE_DEVICE && <MapPicker map={map} onChange={onMap} />}
              {(canEdit || !IS_MOBILE_DEVICE) && <span aria-hidden className="mx-0.5 h-5 w-px bg-white/10" />}
              <ShareButton getShare={getShare} />
              <SettingsButton quality={quality} onChange={onQuality} lighting={lighting} lightingPreset={lightingPreset} onLighting={onLighting} mapLighting={mapLighting} onMapLighting={onMapLighting} readStatus={readRenderStatus} />
            </>
          )}
          <ToolButton icon={hideUi ? Minimize2 : Maximize2} label={hideUi ? 'Show UI (H)' : 'Hide UI (H)'} pressed={hideUi} onClick={onToggleUi} />
        </div>
        {!hideUi && gloveGameLight !== null && (
          <div className="glass-panel pointer-events-auto rounded-xl p-1" title="The light the gloves have on a map: the studio's or the game's inspect rig">
            <PillSwitch
              label="Light on the gloves"
              options={[{ value: 'studio', label: 'Studio light' }, { value: 'game', label: 'Game light' }]}
              value={gloveGameLight ? 'game' : 'studio'}
              onChange={(v) => onGloveGameLight(v === 'game')}
            />
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 p-4 lg:p-5">
        {error && <Callout tone="error" pill className="pointer-events-auto">{error}</Callout>}
        {!hideUi && canEdit && editing && (
          <div className="glass flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12px] text-foreground/85">
            <span className="size-1.5 animate-pulse rounded-full bg-foreground/70" />
            Edit mode · drag a sticker or the charm · drag elsewhere to turn the view
          </div>
        )}
        {!hideUi && <StageToolbar {...toolbar} />}
      </div>

      {loading && (
        <div className="absolute inset-0 grid place-items-center">
          <div className="glass-strong flex items-center gap-3 rounded-2xl px-4 py-3">
            <Spinner />
            Loading {heading.title}…
          </div>
        </div>
      )}
    </main>
  )
}
