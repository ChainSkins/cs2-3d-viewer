import type { AgentPatch } from '@/lib/viewer/agent-patches'
import type { CharmOptions, KnifePose, StickerOptions } from '@/lib/viewer/skin-viewer'

/** Search-param changes: a value of null removes the param. */
export type Patch = Record<string, string | number | null>

export type LoadStatus = 'loading' | 'ready' | 'error'

/**
 * One loadout shared by first person and the agent view, kept across visits: the agent and gloves (a link's own
 * fpa / fpg win over them) and the weapon skin an agent holds, with its pattern and float (the last skin seen, or
 * the one picked on an agent's page).
 */
export interface Loadout {
  gloves: string | null
  agent: string | null
  weapon: string | null
  weaponSeed: number
  weaponFloat: number | null
}

export interface CharmState {
  id: string | null
  seed: number
  offset: [number, number]
  position: [number, number, number] | null
  sticker: string | null
}

export interface ViewerState {
  float: number | null
  seed: number
  firstPerson: boolean
  gloves: string | null
  /** The agent whose arms first person shows (an agent item id), or the default. */
  agent: string | null
  stickers: StickerOptions[]
  charm: CharmState
  stickerWear: number
  /** A sticker shown on its own: on the game's inspect card (the grey backing it sits on). */
  stickerCard: boolean
  /** On an agent's page: the patch worn in each of its slots. */
  agentPatches: (AgentPatch | null)[]
  /** On a pet's page: its colour (an index into the model's variants). */
  petVariant: number
  /** The photo-booth hat a pet wears (its name), or null. */
  petHat: string | null
  /** The animation clip a pet plays (null: the default idle). */
  petClip: string | null
}

export interface ViewerStateApi extends ViewerState {
  /** Writes search params in place. */
  patch: (changes: Patch) => void
  /** The current search params, including changes not yet written to the URL. */
  search: string
  setFloat: (value: number) => void
  setSeed: (value: number) => void
  setFirstPerson: (on: boolean) => void
  setGloves: (key: string | null) => void
  setAgent: (id: string | null) => void
  setStickers: (list: StickerOptions[]) => void
  setCharm: (changes: Partial<CharmState>) => void
  setStickerWear: (value: number) => void
  setStickerCard: (on: boolean) => void
  /** Wears `patch` in `slot` (null: takes it off). */
  setAgentPatch: (slot: number, patch: AgentPatch | null) => void
  setPetVariant: (index: number) => void
  setPetHat: (name: string | null) => void
  setPetClip: (name: string | null) => void
  charmOptions: CharmOptions | null
  loadout: Loadout
  updateLoadout: (changes: Partial<Loadout>) => void
}

/** How the item is seen, apart from what it is. */
export interface ViewOptions {
  spin: boolean
  palmUp: boolean
  /** How knives stand (other items ignore it). */
  knifePose: KnifePose
  /** The item seen from its other side (a half turn around it). */
  back: boolean
}
