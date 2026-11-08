import type { SkinViewer } from '@/lib/viewer/skin-viewer'
import * as THREE from 'three'
import { GAME_ROOT } from '@/lib/data/catalog'
import { defaultPetClip, loadPetClip, loadPets, petClips } from '@/lib/data/pets'
import { DEFAULT_AGENT } from '@/lib/data/agents'
import { bindAttachment, poseRig, samplePose, skinMatrices, SkinnedGeometry } from '@/lib/viewer/firstperson'
import { loadPetHats } from '@/lib/data/pet-hats'
import { loadAgent } from '@/lib/viewer/agent-view'

/** A pet on its own (a chicken, the chick, the egg), its colours and its animations, and the photo poses that stand it beside a player. */

/** A pet shown over a map looks straight at the camera; the egg is round, so it takes more room around it. */
const PET_TURN = 0
export const petView = (glb: string): { turn: number; room: number } => ({ turn: PET_TURN, room: /egg/.test(glb) ? 1.6 : 1 })

/**
 * A pet on its own (a chicken, the chick, the egg): its model in one of its colours, playing a clip of its skeleton
 * (the named one, else the first idle) in a loop. The roasted chicken has no skeleton animations.
 */
export async function showPet(v: SkinViewer, id: string, variant = 0, clipName: string | null = null, agentId: string = DEFAULT_AGENT, hat: string | null = null): Promise<void> {
  v.clear()
  const token = v.loadToken
  const index = await loadPets(v.opts.assetBase)
  const entry = index.pet.get(id)
  const model = entry && index.models[entry.model]
  if (!entry || !model) throw new Error('No pet ' + id)
  const clips = petClips(index, entry)
  const wanted = clips.find((c) => c.name === clipName) ?? defaultPetClip(clips)
  /** A photo pose is the pet with the player: the clip of the player's half (snapshots_charNN) poses an agent beside it. */
  const playerClip = wanted?.group === 'snapshot' ? index.clips.find((c) => c.name === wanted.name.replace('snapshots_', 'snapshots_char')) : undefined
  const [gltf, clip, player, playerPose] = await Promise.all([
    v.loader.gltf.loadAsync(v.loader.textures.url(GAME_ROOT + model.glb)),
    wanted ? loadPetClip(v.opts.assetBase, index, wanted).catch(() => null) : null,
    playerClip ? loadAgent(v.loader, v.opts.assetBase, agentId, null, null, () => token !== v.loadToken).catch(() => null) : null,
    playerClip ? loadPetClip(v.opts.assetBase, index, playerClip).catch(() => null) : null,
  ])
  if (token !== v.loadToken) return
  const root = new THREE.Group()
  if (player?.rig && playerPose) {
    poseRig(player.rig.parts, samplePose(playerPose, 0))
    player.root.traverse((o) => { if (o instanceof THREE.Mesh) o.geometry.computeBoundingBox() })
    root.add(player.root)
  }
  gltf.scene.updateMatrixWorld(true)
  const meshes: THREE.Mesh[] = [], skinned: SkinnedGeometry[] = []
  gltf.scene.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return
    const g = o.geometry.clone().applyMatrix4(o.matrixWorld)
    if (g.getAttribute('skinIndex')) skinned.push(new SkinnedGeometry(g))
    const mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial())
    meshes.push(mesh)
    root.add(mesh)
  })
  /** Hens and chick look along +Z: the camera takes the front (the egg is round and keeps the side). */
  const rotated = !/egg/.test(model.glb)
  v.framedShown = true
  v.petRig = { id, variant, agent: agentId, hatName: hat, hat: null, root, pose: !!(player?.rig && playerPose), index, model, meshes, parts: [{ skeleton: model.skeleton, geometries: skinned }], clip, start: performance.now() }
  v.setPetVariant(variant)
  v.stepPet(performance.now())
  void v.setPetHat(hat)
  /** Posing moved the vertices: the box the framing reads must follow (the glb's, kept by the clone, is the bind pose's). */
  for (const mesh of meshes) mesh.geometry.computeBoundingBox()
  v.frame(root, false, rotated && !v.petRig.pose ? false : undefined)
}

