import type { SkinViewer } from '@/lib/viewer/skin-viewer'
import * as THREE from 'three'
import { cropToContent } from '@/lib/canvas'
import { petView } from '@/lib/viewer/pet-view'
import { PIN_VIEW } from '@/lib/viewer/standalone-views'

/** Where the camera stands: fitting a model in the view, the home position, the other side, the fixed game inspect over a map, the knife poses and the renders of both sides. */

export type KnifePose = 'vertical' | 'horizontal' | 'tilted'

/** How far a knife (modelled upright) leans over for each pose. */
const KNIFE_TILT: Record<KnifePose, number> = { vertical: 0, tilted: 0.95, horizontal: Math.PI / 2 }

/** Center the model and put the camera at its side, far enough for it to fit. */
export function frame(v: SkinViewer, root: THREE.Object3D, tiltUpright: boolean, lookX?: boolean): void {
  root.userData.framedFrom ??= { position: root.position.clone(), rotation: root.rotation.clone() }
  let size = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3())
  if (tiltUpright && size.y > Math.max(size.x, size.z)) {
    const angle = v.isKnife() ? KNIFE_TILT[v.knifePose] : 0.95
    if (size.x <= size.z) root.rotation.x = -angle
    else root.rotation.z = angle
    root.updateMatrixWorld(true)
  }
  const box = new THREE.Box3().setFromObject(root)
  size = box.getSize(new THREE.Vector3())
  root.position.sub(box.getCenter(new THREE.Vector3()))
  v.holder.rotation.set(0, 0, 0)
  v.holder.add(root)
  lookX ??= size.x <= size.z
  v.fit = { size, lookX, side: lookX ? new THREE.Vector3(1, 0.08, 0.12) : new THREE.Vector3(0.12, 0.08, 1) }
  v.home.copy(v.homePosition())
  v.camera.position.copy(v.home)
  v.controls.target.set(0, 0, 0)
  v.controls.update()
  v.updateFixedInspect()
}

/** Where the camera frames the model at the current aspect. */
export function homePosition(v: SkinViewer, fov = v.camera.fov): THREE.Vector3 {
  const { size, side, lookX } = v.fit!
  const across = lookX ? size.z : size.x
  /** The model's depth along the view: its near side is half of it closer (a round charm would overflow without it). */
  const depth = lookX ? size.x : size.z
  const halfTan = Math.tan(THREE.MathUtils.degToRad(fov / 2))
  const dist = depth / 2 + Math.max(size.y / halfTan, across / (halfTan * v.camera.aspect)) * 0.62
  return side.clone().multiplyScalar(dist)
}

/** Back to the framing the item was loaded with. */
export function resetView(v: SkinViewer): void {
  // (on a map's fixed inspect: the game's own view back)
  if (v.fixed.active) { v.fixed.reset(); return }
  v.holder.rotation.set(0, 0, 0)
  if (v.fit) v.home.copy(v.homePosition())
  v.camera.position.copy(v.home)
  v.controls.target.set(0, 0, 0)
  v.controls.update()
}

/** The initial framing seen from the other side (a half turn around the model). */
export function backView(v: SkinViewer): void {
  if (v.firstPerson) return
  v.resetView()
  if (v.fixed.active) { v.fixed.flip(); return }
  v.camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI)
  v.controls.update()
}

