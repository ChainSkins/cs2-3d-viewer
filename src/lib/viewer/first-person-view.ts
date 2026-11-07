import type { SkinViewer } from '@/lib/viewer/skin-viewer'
import * as THREE from 'three'
import type { GloveItem, Item } from '@/lib/data/items'
import { PatchLayer } from '@/lib/viewer/agent-patches'
import { AUTO_CYCLE, primaryAttacks, sortAttacks, type AttackEntry } from '@/lib/data/attacks'
import { DEFAULT_AGENT } from '@/lib/data/agents'
import { handIK, poseRig, samplePose, type InspectClip, type ViewmodelPose, type WeaponBind, type RigPart } from '@/lib/viewer/firstperson'
import { isGlove, setGloveSeed } from '@/lib/viewer/model-loader'


/** First person: the arms holding the weapon seen from the eye, the inspect and attack animations, the sway of the viewmodel. */

const INCH = 0.0254
/** Sway: how far (radians) the weapon leans toward the pointer at the edge of the view, and how fast it follows. */
const SWAY_YAW = 0.045
const SWAY_PITCH = 0.03
const SWAY_FOLLOW = 0.08

/** The first-person arms and weapon, kept to pose them again (the inspect animation). */
export interface FirstPersonRig {
  idle: ViewmodelPose
  /** The idle when it moves (a knife's idle1: a breathing loop), played over and over instead of the still pose. */
  idleLoop?: InspectClip | null
  inspect: InspectClip | null
  /** The weapon's attack animations (shots, slashes…), the clips fetched when first played. */
  attacks: AttackEntry[]
  /** With skin gloves: the arms raising them to look at them (deploy, then the look), the weapon put away. */
  gloveInspect: InspectClip[] | null
  /** Each skeleton (the agent's, the gloves') with the geometries bound to it. */
  parts: RigPart[]
  weapon: THREE.Object3D | null
  bind?: WeaponBind
}

const json = <T>(url: string): Promise<T> => fetch(url).then((r) => r.json() as Promise<T>)

/**
 * First person: the weapon in the idle pose with the agent's arms holding it, seen from the eye (the viewmodel's pose:
 * build_firstperson.py). The arms are the agent's, as in the game: its sleeves, and its arms with its default gloves —
 * or, wearing skin `glove`s, that glove model (its arm in the agent's skin).
 */
export async function loadFirstPerson(v: SkinViewer, item: Item, glove: GloveItem | null, agentId: string = DEFAULT_AGENT): Promise<void> {
  if (item.style === 'glove') return v.load(item)
  v.clear()
  const token = v.loadToken
  v.item = item
  const base = v.loader.firstPersonBase
  const name = item.id.split('|')[0]
  const index = await json<Record<string, string>>(base + 'index.json')
  const file = index[name]
  if (!file) throw new Error('No first-person pose for ' + name)
  const [pose, binds, inspect, gloveInspect, idleLoop, attacks] = await Promise.all([
    json<ViewmodelPose>(base + file),
    json<Record<string, WeaponBind>>(base + 'weapon_binds.json').catch(() => ({} as Record<string, WeaponBind>)),
    json<Record<string, string>>(base + 'inspect_index.json')
      .then((idx) => idx[name] ? json<InspectClip>(base + 'inspect/' + idx[name]) : null)
      .catch(() => null),
    glove ? v.loader.gloveInspectClips().catch(() => null) : Promise.resolve(null),
    json<Record<string, string>>(base + 'idle_index.json')
      .then((idx) => idx[file] ? json<InspectClip>(base + 'idle/' + idx[file]) : null)
      .catch(() => null),
    json<Record<string, AttackEntry[]>>(base + 'attack_index.json').then((idx) => sortAttacks(idx[name] ?? [])).catch(() => [] as AttackEntry[]),
  ])
  const rig: FirstPersonRig = { idle: pose, idleLoop, inspect, attacks, gloveInspect, parts: [], weapon: null, bind: binds[name] }
  const patchLayers: PatchLayer[] = []
  const armsRoot = await v.loader.firstPersonArms(agentId, glove, rig.parts, patchLayers)
  const weapon = await v.loader.weapon(item)
  await v.loader.rigWeapon(item, weapon)
  if (token !== v.loadToken) return
  weapon.matrixAutoUpdate = false
  rig.weapon = weapon
  v.fpRig = rig
  poseRig(rig.parts, handIK(pose), rig.weapon, rig.bind)
  v.weaponRoot = weapon
  v.fpGlove = glove
  v.patchLayers = patchLayers
  v.enterFirstPerson(armsRoot, weapon)
  await v.attachments.apply()
  await v.setAgentPatches(v.agentPatches)
  v.setSeed(item.seed)
}

