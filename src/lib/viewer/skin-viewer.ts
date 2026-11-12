import { IS_MOBILE_DEVICE } from '@/lib/device'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { GloveItem, Item } from '@/lib/data/items'
import { TextureSource } from '@/lib/viewer/textures'
import type { WeaponItem } from '@/lib/materials/weapon'

import { VIEWER_DATA } from '@/lib/data/catalog'
import { PatchLayer, type AgentPatch } from '@/lib/viewer/agent-patches'
import { attackLabel, secondaryAttack, type AttackInfo } from '@/lib/data/attacks'

import { type PetIndex, type PetModel } from '@/lib/data/pets'

import { DEFAULT_AGENT } from '@/lib/data/agents'
import { type InspectClip, type RigPart } from '@/lib/viewer/firstperson'
import type { CharmPart } from '@/lib/materials/charm'
import { FixedInspect } from '@/lib/viewer/fixed-inspect'
import { MapStage } from '@/lib/viewer/map-stage'
import { poseAgent, setAgentGloves, setAgentWeapon, type AgentRig } from '@/lib/viewer/agent-view'
import { isGlove, ModelLoader, setGloveSeed, setWeaponSeed, type LoadSink } from '@/lib/viewer/model-loader'
import { WeaponAttachments } from '@/lib/viewer/weapon-attachments'
import { DEFAULT_LIGHTING, DEFAULT_MAP_LIGHTING, DEFAULT_RENDER_QUALITY, DEFAULT_VIEWMODEL, type CharmOptions, type LightSource, type Lighting, type MapLighting, type RenderQuality, type SkinViewerOptions, type StickerOptions, type Viewmodel } from '@/lib/viewer/viewer-options'

import { AttachmentEditor, type EditorEvents } from '@/lib/viewer/attachment-editor'

import { showPet, setPetVariant, setPetHat, playPetClip, stepPet } from '@/lib/viewer/pet-view'
import { showSticker, showPin, showPatch, showCharm } from '@/lib/viewer/standalone-views'
import { loadFirstPerson, lookAtGloves, enterFirstPerson, attack, startFire, stopFire, inspect, inspectGloves, stepIdle, stepInspect, updateViewmodel } from '@/lib/viewer/first-person-view'
import { showAgent, setAgentPatches } from '@/lib/viewer/agent-stage'
import { frame, homePosition, resetView, backView, updateFixedInspect, renderSides, renderItem, setKnifePose, isKnife } from '@/lib/viewer/camera-framing'
import { setQuality, applyPixelRatio, adapt } from '@/lib/viewer/render-quality'
import type { FirstPersonRig } from '@/lib/viewer/first-person-view'
import type { KnifePose } from '@/lib/viewer/camera-framing'

export { DEFAULT_LIGHTING, DEFAULT_MAP_LIGHTING, DEFAULT_RENDER_QUALITY, DEFAULT_VIEWMODEL, type CharmOptions, type LightSource, type Lighting, type MapLighting, type RenderQuality, type SkinViewerOptions, type StickerOptions, type Viewmodel }

/** Where the lights sit around the model (world space, before `angle`), as before lighting was adjustable. */
const KEY_POSITION = new THREE.Vector3(3, 4, 5)
const RIM_POSITION = new THREE.Vector3(-4, 2, -3)
/** Relative to the camera (right, up, toward the viewer): the key from over the shoulder, the rim from behind the model. */
const KEY_FROM_CAMERA = new THREE.Vector3(2.5, 3, 4)
const RIM_FROM_CAMERA = new THREE.Vector3(-3, 1.5, -5)
/** The orbit effect's speed (degrees per frame). */
const ORBIT_SPEED = 0.35

export type { KnifePose }

/**
 * A 3D viewer for one CS2 skin at a time, with float and pattern (seed). The class holds the scene, the state and the
 * public API; the views that do the work live in their own files and take the viewer as their first argument:
 * pet-view, standalone-views (sticker, pin, patch, charm), first-person-view, agent-stage, camera-framing, render-quality.
 * That is why most of its state is not private.
 */