/** Paints the pet in colour `index` of its model (the materials of that variant, in mesh order). */
export function setPetVariant(v: SkinViewer, index: number): void {
  const rig = v.petRig
  if (!rig) return
  rig.variant = index
  const calls = rig.model.variants[Math.min(Math.max(0, index), rig.model.variants.length - 1)]?.drawCalls ?? []
  rig.meshes.forEach((mesh, i) => {
    const call = calls[i] ?? calls[0]
    const old = mesh.material as THREE.Material
    const material = call ? v.loader.plainMaterial(call) : new THREE.MeshStandardMaterial()
    /** plainMaterial's defaults (fully metal, fully rough) are for models with a metalness map: without one it is a matte surface. */
    if (call && !call.rough && material instanceof THREE.MeshStandardMaterial) { material.metalness = 0; material.roughness = 0.7 }
    mesh.material = material
    old.dispose()
  })
}

/** Plays the named clip of the pet from the start (null: its default idle). */
export async function playPetClip(v: SkinViewer, name: string | null): Promise<void> {
  const rig = v.petRig
  if (!rig) return
  const token = v.loadToken
  const entry = [...rig.index.pet.values()].find((p) => rig.index.models[p.model] === rig.model)
  const clips = entry ? petClips(rig.index, entry) : []
  const wanted = clips.find((c) => c.name === name) ?? defaultPetClip(clips)
  if (!wanted) return
  /** A photo pose (or leaving one) changes who is on the stage and where the camera looks: it loads again. */
  if (rig.pose || wanted.group === 'snapshot') return v.showPet(rig.id, rig.variant, wanted.name, rig.agent, rig.hatName)
  const clip = await loadPetClip(v.opts.assetBase, rig.index, wanted).catch(() => null)
  if (!clip || token !== v.loadToken || v.petRig !== rig) return
  rig.clip = clip
  rig.start = performance.now()
}

/** Poses the pet at `now` (ms) of its clip, looping, and the hat on its head with it. */
export function stepPet(v: SkinViewer, now: number): void {
  const rig = v.petRig
  if (!rig?.clip) return
  const t = ((now - rig.start) / 1000) % rig.clip.duration
  const pose = samplePose(rig.clip, t)
  for (const part of rig.parts) {
    const skin = skinMatrices(part.skeleton, pose)
    for (const g of part.geometries) g.pose(skin)
    if (rig.hat) rig.hat.object.matrix.copy(skin[rig.hat.head]).multiply(rig.hat.attach)
  }
}

/**
 * Puts a photo-booth hat on the pet's head (null: none), as the booth does: on the model's head_attach (the glasses on
 * eyewear_attach), at the scale of the pet's growth stage. The hat follows the head bone through every animation.
 */
export async function setPetHat(v: SkinViewer, name: string | null): Promise<void> {
  const rig = v.petRig
  if (!rig) return
  rig.hatName = name
  if (rig.hat) {
    rig.hat.object.removeFromParent()
    rig.hat.object.traverse((o) => { if (o instanceof THREE.Mesh) { o.geometry.dispose(); (o.material as THREE.Material).dispose() } })
    rig.hat = null
  }
  const entry = rig.index.pet.get(rig.id)
  if (!name || !entry) return
  const hats = await loadPetHats(v.opts.assetBase)
  const def = hats.hats.find((h) => h.name === name)
  const point = def && hats.attach[entry.model]?.[def.attach]
  const attach = def && point ? bindAttachment(rig.model.skeleton, point.bone, point.rot, point.pos) : null
  const head = point ? rig.model.skeleton.bones.indexOf(point.bone) : -1
  if (!def || !attach || head < 0) return
  const gltf = await v.loader.gltf.loadAsync(v.loader.textures.url(GAME_ROOT + def.glb))
  if (v.petRig !== rig || rig.hatName !== name) return
  gltf.scene.updateMatrixWorld(true)
  const object = new THREE.Group()
  object.matrixAutoUpdate = false
  let i = 0
  gltf.scene.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return
    const call = def.drawCalls[i++] ?? def.drawCalls[0]
    object.add(new THREE.Mesh(o.geometry.clone().applyMatrix4(o.matrixWorld), call ? v.loader.plainMaterial(call) : new THREE.MeshStandardMaterial()))
  })
  const scale = /chick\.vmdl$/.test(entry.model) ? hats.scale.chick : hats.scale.hen
  rig.hat = { object, head, attach: attach.multiply(new THREE.Matrix4().makeScale(scale, scale, scale)) }
  rig.root.add(object)
  v.stepPet(performance.now())
}
