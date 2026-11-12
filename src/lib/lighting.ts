import { DEFAULT_LIGHTING, type Lighting } from '@/lib/viewer/viewer-options'

export interface LightingPreset {
  id: string
  label: string
  /** Swatch colors for the preset button (key, rim). */
  swatch: [string, string]
  lighting: Lighting
}

/** An inspect map (build_vanity.py): its panorama and thumbnail. */
export interface InspectMap { id: string; name: string; hdr: string; thumb: string }

const preset = (id: string, label: string, changes: Partial<Lighting>): LightingPreset => {
  const lighting = { ...DEFAULT_LIGHTING, ...changes }
  return { id, label, swatch: [lighting.keyColor, lighting.rimColor], lighting }
}

/** Presets set the lights; the map stays as it is (it's chosen apart, and the preset's own `map` is ignored). */
export const LIGHTING_PRESETS: LightingPreset[] = [
  preset('studio', 'Studio', {}),
  preset('daylight', 'Daylight', { exposure: 1.1, key: 2.6, keyColor: '#fff4e0', rim: 0.4, ambient: 0.75 }),
  preset('warm', 'Warm', { key: 2.3, keyColor: '#ffd09c', rim: 0.9, rimColor: '#ff9a5c', ambient: 0.4 }),
  preset('cool', 'Cool', { key: 2.1, keyColor: '#d6e6ff', rim: 1.1, rimColor: '#7fb2ff', ambient: 0.5 }),
  preset('dramatic', 'Dramatic', { exposure: 0.95, key: 3.4, rim: 1.8, ambient: 0.1, angle: 50 }),
  preset('neon', 'Neon', { exposure: 1.05, key: 1.7, keyColor: '#ff4fd8', rim: 2.6, rimColor: '#34e7ff', ambient: 0.18 }),
  preset('showroom', 'Showroom', { exposure: 1.1, key: 2.6, rim: 1.4, ambient: 0.35, orbit: true }),
]

/** The preset these lights match (the map aside), or null when they are custom. */
export function lightingPresetId(lighting: Lighting): string | null {
  return LIGHTING_PRESETS.find((p) => (Object.keys(p.lighting) as (keyof Lighting)[]).every((k) => k === 'map' || p.lighting[k] === lighting[k]))?.id ?? null
}
