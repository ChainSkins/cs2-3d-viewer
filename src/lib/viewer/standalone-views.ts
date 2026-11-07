import type { SkinViewer } from '@/lib/viewer/skin-viewer'
import * as THREE from 'three'
import { loadAttachments } from '@/lib/data/attachments'
import { GAME_ROOT } from '@/lib/data/catalog'
import { loadPatches } from '@/lib/data/patches'
import { loadPins } from '@/lib/data/pins'
import { packStickers, stickerCard } from '@/lib/materials/sticker'

/** Things shown on their own, framed and lit like the item they replace: a sticker (as a card), a pin, an agent patch and a charm. */

/**
 * The game's sticker card: a grey rounded card with a triangle pattern and a faint CS2 mark (materials/default/stickers/sticker_default_backing).
 * models/inventory_items/sticker_inspect/sticker_backing is the same card with a darker mark; skincraft.gg, which follows the game, shows this fainter one.
 */
const STICKER_CARD = 'materials/default/stickers/sticker_default_backing_psd_a8e114d8.png'
/** The card's side in sticker sides: the card is the sticker's own size, as skincraft.gg (which follows the game) draws it: measured against it, 1.02 matched. */
const STICKER_CARD_SIDE = 1.02
/** A pin's face looks along the model's X: turned this far to face the camera. */
export const PIN_VIEW = { turn: -90, room: 1 }

/** A sticker on its own, as a card; wear 0–1. */
export async function showSticker(v: SkinViewer, id: string, wear: number): Promise<void> {
  v.clear()
  const token = v.loadToken
  const { def, sources } = await v.attachments.stickerLook(id)
  if (token !== v.loadToken) return
  const textures = packStickers(v.renderer, [sources])
  const card = stickerCard(def, textures)
  card.setWear(wear)
  v.loaded.disposables.push(() => { (card.mesh.material as THREE.Material).dispose(); textures.dispose() })
  const root = new THREE.Group()
  root.add(card.mesh)
  /** The card behind the sticker (alpha-tested: its corners are round), hidden until asked for. */
  const backing = new THREE.Mesh(new THREE.PlaneGeometry(STICKER_CARD_SIDE, STICKER_CARD_SIDE), new THREE.MeshStandardMaterial({ roughness: 0.47, metalness: 0, alphaTest: 0.5, side: THREE.DoubleSide }))
  const uv = backing.geometry.getAttribute('uv')
  for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - uv.getY(i))
  backing.position.z = -0.004
  backing.visible = false
  root.add(backing)
  void v.loader.textures.load(GAME_ROOT + STICKER_CARD, true).then((map) => {
    if (token !== v.loadToken) return
    const m = backing.material as THREE.MeshStandardMaterial
    m.map = map
    m.needsUpdate = true
  }).catch(() => {})
  v.loaded.disposables.push(() => { backing.geometry.dispose(); (backing.material as THREE.Material).dispose() })
  /** With the card on, everything shrinks so the card takes the room the sticker had (the framing stays the sticker's). */
  const setCard = (on: boolean) => {
    backing.visible = on
    root.scale.setScalar(on ? 1 / STICKER_CARD_SIDE : 1)
  }
  v.standalone = { setWear: card.setWear, setCard }
  v.frame(root, false)
}

