import type { SkinViewer } from '@/lib/viewer/skin-viewer'
import * as THREE from 'three'
import type { GloveItem, Item } from '@/lib/data/items'
import { GAME_ROOT } from '@/lib/data/catalog'
import { type AgentPatch } from '@/lib/viewer/agent-patches'
import { loadPatches } from '@/lib/data/patches'
import { loadAgent, poseAgent, setAgentGloves } from '@/lib/viewer/agent-view'

/** A whole agent on the stage: its idle pose, and the patches it wears. */

/** A whole agent holding `weapon` (else the last weapon skin loaded), wearing skin `glove`s or its default ones. */
export async function showAgent(v: SkinViewer, id: string, glove: GloveItem | null = null, weapon: Item | null = null): Promise<void> {
  const held = weapon ?? v.lastWeapon
  v.clear()
  const token = v.loadToken
  const agent = await loadAgent(v.loader, v.opts.assetBase, id, glove, held && held.style !== 'glove' ? held : null, () => token !== v.loadToken)
  if (!agent) return
  v.agentWeaponItem = agent.weapon
  if (agent.weapon) v.setAgentWeapon(agent.weapon.seed, v.weaponFloat)
  v.agentGlove = agent.glove
  v.patchLayers = agent.patches
  await v.setAgentPatches(v.agentPatches)
  if (agent.glove) setAgentGloves(v.loaded.finishes, agent.glove, v.viewmodel)
  v.agentRig = agent.rig
  v.agentShown = true
  if (agent.rig) poseAgent(agent.rig, 0)
  v.frame(agent.root, false)
}

/** The patches the agent wears (kept across loads): one per slot, null = empty. */
export async function setAgentPatches(v: SkinViewer, worn: (AgentPatch | null)[]): Promise<void> {
  v.agentPatches = worn
  if (!v.patchLayers.length) return
  const index = await loadPatches(v.opts.assetBase)
  const textures = await Promise.all(worn.map(async (p) => {
    const entry = p && index.patch.get(p.id)
    if (!entry) return null
    const [patch, backing] = await Promise.all([
      v.loader.textures.load(GAME_ROOT + entry.texture, true).catch(() => null),
      entry.backing ? v.loader.textures.load(GAME_ROOT + entry.backing, true).catch(() => null) : null,
    ])
    /** The game samples patches with a clamping sampler (no tiling where a backing scale shrinks the patch). */
    for (const t of [patch, backing]) if (t) t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping
    return patch ? { patch, backing } : null
  }))
  if (worn !== v.agentPatches) return
  for (const layer of v.patchLayers) layer.set(worn, textures)
}