/**
 * On a glove skin's page: first person with just the arms (the agent's sleeves and these gloves, no weapon) playing
 * the glove inspect, then back to the gloves on their own.
 */
export async function lookAtGloves(v: SkinViewer, agentId: string = DEFAULT_AGENT): Promise<void> {
  const glove = v.item
  if (!glove || glove.style !== 'glove') return
  const seed = v.weaponSeed, float = v.weaponFloat
  v.clear()
  const token = v.loadToken
  const clips = await v.loader.gloveInspectClips()
  const rig: FirstPersonRig = { idle: samplePose(clips[0], 0), inspect: null, attacks: [], gloveInspect: clips, parts: [], weapon: null }
  const armsRoot = await v.loader.firstPersonArms(agentId, glove as GloveItem, rig.parts)
  if (token !== v.loadToken) return
  for (const finish of v.loaded.finishes) {
    if (!isGlove(finish)) continue
    setGloveSeed(finish, seed)
    finish.setFloat(float)
  }
  v.fpRig = rig
  v.fpGlove = glove as GloveItem
  v.gloveLookItem = glove
  v.enterFirstPerson(armsRoot)
  v.inspectClips = clips
  v.inspectStart = performance.now()
}

/** Shows the posed first-person models from the eye. */
export function enterFirstPerson(v: SkinViewer, ...models: THREE.Object3D[]): void {
  // A map's fixed inspect (its game camera and FOV) ends here: first person has its own camera and viewmodel FOV.
  v.fixed.exit(v.map.scene3d)
  v.firstPerson = true
  v.holder.rotation.set(0, 0, 0)
  v.holder.add(...models)
  v.updateViewmodel(0)
  v.controls.enabled = false
  v.camera.position.set(0, 0, 0)
  v.camera.up.set(0, 1, 0)
  v.camera.lookAt(0, 0, 1)
  v.fit = null
  v.resize()
  v.updateFixedInspect()
}

/**
 * Plays one of the weapon's attacks (from the start, over whatever plays): the named clip, or — with no name — the plain
 * fire: a gun's shot, a knife's slashes one after the other.
 * @param name a clip name from `attacks`
 */
export async function attack(v: SkinViewer, name?: string): Promise<void> {
  const rig = v.fpRig
  if (!rig?.attacks.length) return
  let entry = name ? rig.attacks.find((a) => a.name === name) : undefined
  if (!entry) {
    const primary = primaryAttacks(rig.attacks)
    entry = primary[v.attackNext++ % primary.length]
  }
  let clip = v.attackClips.get(entry.file)
  if (!clip) v.attackClips.set(entry.file, (clip = json<InspectClip>(v.loader.firstPersonBase + 'attack/' + entry.file)))
  const loaded = await clip.catch(() => null)
  if (!loaded || v.fpRig !== rig) return
  v.inspectClips = [loaded]
  if (rig.weapon) rig.weapon.visible = true
  v.inspectStart = performance.now()
}

/**
 * Starts firing: one shot, and — on an automatic weapon — a shot every cycle time (the animation restarts each time, so it stays
 * in the kick) until `stopFire`. Semi-automatic weapons and knives play one attack per press.
 */
