import * as THREE from 'three'

export interface RigLight {
  name: string
  kind: 'item' | 'scene'
  type: 'barn' | 'ortho' | 'omni'
  color: number[]
  position: number[]
  forward: number[]
  up?: number[]
  intensity?: number
  brightness?: number
  near?: number
  range: number
  tan?: number[]
  center?: number[]
  half?: number[]
  shear?: number[]
  soft?: number[]
  roundness?: number
  skirt: number
  skirtNear?: number
  outer?: number
  inner?: number
  atItem?: number
}

export const MAX_BARN_LIGHTS = 4


export const barnDepth = { value: Array.from({ length: MAX_BARN_LIGHTS }, () => new THREE.Vector4(0, 1, 0, 0)) }


export const BARN_GLSL = /* glsl */ `
uniform vec4 uBarnDepth[ ${MAX_BARN_LIGHTS} ];
float barnDepthFade( float z, vec4 b ) {
  float far = b.x + b.y;
  if ( z <= b.x || z >= far ) return 0.0;
  float ndc = far / b.y * ( 1.0 - b.x / z );
  float fade = 1.0;
  if ( b.w > 0.0 ) fade *= smoothstep( 0.0, 1.0, ndc * ( b.x + b.w * b.y ) / ( far * b.w ) );
  if ( b.z > 0.0 ) fade *= smoothstep( 0.0, 1.0, ( 1.0 - ndc ) * ( b.x + ( 1.0 - b.z ) * b.y ) / ( b.x * b.z ) );
  return fade;
}
`
const THREE_FALLOFF = 'light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );'
const BARN_FALLOFF = `if ( spotLight.decay < 0.0 ) light.color *= barnDepthFade( lightDistance * angleCos, uBarnDepth[ int( - spotLight.decay - 0.5 ) ] ) / max( lightDistance * lightDistance, 0.0001 );
			else ${THREE_FALLOFF}`


export function barnLightsChunk(): string {
  return BARN_GLSL + THREE.ShaderChunk.lights_pars_begin.replace(THREE_FALLOFF, BARN_FALLOFF)
}

const smooth = (x: number) => { const t = Math.min(Math.max(x, 0), 1); return t * t * (3 - 2 * t) }

/** The fade toward the frustum's edges at (nx, ny) of its -1…1 section (GetBarnLightSoftEdge); 0 outside. */
export function softEdge(nx: number, ny: number, soft: number[], roundness: number): number {
  const ax = Math.abs(nx), ay = Math.abs(ny)
  if (ax >= 1 || ay >= 1) return 0
  const ix = 1 - soft[0], iy = 1 - soft[1]
  if (roundness === 0) return (ix >= 1 ? 1 : smooth((1 - ax) / (1 - ix))) * (iy >= 1 ? 1 : smooth((1 - ay) / (1 - iy)))
  const p = 2 / roundness, n = -0.5 * roundness
  const inner = ix * iy * Math.pow(Math.max(Math.pow(iy * ax, p) + Math.pow(ix * ay, p), 1e-38), n)
  const outer = Math.pow(Math.max(Math.pow(ax, p) + Math.pow(ay, p), 1e-38), n)
  if (inner < outer) return smooth((1 - outer) / (inner - outer))
  return outer > 1 ? 1 : 0
}

/** The near and far skirts at depth `z` from the apex. */
export function depthFade(z: number, near: number, range: number, skirt: number, skirtNear: number): number {
  const far = near + range
  if (z <= near || z >= far) return 0
  const ndc = (far / range) * (1 - near / z)
  let fade = 1
  if (skirtNear > 0) fade *= smooth((ndc * (near + skirtNear * range)) / (far * skirtNear))
  if (skirt > 0) fade *= smooth(((1 - ndc) * (near + (1 - skirt) * range)) / (near * skirt))
  return fade
}

const EDGE_SIZE = 256
const edgeTextures = new Map<string, THREE.DataTexture>()

/**
 * A barn light's edge fade as a spot light's projected texture: the texture spans the cone (±`reach`, the tangent of
 * its half angle) and holds the fade of the frustum inside it. The spot's projection looks along the light with the
 * light's up axis, its x axis opposite to the frustum's.
 */
function edgeTexture(light: RigLight, reach: number): THREE.DataTexture {
  const tan = light.tan!, center = light.center ?? [0, 0], soft = light.soft ?? [0, 0], roundness = light.roundness ?? 0
  const key = [tan, center, soft, roundness, reach].join()
  let texture = edgeTextures.get(key)
  if (texture) return texture
  const data = new Uint8Array(EDGE_SIZE * EDGE_SIZE * 4)
  for (let j = 0; j < EDGE_SIZE; j++) {
    for (let i = 0; i < EDGE_SIZE; i++) {
      const u = ((i + 0.5) / EDGE_SIZE) * 2 - 1, v = ((j + 0.5) / EDGE_SIZE) * 2 - 1
      const value = Math.round(softEdge((-u * reach) / tan[0] - center[0], (v * reach) / tan[1] - center[1], soft, roundness) * 255)
      data.set([value, value, value, 255], (j * EDGE_SIZE + i) * 4)
    }
  }
  texture = new THREE.DataTexture(data, EDGE_SIZE, EDGE_SIZE, THREE.RGBAFormat)
  texture.minFilter = texture.magFilter = THREE.LinearFilter
  texture.needsUpdate = true
  edgeTextures.set(key, texture)
  return texture
}

