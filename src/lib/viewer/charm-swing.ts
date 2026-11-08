import * as THREE from 'three'
import { poseRig, SkinnedGeometry, type ArmsSkeleton } from '@/lib/viewer/firstperson'

/**
 * How a charm swings on the weapon. In the game a charm's model carries a cloth simulation (its PHYS block): the nodes of
 * its first bone follow the weapon's keychain point and the rest fall under gravity (360 in/s², no damping), held by
 * hinge limits between the bones. Here the bones are a chain of particles under that gravity: the first one is pinned to the
 * weapon wherever it goes (first-person sway and animations, the turning of the model), each link keeps its length and
 * may lean only so far off its bind direction (the hinge limits, simplified to a cone), and the bones are turned to follow.
 * What the game also does, and this does not: the rigid quads between the nodes, and the charm bumping into the weapon.
 */

/** The game's gravity for the nodes (flGravity, inches per second²), in metres (the models' unit in the glb). */
const GRAVITY = 360 * 0.0254
const K = 0.0254
/** The share of its speed a particle keeps each step: the game has no damping, a little keeps the charm from ringing on. */
const KEEP = 0.992
/** How far a link may lean off where its parent link points it (radians): the first hangs from the weapon, the rest from each other. */
const LEAN_FIRST = 0.8
const LEAN = 1.2
const SUBSTEP = 1 / 90

/** Source (x forward, y left, z up, inches) → the glb's space (y, z, x) × 0.0254, and back. */
const toGl = (v: THREE.Vector3) => new THREE.Vector3(v.y * K, v.z * K, v.x * K)
const toSource = (v: THREE.Vector3) => new THREE.Vector3(v.z / K, v.x / K, v.y / K)

/** The bones of a charm as a chain (each bone's parent is the one before it): the only shape the swing handles. */
export const isChain = (skeleton: ArmsSkeleton): boolean => skeleton.bones.length >= 2 && skeleton.parents.every((p, i) => p === i - 1)

export class CharmSwing {
  /** Bind pose per bone: position (glb space, metres) and world rotation (Source space), and the link directions. */
  private readonly bindPos: THREE.Vector3[] = []
  private readonly bindRot: THREE.Quaternion[] = []
  private readonly bindDir: THREE.Vector3[] = []
  private readonly length: number[] = []
  private readonly q: THREE.Vector3[] = []
  private readonly prev: THREE.Vector3[] = []
  private ready = false

  /**
   * @param skeleton the charm's bones, joint1 hanging from the weapon (charm_physics.json)
   * @param geometries the charm's skinned meshes
   * @param model the charm's model: its world matrix says where the weapon has it
   */
  constructor(private readonly skeleton: ArmsSkeleton, private readonly geometries: SkinnedGeometry[], private readonly model: THREE.Object3D) {
    const world: THREE.Matrix4[] = []
    skeleton.bones.forEach((_, i) => {
      const m = new THREE.Matrix4().compose(new THREE.Vector3(...skeleton.pos[i]), new THREE.Quaternion(...skeleton.rot[i]), new THREE.Vector3(1, 1, 1))
      world.push(i === 0 ? m : world[i - 1].clone().multiply(m))
    })
    for (const m of world) {
      const p = new THREE.Vector3(), r = new THREE.Quaternion()
      m.decompose(p, r, new THREE.Vector3())
      this.bindPos.push(toGl(p))
      this.bindRot.push(r)
    }
    const n = this.bindPos.length
    /** The charm's body hangs below the last bone: one more particle at the end of the chain, where the body's weight is. */
    const last = this.bindPos[n - 1].clone().sub(this.bindPos[n - 2]).normalize()
    this.bindPos.push(this.bindPos[n - 1].clone().addScaledVector(last, this.bodyReach(n - 1, last)))
    for (let i = 1; i <= n; i++) {
      this.length.push(this.bindPos[i].distanceTo(this.bindPos[i - 1]))
      this.bindDir.push(this.bindPos[i].clone().sub(this.bindPos[i - 1]).normalize())
    }
  }

  /** How far below the last bone the body's weight is: the mean distance along the chain of the vertices that bone moves most. */
  private bodyReach(bone: number, along: THREE.Vector3): number {
    let sum = 0, count = 0
    const p = new THREE.Vector3()
    for (const { geometry } of this.geometries) {
      const pos = geometry.getAttribute('position'), idx = geometry.getAttribute('skinIndex'), wt = geometry.getAttribute('skinWeight')
      if (!idx || !wt) continue
      for (let v = 0; v < pos.count; v++) {
        let best = 0
        for (let k = 1; k < 4; k++) if (wt.getComponent(v, k) > wt.getComponent(v, best)) best = k
        if (idx.getComponent(v, best) !== bone || wt.getComponent(v, best) < 0.5) continue
        sum += p.fromBufferAttribute(pos, v).sub(this.bindPos[bone]).dot(along)
        count++
      }
    }
    return Math.max(0.004, count ? sum / count : 0)
  }

  /** Back to hanging as it was modelled (the charm was placed again). */
  reset(): void {
    this.ready = false
  }