export function startFire(v: SkinViewer): void {
  if (v.firing || !v.fpRig?.attacks.length) return
  v.firing = true
  const cycle = AUTO_CYCLE[v.item?.id.split('|')[0] ?? '']
  const shoot = (): void => {
    void v.attack()
    if (cycle && v.firing) v.fireTimer = setTimeout(shoot, cycle * 1000)
  }
  shoot()
}

/** Stops the held fire. */
export function stopFire(v: SkinViewer): void {
  v.firing = false
  clearTimeout(v.fireTimer)
}

/** Plays the first-person weapon's inspect animation (from the start, if it was already playing). */
export function inspect(v: SkinViewer): void {
  if (!v.fpRig?.inspect) return
  v.inspectClips = [v.fpRig.inspect]
  if (v.fpRig.weapon) v.fpRig.weapon.visible = true
  v.inspectStart = performance.now()
}

/** First person looks at its gloves: the weapon put away, the arms raise them (from the start if already playing). */
export function inspectGloves(v: SkinViewer): void {
  const rig = v.fpRig
  if (!rig?.gloveInspect || !v.fpGlove) return
  v.inspectClips = rig.gloveInspect
  if (rig.weapon) rig.weapon.visible = false
  v.inspectStart = performance.now()
}

/** Poses the animated idle at `now` (ms), looping. */
export function stepIdle(v: SkinViewer, now: number): void {
  const rig = v.fpRig
  const loop = rig?.idleLoop
  if (!rig || !loop) return
  poseRig(rig.parts, handIK(samplePose(loop, (now / 1000) % loop.duration)), rig.weapon, rig.bind)
}

/** Advances the playing inspect (its clips one after another) to `now` (ms); at its end the idle pose comes back. */
export function stepInspect(v: SkinViewer, now: number): void {
  const rig = v.fpRig
  if (!rig || !v.inspectClips || v.inspectStart === null) { v.inspectStart = null; return }
  let t = (now - v.inspectStart) / 1000
  for (const clip of v.inspectClips) {
    if (t < clip.duration) { poseRig(rig.parts, handIK(samplePose(clip, t)), rig.weapon, rig.bind); return }
    t -= clip.duration
  }
  v.inspectStart = null
  v.inspectClips = null
  if (rig.weapon) rig.weapon.visible = true
  poseRig(rig.parts, handIK(rig.idle), rig.weapon, rig.bind)
  /** The glove page's look at the gloves ends back on the gloves on their own, as they were. */
  const glove = v.gloveLookItem
  if (glove) {
    const seed = v.weaponSeed, float = v.weaponFloat
    void v.load(glove).then(() => { v.setFloat(float); v.setSeed(seed) })
  }
}

/**
 * Places the first-person holder: the default spot plus the offsets, mirrored for the left hand, and — with sway
 * on — leaning toward the pointer and breathing.
 * @param t time in seconds
 */
export function updateViewmodel(v: SkinViewer, t: number): void {
  const vm = v.viewmodel
  const side = vm.leftHanded ? 1 : -1
  let bob = 0
  if (vm.sway) {
    bob = Math.sin(t * 1.7) * 0.0009
    const r = v.holder.rotation
    /** Applied after the mirror, so the same sign leans toward the pointer with either hand. */
    r.y += (-v.pointer.x * SWAY_YAW - r.y) * SWAY_FOLLOW
    r.x += (-v.pointer.y * SWAY_PITCH - r.x) * SWAY_FOLLOW
    r.z = Math.sin(t * 0.85) * 0.006
  } else {
    v.holder.rotation.set(0, 0, 0)
  }
  v.holder.position.set(side * vm.offsetX * INCH, vm.offsetZ * INCH + bob, vm.offsetY * INCH)
  v.holder.scale.set(vm.leftHanded ? -1 : 1, 1, 1)
}