/** Enters the fixed inspect when it applies, or gives the view back to the orbit. */
export function updateFixedInspect(v: SkinViewer): void {
  const scene3d = v.map.scene3d
  scene3d?.setLightScales(v.mapLighting)
  if (v.firstPerson) {
    v.fixed.lightFirstPerson(scene3d)
    v.applyLook()
    return
  }
  if (v.fixed.gameLit && !v.fixed.active) {
    v.fixed.lightFirstPerson(null)
    scene3d?.useLights(scene3d.data.lights, scene3d.data.sceneLights ?? [])
    v.applyLook()
  }
  if (!v.wantsFixedInspect || !scene3d) {
    if (v.fixed.exit(scene3d)) {
      v.setLighting({})
      v.controls.enabled = !v.firstPerson
      if (!v.firstPerson) v.resetView()
    }
    return
  }
  v.controls.enabled = false
  const glove = v.item?.style === 'glove'
  const studio = v.fit ? { distance: v.homePosition(35).length(), fov: 35 } : undefined
  if ((v.standalone || v.agentShown || v.framedShown || glove) && v.fit) {
    v.fixed.enter(scene3d, 'weapon_glock', { radius: v.agentShown ? v.fit.size.y * 0.4 : (v.fit.size.length() / 2) * (v.petRig ? petView(v.petRig.model.glb).room : v.framedShown ? PIN_VIEW.room : 1), sunOnly: !!v.standalone, face: !v.standalone?.parts, turn: v.petRig ? petView(v.petRig.model.glb).turn : v.framedShown ? PIN_VIEW.turn : 0, studio: glove && !v.agentShown && !v.standalone ? studio : undefined },
      /** The game's rig by its inspect scene: a sticker or charm (1), an agent (none), a pet (9), a display item (3), gloves (7). */
      v.standalone ? 'small' : v.agentShown ? 'character' : v.petRig ? 'pet' : v.framedShown ? 'display' : 'gloves')
  } else if (/knife|bayonet/.test(v.item!.id.split('|')[0]) && v.fit) {
    v.fixed.enter(scene3d, 'weapon_glock', { radius: v.fit.size.length() / 2, studio }, 'knife')
  } else {
    v.fixed.enter(scene3d, v.item!.id.split('|')[0])
  }
  v.applyLook()
  v.map.place()
}

/**
 * The item alone from the front (the initial framing) and from the back (a half turn around it), each drawn with
 * `longSide` pixels on its longer side and cut down to what it covers. The camera is left at the front. A knife is
 * shot standing up.
 */
export function renderSides(v: SkinViewer, longSide: number): { front: HTMLCanvasElement; back: HTMLCanvasElement } {
  /** Over a map the item is the one that turns, in the frame loop's step: it has to be applied before drawing now. */
  const settle = () => { if (v.fixed.active) v.fixed.step() }
  /** A knife is shot standing up (whatever pose the viewer shows it in), and left as it was. */
  const pose = v.knifePose
  if (v.isKnife()) v.setKnifePose('vertical')
  v.resetView()
  settle()
  const front = v.renderItem(longSide)
  v.backView()
  settle()
  const back = v.renderItem(longSide)
  if (v.isKnife()) v.setKnifePose(pose)
  v.resetView()
  settle()
  return { front, back }
}

/**
 * The model alone (no background, map or studio) as the camera sees it, drawn with `longSide` pixels on the view's
 * longer side and cut down to what it covers — for the share image.
 */
export function renderItem(v: SkinViewer, longSide: number): HTMLCanvasElement {
  const size = v.renderer.getSize(new THREE.Vector2())
  const ratio = v.renderer.getPixelRatio()
  const scale = Math.min(longSide, v.renderer.capabilities.maxTextureSize, 8192) / Math.max(size.x, size.y)
  const background = v.scene.background
  const root = v.map.scene3d?.root
  const rootVisible = root?.visible ?? false
  v.scene.background = null
  if (root) root.visible = false
  v.renderer.setPixelRatio(1)
  v.renderer.setSize(Math.round(size.x * scale), Math.round(size.y * scale), false)
  v.renderer.render(v.scene, v.camera)
  // (read before the frame ends: the drawing buffer isn't kept)
  const image = cropToContent(v.renderer.domElement)
  v.scene.background = background
  if (root) root.visible = rootVisible
  v.renderer.setPixelRatio(ratio)
  v.renderer.setSize(size.x, size.y, false)
  v.map.render()
  return image
}

/** How knives stand: upright, lying flat, or tilted (the default). */
export function setKnifePose(v: SkinViewer, pose: KnifePose): void {
  if (v.knifePose === pose) return
  v.knifePose = pose
  const root = v.weaponRoot
  const from = root?.userData.framedFrom as { position: THREE.Vector3; rotation: THREE.Euler } | undefined
  if (!root || !from || !v.isKnife() || v.firstPerson) return
  // The framing measures the model as it stands: turned by a drag, it would be framed off center once the turn is undone.
  v.resetView()
  if (v.fixed.active) v.fixed.step()
  root.position.copy(from.position)
  root.rotation.copy(from.rotation)
  // (from the holder down: the model's world matrix is built on the holder's, which the reset just turned back)
  v.holder.updateMatrixWorld(true)
  v.frame(root, true)
  v.resetView()
}

export function isKnife(v: SkinViewer): boolean {
  return !!v.item && /knife|bayonet/.test(v.item.id.split('|')[0])
}