export class SkinViewer {
  readonly renderer: THREE.WebGLRenderer
  readonly scene = new THREE.Scene()
  readonly camera: THREE.PerspectiveCamera
  readonly controls: OrbitControls
  autoRotate = false
  /** How finely it draws (resolution, map post-processing, adapting to slow frames). */
  quality: RenderQuality = { ...DEFAULT_RENDER_QUALITY }
  /** The map lights' strengths (× the game's). */
  mapLighting: MapLighting = { ...DEFAULT_MAP_LIGHTING }
  /** The adaptive resolution's share of the 'auto' resolution (1 = full). */
  adaptiveScale = 1
  /** Frame timing for the adaptive resolution: a smoothed frame time (ms), the last frame, and when it last changed. */
  frameMs = 16
  lastTick = 0
  lastAdapt = 0
  private readonly gltf = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
  readonly holder = new THREE.Group()
  private readonly resizeObserver: ResizeObserver
  private readonly keyLight = new THREE.DirectionalLight(0xffffff, DEFAULT_LIGHTING.key)
  private readonly rimLight = new THREE.DirectionalLight(0xffffff, DEFAULT_LIGHTING.rim)
  private lighting: Lighting = { ...DEFAULT_LIGHTING }
  /** The studio or the inspect map around the model. */
  readonly map: MapStage
  /** The game's fixed inspect camera over a map's pre-rendered background. */
  readonly fixed: FixedInspect
  viewmodel: Viewmodel = { ...DEFAULT_VIEWMODEL }
  /** The pointer over the canvas (−1…1 each way), for the first-person sway. */
  readonly pointer = new THREE.Vector2()
  /** The weapon's own float and pattern, kept to re-apply when the gloves' settings change. */
  weaponFloat = 0
  weaponSeed = 1
  /** The orbit effect's own turn, added to `lighting.angle`. */
  private lightSpin = 0
  /** What the current model left behind: its finishes, disposables and the gloves' hands. */
  readonly loaded: LoadSink = { finishes: [], disposables: [], hands: [] }
  readonly loader: ModelLoader
  readonly attachments: WeaponAttachments
  /** Edit mode: dragging the stickers and the charm. */
  private readonly editor: AttachmentEditor
  item: Item | null = null
  private palmUp = false
  /** First-person view (the arms hold the weapon, seen from the eye), and the gloves they wear. */
  firstPerson = false
  fpGlove: GloveItem | null = null
  /** The first-person rig: what to pose again for the inspect animation (the arms' geometries per skeleton, the weapon). */
  fpRig: FirstPersonRig | null = null
  /** The agent shown holding a weapon. */
  agentRig: AgentRig | null = null
  /** Gloves on a map lit by the game's inspect rig (true) or the studio lights (false, the default). */
  private gloveGameLight = false
  /** An agent is shown (posed or not). */
  agentShown = false
  /** A pet or a pin is on the stage: it takes the map's light like an item on its own does (the fixed game inspect). */
  framedShown = false
  patchLayers: PatchLayer[] = []
  /** The pet on the stage: its meshes (their material swaps with the colour), skinned parts and the clip playing. */
  petRig: { id: string; variant: number; agent: string; hatName: string | null; hat: { object: THREE.Group; head: number; attach: THREE.Matrix4 } | null; root: THREE.Group; pose: boolean; index: PetIndex; model: PetModel; meshes: THREE.Mesh[]; parts: RigPart[]; clip: InspectClip | null; start: number } | null = null
  agentPatches: (AgentPatch | null)[] = []
  /** The weapon skin the shown agent holds (for its pattern and wear). */
  agentWeaponItem: WeaponItem | null = null
  /** The skin gloves the shown agent wears. */
  agentGlove: GloveItem | null = null
  /** The last weapon skin loaded: what an agent holds when shown. */
  lastWeapon: Item | null = null
  knifePose: KnifePose = 'tilted'
  /** When the inspect animation started (performance.now() ms), while it plays. */
  inspectStart: number | null = null
  /** The glove skin whose page is playing its look at the gloves (back to it when done). */
  gloveLookItem: Item | null = null
  /** The clips the playing inspect runs through (the weapon's, or the gloves' deploy and look). */
  inspectClips: InspectClip[] | null = null
  home = new THREE.Vector3()
  /** The loaded weapon's model (its own space: inches, Z up) — stickers and charms go on it. */
  weaponRoot: THREE.Object3D | null = null
  /** A sticker or charm shown on its own (instead of an item). */
  /** The charm or sticker shown on its own. */
  standalone: { setWear?: (w: number) => void; setCard?: (on: boolean) => void; parts?: CharmPart[]} | null = null
  /** Bumped by clear(): a load (item, sticker or charm view) that finished late is dropped. */
  loadToken = 0
  /** The framed model's size and the side it's viewed from, to re-fit the view when the panel resizes. */
  fit: { size: THREE.Vector3; side: THREE.Vector3; lookX: boolean } | null = null