const vec = (v: number[]) => new THREE.Vector3(v[0], v[1], v[2])

/**
 * A rig light as three lights (with their targets), added to `group`. three's Lambert divides the irradiance by π and
 * the engine's doesn't, so every strength is × π.
 * @param item where the item is (the scene's frame): what a light without a per-pixel slot is evaluated at
 * @param slot the per-pixel barn slot (edges projected, depth fades in the shader), or -1 to evaluate it at the item
 */
export function addRigLight(group: THREE.Group, l: RigLight, item: THREE.Vector3, slot: number): void {
  const color = new THREE.Color().setRGB(l.color[0], l.color[1], l.color[2])
  const position = vec(l.position), forward = vec(l.forward)
  const rel = item.clone().sub(position)
  let light: THREE.Light
  if (l.type === 'barn') {
    const tan = l.tan!, center = l.center ?? [0, 0], near = l.near!
    /** The cone holds the whole frustum (its corners, with a margin for the cone's own edge); the frustum cuts the light. */
    const angle = Math.atan(Math.hypot(tan[0] * (1 + Math.abs(center[0])), tan[1] * (1 + Math.abs(center[1]))) * 1.06)
    const reach = Math.tan(angle)
    const spot = new THREE.SpotLight(color, l.intensity! * Math.PI, 0, angle, 0.02, 2)
    if (slot >= 0) {
      spot.decay = -(slot + 1)
      spot.map = edgeTexture(l, reach)
      spot.shadow.camera.near = 0.01
      spot.shadow.camera.far = near + l.range
      spot.userData.barnUp = vec(l.up!)
      barnDepth.value[slot].set(near, l.range, l.skirt, l.skirtNear ?? 0)
    } else {
      const up = vec(l.up!), right = up.clone().cross(forward), z = rel.dot(forward)
      const edge = z > 0 ? softEdge((near * rel.dot(right)) / z / (tan[0] * near) - center[0], (near * rel.dot(up)) / z / (tan[1] * near) - center[1], l.soft ?? [0, 0], l.roundness ?? 0) : 0
      spot.intensity *= edge * depthFade(z, near, l.range, l.skirt, l.skirtNear ?? 0)
    }
    spot.position.copy(position)
    spot.target.position.copy(position).add(forward)
    group.add(spot.target)
    light = spot
  } else if (l.type === 'ortho') {
    const up = vec(l.up!), right = up.clone().cross(forward), z = rel.dot(forward), depth = z / l.range
    const half = l.half!, shear = l.shear ?? [0, 0], skirtNear = l.skirtNear ?? 0
    const inside = z > 0 && z < l.range
    const edge = inside ? softEdge((rel.dot(right) - shear[0] * depth) / half[0], (rel.dot(up) - shear[1] * depth) / half[1], l.soft ?? [0, 0], l.roundness ?? 0) : 0
    const fade = inside ? (skirtNear > 0 ? smooth(depth / skirtNear) : 1) * (l.skirt > 0 ? smooth((1 - depth) / l.skirt) : 1) : 0
    const sun = new THREE.DirectionalLight(color, l.brightness! * Math.PI * edge * fade)
    sun.position.copy(forward).negate()
    sun.target.position.set(0, 0, 0)
    group.add(sun.target)
    light = sun
  } else {
    const d = rel.length()
    const fade = d < l.range ? smooth((l.range - d) / Math.max(l.skirt * l.range, 1e-6)) : 0
    let cone = 1
    const outer = l.outer ?? 180
    if (outer < 180 && d > 0) {
      const cosOuter = Math.cos(THREE.MathUtils.degToRad(outer))
      const cosInner = (l.inner ?? 0) > 0 ? Math.cos(THREE.MathUtils.degToRad(Math.min(l.inner!, outer - 0.001))) : 1
      cone = Math.min(Math.max((rel.dot(forward) / d - cosOuter) / Math.max(cosInner - cosOuter, 1e-7), 0), 1)
    }
    const point = new THREE.PointLight(color, l.intensity! * Math.PI * fade * cone, 0, 2)
    point.position.copy(position)
    light = point
  }
  light.userData.lightKind = l.kind
  light.userData.baseIntensity = light.intensity
  group.add(light)
}