  /** Moves the chain for `dt` seconds with the weapon where it is now, and poses the charm's meshes on it. */
  step(dt: number): void {
    this.model.updateWorldMatrix(true, false)
    const W = this.model.matrixWorld
    const s = new THREE.Vector3().setFromMatrixScale(W).x
    if (!(s > 0) || !Number.isFinite(W.elements[12])) return
    const n = this.bindPos.length
    if (!this.ready) {
      this.q.length = this.prev.length = 0
      for (const p of this.bindPos) {
        this.q.push(p.clone().applyMatrix4(W))
        this.prev.push(p.clone().applyMatrix4(W))
      }
      this.ready = true
    }
    const steps = Math.min(4, Math.max(1, Math.round(Math.min(dt, 1 / 20) / SUBSTEP)))
    const h = Math.min(dt, 1 / 20) / steps
    const WRot = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().extractRotation(W))
    const pin = this.bindPos[0].clone().applyMatrix4(W)
    const fall = GRAVITY * s * h * h
    for (let k = 0; k < steps; k++) {
      this.q[0].copy(pin)
      this.prev[0].copy(pin)
      for (let i = 1; i < n; i++) {
        const now = this.q[i].clone()
        this.q[i].add(now.clone().sub(this.prev[i]).multiplyScalar(KEEP))
        this.q[i].y -= fall
        this.prev[i].copy(now)
      }
      for (let it = 0; it < 8; it++) this.constrain(s, WRot)
    }
    this.pose(W)
  }

  /** Keeps the links' lengths and leans: each particle is moved onto where its link may reach. */
  private constrain(s: number, WRot: THREE.Quaternion): void {
    const n = this.bindPos.length
    let frame = WRot.clone()
    for (let i = 1; i < n; i++) {
      const a = this.q[i - 1], b = this.q[i]
      const dir = b.clone().sub(a)
      const len = dir.length() || 1e-9
      dir.divideScalar(len)
      /** Where the link would point if its parent link's turn since the bind were its own. */
      const ref = this.bindDir[i - 1].clone().applyQuaternion(frame)
      const limit = i === 1 ? LEAN_FIRST : LEAN
      const angle = ref.angleTo(dir)
      if (angle > limit) {
        const axis = new THREE.Vector3().crossVectors(ref, dir)
        if (axis.lengthSq() > 1e-12) dir.copy(ref).applyAxisAngle(axis.normalize(), limit)
      }
      b.copy(a).addScaledVector(dir, this.length[i - 1] * s)
      /** The next link's reference turns by as much as this one did from its bind direction. */
      frame = new THREE.Quaternion().setFromUnitVectors(this.bindDir[i - 1].clone().applyQuaternion(WRot), dir).multiply(WRot)
    }
  }

  /** The bones' pose (Source space, each in its parent's) from the chain, and the skinned meshes on it. */
  private pose(W: THREE.Matrix4): void {
    const inv = W.clone().invert()
    const n = this.skeleton.bones.length
    const pos: THREE.Vector3[] = [], rot: THREE.Quaternion[] = []
    for (let i = 0; i < n; i++) {
      pos.push(toSource(this.q[i].clone().applyMatrix4(inv)))
      const from = toSource(this.bindPos[i + 1].clone().sub(this.bindPos[i])).normalize()
      const to = toSource(this.q[i + 1].clone().applyMatrix4(inv).sub(this.q[i].clone().applyMatrix4(inv))).normalize()
      rot.push(i === 0 ? this.bindRot[0].clone() : new THREE.Quaternion().setFromUnitVectors(from, to).multiply(this.bindRot[i]))
    }
    const posed = this.skeleton.bones.map((_, i): [number[], number[], number] => {
      if (i === 0) return [pos[0].toArray(), rot[0].toArray(), 1]
      const inverse = rot[i - 1].clone().invert()
      const t = pos[i].clone().sub(pos[i - 1]).applyQuaternion(inverse)
      return [t.toArray(), inverse.multiply(rot[i]).toArray(), 1]
    })
    poseRig([{ skeleton: this.skeleton, geometries: this.geometries }], { clip: 'charm', viewmodel: { bones: this.skeleton.bones, parents: this.skeleton.parents, pose: posed } })
  }
}

const skeletons = new Map<string, Promise<Record<string, ArmsSkeleton>>>()

/** The bones of every charm (charm_physics.json, by charm id); loaded once per asset root. */
export function loadCharmSkeletons(dataBase: string): Promise<Record<string, ArmsSkeleton>> {
  let p = skeletons.get(dataBase)
  if (!p) {
    p = fetch(dataBase + 'charm_physics.json').then((r) => (r.ok ? (r.json() as Promise<Record<string, ArmsSkeleton>>) : {}), () => ({}))
    skeletons.set(dataBase, p)
  }
  return p
}

/** The swing of a charm's model, or null when its bones are not a simple chain (or its meshes have no weights). */
export function swingFor(skeleton: ArmsSkeleton | undefined, model: THREE.Object3D): CharmSwing | null {
  if (!skeleton || !isChain(skeleton)) return null
  const geometries: SkinnedGeometry[] = []
  model.traverse((o) => {
    if (o instanceof THREE.Mesh && o.geometry.getAttribute('skinIndex')) geometries.push(new SkinnedGeometry(o.geometry))
  })
  return geometries.length ? new CharmSwing(skeleton, geometries, model) : null
}