  constructor(private readonly container: HTMLElement, readonly opts: SkinViewerOptions) {
    this.renderer = new THREE.WebGLRenderer({ antialias: opts.antialias ?? true, alpha: true })
    this.renderer.setPixelRatio(this.pixelRatio)
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    container.appendChild(this.renderer.domElement)

    this.camera = new THREE.PerspectiveCamera(35, 1, 0.01, 1000)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.map = new MapStage({
      renderer: this.renderer, scene: this.scene, camera: this.camera, container, gltf: this.gltf,
      dataBase: opts.assetBase + VIEWER_DATA, holder: this.holder, studioLights: [this.keyLight, this.rimLight],
      firstPerson: () => this.firstPerson,
      fixedInspect: () => this.fixed.gameLit,
      exposure: () => this.lighting.exposure,
      lightYaw: () => this.lighting.angle + this.lightSpin,
      onChange: () => this.updateFixedInspect(),
    }, opts.background === undefined ? 0x0b0b12 : opts.background)
    this.fixed = new FixedInspect(this.camera, this.holder, this.renderer.domElement)
    this.scene.environmentIntensity = DEFAULT_LIGHTING.ambient
    this.scene.add(this.keyLight, this.rimLight, this.keyLight.target, this.rimLight.target, this.holder, this.fixed.probe)
    this.loader = new ModelLoader(this.renderer, new TextureSource(opts.assetBase, this.renderer), this.gltf, opts, this.loaded)
    this.attachments = new WeaponAttachments(this.renderer, this.loader, opts.assetBase, this.loaded, () => ({ item: this.item, weaponRoot: this.weaponRoot }))
    this.editor = new AttachmentEditor({
      container, canvas: this.renderer.domElement, camera: this.camera, controls: this.controls, attachments: this.attachments,
      weaponRoot: () => (this.item && this.item.style !== 'glove' ? this.weaponRoot : null),
      allowed: () => !this.firstPerson && this.inspectStart === null,
    })

    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(container)
    this.resize()
    this.placeLights()
    this.renderer.setAnimationLoop((time) => this.tick(time))
    const canvas = this.renderer.domElement
    canvas.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect()
      this.pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1))
    })
    canvas.addEventListener('pointerleave', () => this.pointer.set(0, 0))
    /** First person: left click fires (a gun's shot, a knife's slash), right click is the secondary attack (a stab, the revolver's alt fire). */
    canvas.addEventListener('pointerdown', (e) => {
      if (!this.firstPerson || !this.fpRig?.attacks.length) return
      if (e.button === 0) this.startFire()
      else if (e.button === 2) void this.attack(secondaryAttack(this.fpRig.attacks)?.name)
    })
    window.addEventListener('pointerup', () => this.stopFire())
    window.addEventListener('pointercancel', () => this.stopFire())
    window.addEventListener('blur', () => this.stopFire())
    canvas.addEventListener('contextmenu', (e) => {
      if (this.firstPerson && this.fpRig?.attacks.length) e.preventDefault()
    })
  }

  /** One frame: the viewmodel, the playing animations, the lights, then the draw. */
  private tick(time: number): void {
    const dt = this.lastTick ? (time - this.lastTick) / 1000 : 1 / 60
    this.adapt(time)
    if (this.firstPerson) this.updateViewmodel(time / 1000)
    if (this.inspectStart !== null) this.stepInspect(time)
    else if (this.fpRig?.idleLoop) this.stepIdle(time)
    else if (!this.firstPerson) this.fixed.step(this.autoRotate)
    if (this.agentRig) poseAgent(this.agentRig, (time - this.agentRig.start) / 1000)
    if (this.petRig) this.stepPet(time)
    else if (this.autoRotate) this.holder.rotation.y += 0.004
    if (this.lighting.orbit) this.lightSpin = (this.lightSpin + ORBIT_SPEED) % 360
    this.placeLights()
    for (const finish of this.loaded.finishes) if (isGlove(finish)) finish.update(this.renderer)
    if (!this.firstPerson && !this.fixed.active) this.controls.update()
    this.attachments.step(dt)
    this.map.render()
  }

  /** Stops drawing frames (offscreen) or starts again. */
  setPaused(paused: boolean): void {
    this.renderer.setAnimationLoop(paused ? null : (time) => this.tick(time))
  }

  async load(item: Item): Promise<void> {
    if (item.style !== 'glove') this.lastWeapon = item
    this.clear()
    this.item = item
    const root = item.style === 'glove' ? await this.loader.gloves(item) : await this.loader.weapon(item)
    if (item.style === 'glove') this.placeHands()
    this.weaponRoot = item.style === 'glove' ? null : root
    this.frame(root, item.style !== 'glove')
    await this.attachments.apply()
    this.fixed.patchAdded()
    this.setSeed(item.seed)
  }

  /**
   * First person: the weapon in the idle pose with the agent's arms holding it, seen from the eye (the viewmodel's pose:
   * build_firstperson.py). The arms are the agent's, as in the game: its sleeves, and its arms with its default gloves —
   * or, wearing skin `glove`s, that glove model (its arm in the agent's skin).
   */
  async loadFirstPerson(item: Item, glove: GloveItem | null, agentId: string = DEFAULT_AGENT): Promise<void> { return loadFirstPerson(this, item, glove, agentId) }

  /**
   * On a glove skin's page: first person with just the arms (the agent's sleeves and these gloves, no weapon) playing
   * the glove inspect, then back to the gloves on their own.
   */
  async lookAtGloves(agentId: string = DEFAULT_AGENT): Promise<void> { return lookAtGloves(this, agentId) }

  /** Shows the posed first-person models from the eye. */
  enterFirstPerson(...models: THREE.Object3D[]): void { enterFirstPerson(this, ...models) }

  /** The attack animations the first-person weapon has (a gun's shots, a knife's slashes and stabs). */
  get attacks(): AttackInfo[] {
    return (this.fpRig?.attacks ?? []).map((a) => ({ name: a.name, label: attackLabel(a.name) }))
  }

  attackNext = 0
  readonly attackClips = new Map<string, Promise<InspectClip>>()

  /**
   * Plays one of the weapon's attacks (from the start, over whatever plays): the named clip, or — with no name — the plain
   * fire: a gun's shot, a knife's slashes one after the other.
   * @param name a clip name from `attacks`
   */
  async attack(name?: string): Promise<void> { return attack(this, name) }

  firing = false
  fireTimer: ReturnType<typeof setTimeout> | undefined

  /**
   * Starts firing: one shot, and — on an automatic weapon — a shot every cycle time (the animation restarts each time, so it stays
   * in the kick) until `stopFire`. Semi-automatic weapons and knives play one attack per press.
   */
  startFire(): void { startFire(this) }

  /** Stops the held fire. */
  stopFire(): void { stopFire(this) }

  /** Whether the loaded first-person weapon has an inspect animation. */
  get canInspect(): boolean {
    return !!this.fpRig?.inspect
  }

  /** Plays the first-person weapon's inspect animation (from the start, if it was already playing). */
  inspect(): void { inspect(this) }

  /** Whether first person can look at its skin gloves (the glove inspect). */
  get canInspectGloves(): boolean {
    return !!this.fpRig?.gloveInspect && !!this.fpGlove
  }

  /** First person looks at its gloves: the weapon put away, the arms raise them (from the start if already playing). */
  inspectGloves(): void { inspectGloves(this) }

  /** Poses the animated idle at `now` (ms), looping. */
  private stepIdle(now: number): void { stepIdle(this, now) }

  /** Advances the playing inspect (its clips one after another) to `now` (ms); at its end the idle pose comes back. */
  private stepInspect(now: number): void { stepInspect(this, now) }

  /** Changes the lighting; anything left out keeps its value. */
  setLighting(changes: Partial<Lighting>): void {
    this.lighting = { ...this.lighting, ...changes }
    const l = this.lighting
    this.renderer.toneMappingExposure = l.exposure
    this.map.setExposure(l.exposure)
    this.keyLight.intensity = l.key
    this.keyLight.color.set(l.keyColor)
    this.rimLight.intensity = l.rim
    this.rimLight.color.set(l.rimColor)
    const map = IS_MOBILE_DEVICE ? null : l.map ?? null
    this.scene.environmentIntensity = map ? (l.ambient / DEFAULT_LIGHTING.ambient) * this.mapLighting.reflections : l.ambient
    if (!l.orbit) this.lightSpin = 0
    this.placeLights()
    if (map !== this.map.id) void this.map.load(map)
  }

  /**
   * Puts the key and rim lights in place: around the model in world space, or — in first person, where the camera
   * sits at the origin looking at the weapon from behind, and when asked — relative to the camera, so the side you
   * see is the lit one.
   */
  private placeLights(): void {
    const turn = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(this.lighting.angle + this.lightSpin))
    const target = this.firstPerson ? this.camera.position.clone().add(new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion).multiplyScalar(0.5)) : this.controls.target
    if (this.firstPerson || this.lighting.followCamera) {
      const view = this.camera.quaternion.clone().multiply(turn)
      this.keyLight.position.copy(KEY_FROM_CAMERA).applyQuaternion(view).add(target)
      this.rimLight.position.copy(RIM_FROM_CAMERA).applyQuaternion(view).add(target)
    } else {
      this.keyLight.position.copy(KEY_POSITION).applyQuaternion(turn).add(target)
      this.rimLight.position.copy(RIM_POSITION).applyQuaternion(turn).add(target)
    }
    this.keyLight.target.position.copy(target)
    this.rimLight.target.position.copy(target)
    this.map.place()
  }

  setFloat(f: number): void {
    this.weaponFloat = f
    for (const finish of this.loaded.finishes) finish.setFloat(this.firstPerson && isGlove(finish) ? this.viewmodel.gloveFloat : f)
  }

  /** Changes the first-person viewmodel; anything left out keeps its value. */
  setViewmodel(changes: Partial<Viewmodel>): void {
    const before = this.viewmodel
    this.viewmodel = { ...before, ...changes }
    if (this.agentGlove && (before.gloveFloat !== this.viewmodel.gloveFloat || before.gloveSeed !== this.viewmodel.gloveSeed)) {
      setAgentGloves(this.loaded.finishes, this.agentGlove, this.viewmodel)
    }
    if (!this.firstPerson) return
    if (before.fov !== this.viewmodel.fov) this.resize()
    if (before.gloveFloat !== this.viewmodel.gloveFloat) this.setFloat(this.weaponFloat)
    if (before.gloveSeed !== this.viewmodel.gloveSeed) this.setSeed(this.weaponSeed)
    this.updateViewmodel(performance.now() / 1000)
  }

  /**
   * Places the first-person holder: the default spot plus the offsets, mirrored for the left hand, and — with sway
   * on — leaning toward the pointer and breathing.
   * @param t time in seconds
   */
  updateViewmodel(t: number): void { updateViewmodel(this, t) }

  setSeed(seed: number): void {
    this.weaponSeed = seed
    const item = this.item
    if (!item) return
    for (const finish of this.loaded.finishes) {
      if (isGlove(finish)) setGloveSeed(finish, item.style === 'glove' ? seed : this.viewmodel.gloveSeed ?? this.fpGlove?.seed ?? 1)
      else if (item.style !== 'glove') setWeaponSeed(finish, item, seed)
    }
  }

  dispose(): void {
    this.clear()
    this.attachments.dispose()
    this.editor.dispose()
    this.resizeObserver.disconnect()
    this.renderer.setAnimationLoop(null)
    this.controls.dispose()
    this.renderer.dispose()
    this.renderer.domElement.remove()
    this.map.dispose()
  }

  /**
   * Gloves: both backs facing the camera (default), or the right hand turned palm-up like the official
   * render. The hands are mirror images, so the right one needs the opposite turn to show its back.
   */
  setGlovePalmUp(palmUp: boolean): void {
    this.palmUp = palmUp
    this.placeHands()
  }

  private placeHands(): void {
    for (const { side, mesh } of this.loaded.hands) {
      const turn = side === 'right' && !this.palmUp ? Math.PI / 2 : -Math.PI / 2
      mesh.rotation.set(0, turn, Math.PI)
    }
  }

  /** Whether the fixed game inspect applies: a gun, gloves, an agent, or a charm or sticker on its own, over a map's pre-rendered background, outside first person. */
  get wantsFixedInspect(): boolean {
    const name = this.item?.id.split('|')[0] ?? ''
    if (!this.map.video || !this.map.scene3d?.data.weapon || this.firstPerson) return false
    return !!this.standalone || this.agentShown || this.framedShown || (this.item?.style === 'glove' ? this.gloveGameLight : !!this.item && !!name)
  }

  /** Enters the fixed inspect when it applies, or gives the view back to the orbit. */
  updateFixedInspect(): void { updateFixedInspect(this) }

  /** Gloves on a map: the game's inspect light (true) or the studio's (false). */
  setGloveGameLight(on: boolean): void {
    if (this.gloveGameLight === on) return
    this.gloveGameLight = on
    this.updateFixedInspect()
  }

  /** Center the model and put the camera at its side, far enough for it to fit. */
  frame(root: THREE.Object3D, tiltUpright: boolean, lookX?: boolean): void { frame(this, root, tiltUpright, lookX) }

  isKnife(): boolean { return isKnife(this) }

  /** How knives stand: upright, lying flat, or tilted (the default). */
  setKnifePose(pose: KnifePose): void { setKnifePose(this, pose) }

  /** Where the camera frames the model at the current aspect. */
  homePosition(fov = this.camera.fov): THREE.Vector3 { return homePosition(this, fov) }

  /** Back to the framing the item was loaded with. */
  resetView(): void { resetView(this) }

  /** The initial framing seen from the other side (a half turn around the model). */
  backView(): void { backView(this) }

  /**
   * The item alone from the front (the initial framing) and from the back (a half turn around it), each drawn with
   * `longSide` pixels on its longer side and cut down to what it covers. The camera is left at the front. A knife is
   * shot standing up.
   */
  renderSides(longSide: number): { front: HTMLCanvasElement; back: HTMLCanvasElement } { return renderSides(this, longSide) }

  /**
   * The model alone (no background, map or studio) as the camera sees it, drawn with `longSide` pixels on the view's
   * longer side and cut down to what it covers — for the share image.
   */
  renderItem(longSide: number): HTMLCanvasElement { return renderItem(this, longSide) }

  /** Changes the map lights' strengths (× the game's): sun, the item's lights, scene lights, ambient, reflections. */
  setMapLighting(lighting: MapLighting): void {
    this.mapLighting = { ...lighting }
    this.map.scene3d?.setLightScales(lighting)
    this.map.setBlur(lighting.blur)
    this.fixed.setAmbientScale(lighting.ambient)
    this.setLighting({})
  }

  /**
   * What lights the current view: on a map, the sources the game's inspect rig has on for this item (a weapon, gloves
   * or agent: sun, item light, ambient, scene lights where the map has them; a charm or sticker alone and first
   * person: sun and ambient), with the reflections; over a map without the rig, the studio's lights and the map's; in
   * the studio, its own.
   */
  get lightSources(): LightSource[] {
    if (!this.map.id) return ['studio']
    const scene3d = this.map.scene3d
    const kinds = scene3d?.lightKinds() ?? new Set()
    const out: LightSource[] = this.fixed.gameLit ? [] : ['studio']
    if (kinds.has('sun')) out.push('sun')
    // (outside the game's rig, and in first person, the item lights aren't drawn on the item)
    if (kinds.has('item') && (this.fixed.active || (!this.fixed.gameLit && !this.firstPerson))) out.push('item')
    if (kinds.has('scene')) out.push('scene')
    if (this.fixed.ambientOn) out.push('ambient')
    out.push('reflections')
    return out
  }

  /** The pixels per CSS pixel it draws at now. */
  get pixelRatio(): number {
    const auto = Math.min(devicePixelRatio, 2)
    return this.quality.resolution === 'auto' ? Math.max(0.75, auto * this.adaptiveScale) : this.quality.resolution
  }

  /** The smoothed frame rate. */
  get fps(): number {
    return Math.round(1000 / Math.max(1, this.frameMs))
  }

  /** Changes how finely it draws (antialiasing is fixed for the canvas: see `antialias` in the options). */
  setQuality(quality: RenderQuality): void { setQuality(this, quality) }

  applyPixelRatio(): void { applyPixelRatio(this) }

  /**
   * The adaptive resolution: under ~30 fps (smoothed, over two seconds at least) it draws 20% fewer pixels a side,
   * down to 0.75×; over ~55 fps for a while it goes back up. Only with 'auto' resolution.
   */
  private adapt(time: number): void { adapt(this, time) }

  /** Turns edit mode on (dragging the weapon's stickers and charm, told through `events`) or off (null). */
  setEditing(events: EditorEvents | null): void {
    this.editor.setEnabled(events)
  }

  /** A copy of the frame on screen: held over the view while the next model loads, so nothing blinks. */
  snapshotCanvas(): HTMLCanvasElement {
    this.map.render()
    const source = this.renderer.domElement
    const copy = document.createElement('canvas')
    copy.width = source.width
    copy.height = source.height
    copy.getContext('2d')?.drawImage(source, 0, 0)
    return copy
  }

  /** The current view as a PNG data URL (transparent where the scene has no background). */
  screenshot(): string {
    this.map.render()
    return this.renderer.domElement.toDataURL('image/png')
  }

  clear(): void {
    for (const child of [...this.holder.children]) {
      this.holder.remove(child)
      child.traverse((o) => { if (o instanceof THREE.Mesh) o.geometry.dispose() })
    }
    for (const finish of this.loaded.finishes) finish.dispose()
    for (const dispose of this.loaded.disposables) dispose()
    this.loaded.finishes.length = 0
    this.loaded.disposables.length = 0
    this.loaded.hands.length = 0
    this.item = null
    this.firstPerson = false
    this.fpGlove = null
    this.fpRig = null
    this.agentRig = null
    this.petRig = null
    this.patchLayers = []
    this.agentShown = false
    this.framedShown = false
    this.agentWeaponItem = null
    this.agentGlove = null
    this.inspectStart = null
    this.inspectClips = null
    this.gloveLookItem = null
    this.holder.position.set(0, 0, 0)
    this.holder.rotation.set(0, 0, 0)
    this.holder.scale.set(1, 1, 1)
    this.controls.enabled = true
    this.camera.fov = 35
    this.camera.updateProjectionMatrix()
    this.weaponRoot = null
    this.standalone = null
    this.attachments.reset()
    this.loadToken++
  }

  /** The stickers the weapon wears (up to five, later ones on top); kept across loads. */
  setStickers(list: StickerOptions[]): Promise<void> {
    return this.attachments.setStickers(list).then(() => this.fixed.patchAdded())
  }

  /** The charm on the weapon's keychain point (pattern, custom offset); null = none. Kept across loads. */
  setCharm(opts: CharmOptions | null): Promise<void> {
    return this.attachments.setCharm(opts).then(() => this.fixed.patchAdded())
  }

  /** The item's sticker slots (empty when it has no markup yet). */
  stickerSlots(): number {
    return this.attachments.stickerSlots()
  }

  /** A sticker on its own, as a card; wear 0–1. */
  async showSticker(id: string, wear: number): Promise<void> { return showSticker(this, id, wear) }

  /** A whole agent holding `weapon` (else the last weapon skin loaded), wearing skin `glove`s or its default ones. */
  async showAgent(id: string, glove: GloveItem | null = null, weapon: Item | null = null): Promise<void> { return showAgent(this, id, glove, weapon) }

  /** The patches the agent wears (kept across loads): one per slot, null = empty. */
  async setAgentPatches(worn: (AgentPatch | null)[]): Promise<void> { return setAgentPatches(this, worn) }

  /** The pattern and wear of the weapon the agent holds, without making it the viewer's item. */
  setAgentWeapon(seed: number, float: number): void {
    if (this.agentWeaponItem) setAgentWeapon(this.loaded.finishes, this.agentWeaponItem, seed, float)
  }

  /**
   * A pet on its own (a chicken, the chick, the egg): its model in one of its colours, playing a clip of its skeleton
   * (the named one, else the first idle) in a loop. The roasted chicken has no skeleton animations.
   */
  async showPet(id: string, variant = 0, clipName: string | null = null, agentId: string = DEFAULT_AGENT, hat: string | null = null): Promise<void> { return showPet(this, id, variant, clipName, agentId, hat) }

  /** Paints the pet in colour `index` of its model (the materials of that variant, in mesh order). */
  setPetVariant(index: number): void { setPetVariant(this, index) }

  /** Puts a photo-booth hat on the pet (null: none). */
  setPetHat(name: string | null): Promise<void> { return setPetHat(this, name) }

  /** Plays the named clip of the pet from the start (null: its default idle). */
  async playPetClip(name: string | null): Promise<void> { return playPetClip(this, name) }

  /** Poses the pet at `now` (ms) of its clip, looping. */
  stepPet(now: number): void { stepPet(this, now) }

  /** A collectible pin on its own: its model with the game's material (glitter overlays blended on top). */
  async showPin(id: string): Promise<void> { return showPin(this, id) }

  /**
   * An agent patch on its own, on the game's inspect card (the plastic package, with its hang tab): the embroidered
   * texture is drawn over the card's, scaled and offset as the patch's material says, into one canvas texture.
   */
  async showPatch(id: string): Promise<void> { return showPatch(this, id) }

  /** A charm on its own; pattern 0–100000. */
  async showCharm(id: string, seed: number, sticker?: string | null): Promise<void> { return showCharm(this, id, seed, sticker) }

  /** The sticker slab's sticker when the charm is shown on its own. */
  async setStandaloneCharmSticker(id: string | null): Promise<void> {
    if (this.standalone?.parts) await this.attachments.charmSticker(this.standalone.parts, id)
  }

  /** Shows the sticker on its inspect card (or not). */
  setStandaloneCard(on: boolean): void {
    this.standalone?.setCard?.(on)
  }

  /** The wear of the sticker shown on its own. */
  setStandaloneWear(w: number): void {
    this.standalone?.setWear?.(w)
  }

  /** The pattern of the charm shown on its own. */
  setStandaloneSeed(seed: number): void {
    for (const p of this.standalone?.parts ?? []) p.setSeed(seed)
  }

  resize(): void {
    const w = this.container.clientWidth || 1, h = this.container.clientHeight || 1
    this.camera.aspect = w / h
    /**
     * viewmodel_fov is the viewmodel's vertical angle, as skincraft.gg (which matches the game) draws it: at 16:9 a 68 puts
     * the AWP's scope 1.35x smaller than treating 68 as the horizontal angle at 4:3 (53.4 vertical) did. The canvas' shape
     * only crops the sides.
     */
    this.camera.fov = this.firstPerson ? this.viewmodel.fov : 35
    this.camera.updateProjectionMatrix()
    if (!this.firstPerson) this.fixed.fitFov()
    this.renderer.setSize(w, h)
    this.map.setSize(w, h)
    if (!this.fixed.active && this.fit && this.camera.position.distanceTo(this.home) < 1e-6 * Math.max(1, this.home.length())) {
      this.home.copy(this.homePosition())
      this.camera.position.copy(this.home)
      this.controls.update()
    }
    /**
     * Resizing clears the canvas, and the observer runs after this frame's render: draw again now, or the model
     * blinks out on every step of a resize (the side panel's folding animation is one per frame).
     */
    this.map.render()
  }
}
