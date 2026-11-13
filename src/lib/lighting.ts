import { DEFAULT_LIGHTING, type Lighting } from '@/lib/viewer/viewer-options'

export interface LightingPreset {
  id: string
  label: string
  swatch: [string, string]
  lighting: Lighting
}

export interface InspectMap { id: string; name: string; hdr: string; thumb: string; view?: string }

const preset = (id: string, label: string, changes: Partial<Lighting>): LightingPreset => {
  const lighting = { ...DEFAULT_LIGHTING, ...changes }
  return { id, label, swatch: [lighting.keyColor, lighting.rimColor], lighting }
}

export const LIGHTING_PRESETS: LightingPreset[] = [
  preset('studio', 'Studio', {}),
  preset('daylight', 'Daylight', { exposure: 1.1, key: 2.6, keyColor: '#fff4e0', rim: 0.4, ambient: 0.75 }),
  preset('warm', 'Warm', { key: 2.3, keyColor: '#ffd09c', rim: 0.9, rimColor: '#ff9a5c', ambient: 0.4 }),
  preset('cool', 'Cool', { key: 2.1, keyColor: '#d6e6ff', rim: 1.1, rimColor: '#7fb2ff', ambient: 0.5 }),
  preset('dramatic', 'Dramatic', { exposure: 0.95, key: 3.4, rim: 1.8, ambient: 0.1, angle: 50 }),
  preset('neon', 'Neon', { exposure: 1.05, key: 1.7, keyColor: '#ff4fd8', rim: 2.6, rimColor: '#34e7ff', ambient: 0.18 }),
  preset('showroom', 'Showroom', { exposure: 1.1, key: 2.6, rim: 1.4, ambient: 0.35, orbit: true }),
]

export function lightingPresetId(lighting: Lighting): string | null {
  return LIGHTING_PRESETS.find((p) => (Object.keys(p.lighting) as (keyof Lighting)[]).every((k) => k === 'map' || p.lighting[k] === lighting[k]))?.id ?? null
}