/** A collectible pin on its own: its model with the game's material (glitter overlays blended on top). */
export async function showPin(v: SkinViewer, id: string): Promise<void> {
  v.clear()
  const token = v.loadToken
  const pins = await loadPins(v.opts.assetBase)
  const entry = pins.pin.get(id)
  const model = entry && pins.models[entry.model]
  if (!model) throw new Error('No pin ' + id)
  const gltf = await v.loader.gltf.loadAsync(v.loader.textures.url(GAME_ROOT + model.glb))
  if (token !== v.loadToken) return
  const root = new THREE.Group()
  gltf.scene.updateMatrixWorld(true)
  v.framedShown = true
  let i = 0
  gltf.scene.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return
    const call = model.drawCalls[i++] ?? model.drawCalls[0]
    const g = o.geometry.clone().applyMatrix4(o.matrixWorld)
    const material = v.loader.plainMaterial(call)
    /**
     * A pin's metal map has the metalness in G and nothing in R (plainMaterial reads R as roughness: a mirror that
     * reflects the dark stage). Enamel is glossy, the metal polished but not a mirror.
     */
    const compile = material.onBeforeCompile
    material.onBeforeCompile = (shader, renderer) => {
      compile.call(material, shader, renderer)
      shader.fragmentShader = shader.fragmentShader.replace('roughnessFactor = texture2D(roughnessMap, vRoughnessMapUv).r;',
        'roughnessFactor = mix(0.5, 0.3, texture2D(roughnessMap, vRoughnessMapUv).g);')
    }
    material.customProgramCacheKey = () => 'pin'
    /** The sparkle layers (a glitter texture, tinted) shine over the pin instead of covering it. */
    if (call.color?.includes('glitter')) {
      material.transparent = true
      material.blending = THREE.AdditiveBlending
      material.depthWrite = false
    }
    root.add(new THREE.Mesh(g, material))
  })
  v.frame(root, false)
}

/**
 * An agent patch on its own, on the game's inspect card (the plastic package, with its hang tab): the embroidered
 * texture is drawn over the card's, scaled and offset as the patch's material says, into one canvas texture.
 */
export async function showPatch(v: SkinViewer, id: string): Promise<void> {
  v.clear()
  const token = v.loadToken
  const patches = await loadPatches(v.opts.assetBase)
  const entry = patches.patch.get(id)
  if (!entry) throw new Error('No patch ' + id)
  const t = v.loader.textures
  const [card, normal, patch] = await Promise.all([
    t.load(GAME_ROOT + patches.card.color, true), t.load(GAME_ROOT + patches.card.normal, false), t.load(GAME_ROOT + entry.texture, true),
  ])
  if (token !== v.loadToken) return
  const size = 1024
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(card.image as CanvasImageSource, 0, 0, size, size)
  const side = size * 0.5 * entry.scale
  ctx.translate(size / 2 + entry.offset[0] * size, size / 2 - entry.offset[1] * size)
  ctx.rotate(THREE.MathUtils.degToRad(entry.rotation))
  ctx.scale(1, entry.squash)
  ctx.drawImage(patch.image as CanvasImageSource, -side / 2, -side / 2, side, side)
  const map = new THREE.CanvasTexture(canvas)
  map.flipY = false
  map.colorSpace = THREE.SRGBColorSpace
  map.anisotropy = card.anisotropy
  const geometry = new THREE.PlaneGeometry(1, 1)
  const uv = geometry.getAttribute('uv')
  for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - uv.getY(i))
  const material = new THREE.MeshStandardMaterial({ map, normalMap: normal, roughness: 0.8, metalness: 0, side: THREE.DoubleSide, transparent: true })
  v.loaded.disposables.push(() => { material.dispose(); map.dispose() })
  const mesh = new THREE.Mesh(geometry, material)
  v.standalone = {}
  v.frame(mesh, false)
}

/** A charm on its own; pattern 0–100000. */
export async function showCharm(v: SkinViewer, id: string, seed: number, sticker?: string | null): Promise<void> {
  v.clear()
  const token = v.loadToken
  const def = (await loadAttachments(v.opts.assetBase)).charm.get(id)
  if (!def) throw new Error('No charm ' + id)
  const built = await v.attachments.buildCharm(def)
  if (token !== v.loadToken) return
  for (const p of built.parts) p.setSeed(seed)
  await v.attachments.charmSticker(built.parts, sticker)
  v.loaded.disposables.push(() => { for (const p of built.parts) p.material.dispose() })
  v.standalone = { parts: built.parts }
  v.frame(built.model, false)
}
