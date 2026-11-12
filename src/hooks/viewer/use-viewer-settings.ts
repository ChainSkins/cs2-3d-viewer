import { useStoredSettings } from '@/hooks/common/use-local-storage'
import { lightingPresetId } from '@/lib/lighting'
import { DEFAULT_LIGHTING, DEFAULT_MAP_LIGHTING, DEFAULT_RENDER_QUALITY, DEFAULT_VIEWMODEL, type Lighting, type MapLighting, type RenderQuality, type Viewmodel } from '@/lib/viewer/viewer-options'

// Per-browser preferences, kept in storage: none of them is part of a shared link.

export function useLighting() {
  const [lighting, setLighting] = useStoredSettings<Lighting>('lighting', DEFAULT_LIGHTING)
  return { lighting, setLighting, presetId: lightingPresetId(lighting) }
}

export function useMapLighting() {
  const [mapLighting, setMapLighting] = useStoredSettings<MapLighting>('map-lighting', DEFAULT_MAP_LIGHTING)
  return { mapLighting, setMapLighting }
}

export function useRenderQuality() {
  const [quality, setQuality] = useStoredSettings<RenderQuality>('render-quality', DEFAULT_RENDER_QUALITY)
  return { quality, setQuality }
}

/** (v2: the offsets are CS2's absolute values) */
export function useViewmodel() {
  const [viewmodel, setViewmodel] = useStoredSettings<Viewmodel>('viewmodel-v2', DEFAULT_VIEWMODEL)
  return { viewmodel, setViewmodel }
}
