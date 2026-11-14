import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { Pass, FullScreenQuad } from 'three/addons/postprocessing/Pass.js'

/** A map's bloom (build_post.py, the .vpost's CBloomLayer). */
export interface SceneBloom {
  /** The sum of the three strengths (all older data has). */
  strength: number
  /** Additive (before the tone curve), screen (after it, over the sRGB colour) and blur (a mix toward the bloom). */
  add?: number
  screen?: number
  blur?: number
  threshold: number
  width?: number
  /** Per blur buffer (1/2, 1/4, 1/8, 1/16, 1/32 of the frame): its weight and tint in the sum. */
  weights?: number[]
  tints?: number[][]
}

/** A map's post-processing (build_post.py, from its .vpost): the game's tone curve, bloom and colour grade. */
export interface ScenePost {
  /** The map's fixed exposure (its post_processing_volume). */
  exposure: number
  /** Valve's filmic curve (Hable's): A shoulder, B linear, C linear angle, D toe, E toe numerator, F toe denominator, W white point. */
  tonemap?: { exposureBias: number; shoulder: number; linear: number; linearAngle: number; toe: number; toeNum: number; toeDenom: number; whitePoint: number }
  bloom?: SceneBloom
  /** The colour lookup table, in display (sRGB) space: size³ RGBA bytes, red fastest. */
  lut?: { file: string; size: number }
}

/** Draws the scene into the composer's HDR buffer with the viewer's own (two-pass) render. */
class DrawPass extends Pass {
  constructor(private readonly draw: () => void) {
    super()
    this.needsSwap = false
  }

  render(renderer: THREE.WebGLRenderer, _write: THREE.WebGLRenderTarget, read: THREE.WebGLRenderTarget): void {
    renderer.setRenderTarget(read)
    renderer.clear()
    this.draw()
  }
}

const VERTEX = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }'

/**
 * CS2's bloom threshold (downsample_bloomthreshold, D_THRESHOLD_MODE 1, as Source 2 Viewer ports it): a 4× downsample
 * of the exposed scene, Karis-weighted (c / (1 + max c)) over 6×6 texels, each tap kept by how far its luminance
 * (× the exposure scalar) passes the threshold over its width, and scaled by the strongest bloom strength.
 */
const THRESHOLD_SHADER = /* glsl */ `
uniform sampler2D tDiffuse;
uniform float exposure;
uniform float toneMapScalar;
uniform vec2 thresholdParams;
uniform float bloomScale;
float max3(vec3 c) { return max(c.r, max(c.g, c.b)); }
vec3 fetchEncoded(ivec2 coord) {
  ivec2 c = clamp(coord, ivec2(0), textureSize(tDiffuse, 0) - 1);
  vec3 color = clamp(texelFetch(tDiffuse, c, 0).rgb, 0.0, 65504.0) * exposure;
  return color / (1.0 + max3(color));
}
vec3 threshold(vec3 color) {
  float lum = dot(color, vec3(0.3, 0.59, 0.11));
  return color * clamp(toneMapScalar * lum * thresholdParams.y + thresholdParams.x, 0.0, 1.0);
}
void main() {
  ivec2 base = ivec2(gl_FragCoord.xy) * 4 - 1;
  vec3 encoded[36];
  for (int y = 0; y < 6; y++) for (int x = 0; x < 6; x++) encoded[y * 6 + x] = fetchEncoded(base + ivec2(x, y));
  vec3 taps[25];
  for (int y = 0; y < 5; y++) for (int x = 0; x < 5; x++) {
    vec3 a = (encoded[y * 6 + x] + encoded[y * 6 + x + 1] + encoded[(y + 1) * 6 + x] + encoded[(y + 1) * 6 + x + 1]) * 0.25;
    taps[y * 5 + x] = threshold(a / (1.0 - max3(a)));
  }
  vec3 center = (taps[6] + taps[8] + taps[16] + taps[18]) * 0.25;
  vec3 tl = (taps[0] + taps[2] + taps[10] + taps[12]) * 0.25;
  vec3 tr = (taps[2] + taps[4] + taps[12] + taps[14]) * 0.25;
  vec3 bl = (taps[10] + taps[12] + taps[20] + taps[22]) * 0.25;
  vec3 br = (taps[12] + taps[14] + taps[22] + taps[24]) * 0.25;
  gl_FragColor = vec4((center * 0.5 + (tl + tr + bl + br) * 0.125) * bloomScale, 1.0);
}
`

/** gaussian_bloom_blur: a 2× downsample (one bilinear tap), the 4-tap Gaussian blurs, and the tent upsample-and-sum. */
const DOWNSAMPLE_SHADER = /* glsl */ `
uniform sampler2D tSource;
uniform vec2 sourceTexel;
void main() { gl_FragColor = vec4(clamp(texture2D(tSource, gl_FragCoord.xy * 2.0 * sourceTexel).rgb, 0.0, 65504.0), 1.0); }
`
const BLUR_SHADER = /* glsl */ `
uniform sampler2D tSource;
uniform vec4 texelSize;
uniform vec2 direction;
void main() {
  float offsets[4] = float[4](-2.196197, -0.430063, 1.0, 2.196197);
  float weights[4] = float[4](0.121596, 0.529213, 0.227595, 0.121596);
  vec3 sum = vec3(0.0);
  for (int i = 0; i < 4; i++) {
    vec2 p = min(gl_FragCoord.xy + direction * offsets[i], texelSize.zw);
    sum += texture2D(tSource, p * texelSize.xy).rgb * weights[i];
  }
  gl_FragColor = vec4(sum, 1.0);
}
`
const UPSAMPLE_SHADER = /* glsl */ `
uniform sampler2D tSource;
uniform sampler2D tCurrent;
uniform vec4 scaleClamp;
uniform vec3 prevTint;
uniform vec3 currTint;
uniform float radius;
void main() {
  vec2 lo = min(scaleClamp.xy * (gl_FragCoord.xy - radius), scaleClamp.zw);
  vec2 hi = min(scaleClamp.xy * (gl_FragCoord.xy + radius), scaleClamp.zw);
  vec2 c = min(scaleClamp.xy * gl_FragCoord.xy, scaleClamp.zw);
  vec3 up = texture2D(tSource, c).rgb * 0.25
    + (texture2D(tSource, lo).rgb + texture2D(tSource, vec2(lo.x, hi.y)).rgb + texture2D(tSource, hi).rgb + texture2D(tSource, vec2(hi.x, lo.y)).rgb) * 0.0625
    + (texture2D(tSource, vec2(c.x, lo.y)).rgb + texture2D(tSource, vec2(c.x, hi.y)).rgb + texture2D(tSource, vec2(lo.x, c.y)).rgb + texture2D(tSource, vec2(hi.x, c.y)).rgb) * 0.125;
  gl_FragColor = vec4(up * prevTint + texture2D(tCurrent, gl_FragCoord.xy * scaleClamp.xy).rgb * currTint, 1.0);
}
`

const MIPS = 4
/** The tent filter's radius (destination pixels), CS2's. */
const TENT_RADIUS = 3.1

const shader = (fragmentShader: string, uniforms: Record<string, THREE.IUniform>) =>
  new THREE.ShaderMaterial({ uniforms, vertexShader: VERTEX, fragmentShader, depthTest: false, depthWrite: false })

const target = () => new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false })

/**
 * CS2's bloom (Source 2 Viewer's BloomRenderer, the Counter-Strike path): the thresholded scene at a quarter of the
 * frame, blurred into 4 buffers (1/4 … 1/32), then summed from the smallest up with the tent filter, each buffer by
 * its weight × tint (the first takes the 1/2 and 1/4 weights). The result goes to the grade, which blends it by the
 * map's modes.
 */
class BloomPass extends Pass {
  readonly output = target()
  private readonly blurred = Array.from({ length: MIPS }, target)
  private readonly scratch = Array.from({ length: MIPS }, target)
  private readonly horizontal = Array.from({ length: MIPS }, target)
  private readonly summed = Array.from({ length: MIPS - 1 }, target)
  private readonly thresholdMaterial: THREE.ShaderMaterial
  private readonly downsample = shader(DOWNSAMPLE_SHADER, { tSource: { value: null }, sourceTexel: { value: new THREE.Vector2() } })
  private readonly blur = shader(BLUR_SHADER, { tSource: { value: null }, texelSize: { value: new THREE.Vector4() }, direction: { value: new THREE.Vector2() } })
  private readonly upsample = shader(UPSAMPLE_SHADER, {
    tSource: { value: null }, tCurrent: { value: null }, scaleClamp: { value: new THREE.Vector4() },
    prevTint: { value: new THREE.Vector3() }, currTint: { value: new THREE.Vector3() }, radius: { value: TENT_RADIUS },
  })
  private readonly quad = new FullScreenQuad()
  private readonly tints: THREE.Vector3[]
  private width = 0
  private height = 0

  constructor(bloom: SceneBloom, readonly scale: number) {
    super()
    this.needsSwap = false
    const width = Math.max(bloom.width ?? 1, 1e-4)
    this.thresholdMaterial = shader(THRESHOLD_SHADER, {
      tDiffuse: { value: null }, exposure: { value: 1 }, toneMapScalar: { value: 1 },
      thresholdParams: { value: new THREE.Vector2(-bloom.threshold / width, 1 / width) }, bloomScale: { value: scale },
    })
    const weights = bloom.weights ?? [0.2, 0.2, 0.2, 0.2, 0.2]
    const tints = bloom.tints ?? weights.map(() => [1, 1, 1])
    this.tints = weights.map((w, i) => new THREE.Vector3(...(tints[i] ?? [1, 1, 1])).multiplyScalar(w))
  }

  /** The exposure the threshold sees: the scalar with the curve's bias, and the scalar alone. */
  setExposure(exposure: number, toneMapScalar: number): void {
    this.thresholdMaterial.uniforms.exposure.value = exposure
    this.thresholdMaterial.uniforms.toneMapScalar.value = toneMapScalar
  }

  private resize(w: number, h: number): void {
    if (w === this.width && h === this.height) return
    this.width = w
    this.height = h
    for (let level = 0; level < MIPS; level++) {
      const s = this.mipSize(level)
      this.blurred[level].setSize(s.x, s.y)
      this.scratch[level].setSize(s.x, s.y)
      this.horizontal[level].setSize(s.x, s.y)
      if (level < MIPS - 1) this.summed[level].setSize(s.x, s.y)
    }
    const s = this.mipSize(0)
    this.output.setSize(s.x, s.y)
  }

  private mipSize(level: number): THREE.Vector2 {
    return new THREE.Vector2(Math.max(1, Math.floor(this.width / 4) >> level), Math.max(1, Math.floor(this.height / 4) >> level))
  }

  private draw(renderer: THREE.WebGLRenderer, material: THREE.ShaderMaterial, out: THREE.WebGLRenderTarget): void {
    this.quad.material = material
    renderer.setRenderTarget(out)
    this.quad.render(renderer)
  }

  render(renderer: THREE.WebGLRenderer, _write: THREE.WebGLRenderTarget, read: THREE.WebGLRenderTarget): void {
    this.resize(read.width, read.height)
    if (this.width < 64 || this.height < 64) return
    this.thresholdMaterial.uniforms.tDiffuse.value = read.texture
    this.draw(renderer, this.thresholdMaterial, this.scratch[0])
    for (let level = 0; level < MIPS; level++) {
      const size = this.mipSize(level)
      let source = this.scratch[0]
      if (level > 0) {
        const from = this.mipSize(level - 1)
        this.downsample.uniforms.tSource.value = this.blurred[level - 1].texture
        this.downsample.uniforms.sourceTexel.value.set(1 / from.x, 1 / from.y)
        this.draw(renderer, this.downsample, this.scratch[level])
        source = this.scratch[level]
      }
      const u = this.blur.uniforms
      u.texelSize.value.set(1 / size.x, 1 / size.y, size.x - 0.5, size.y - 0.5)
      u.tSource.value = source.texture
      u.direction.value.set(1, 0)
      this.draw(renderer, this.blur, this.horizontal[level])
      u.tSource.value = this.horizontal[level].texture
      u.direction.value.set(0, 1)
      this.draw(renderer, this.blur, this.blurred[level])
    }
    /** From the smallest up: each level = the one below, tent-upsampled, + its own blurred buffer × the next weight. */
    const one = new THREE.Vector3(1, 1, 1)
    let below = this.blurred[MIPS - 1]
    for (let level = MIPS - 2; level >= 0; level--) {
      const size = this.mipSize(level)
      const from = this.mipSize(level + 1)
      const u = this.upsample.uniforms
      u.tSource.value = below.texture
      u.tCurrent.value = this.blurred[level].texture
      u.scaleClamp.value.set(1 / size.x, 1 / size.y, (from.x - 0.5) / from.x, (from.y - 0.5) / from.y)
      u.prevTint.value.copy(level === MIPS - 2 ? this.tints[MIPS] : one)
      u.currTint.value.copy(level === 0 ? this.tints[0].clone().add(this.tints[1]) : this.tints[level + 1])
      const out = level === 0 ? this.output : this.summed[level]
      this.draw(renderer, this.upsample, out)
      below = out
    }
  }

  dispose(): void {
    for (const t of [this.output, ...this.blurred, ...this.scratch, ...this.horizontal, ...this.summed]) t.dispose()
    for (const m of [this.thresholdMaterial, this.downsample, this.blur, this.upsample]) m.dispose()
    this.quad.dispose()
  }
}

/**
 * The game's final pass (post_processing.frag in Source 2 Viewer): the exposure, the blur and additive bloom, the tone
 * curve, sRGB, the screen bloom over the encoded colour, then the colour lookup table.
 */
const GRADE_SHADER = /* glsl */ `
precision highp sampler3D;
uniform sampler2D tDiffuse;
uniform sampler2D tBloom;
uniform float useBloom;
uniform vec3 bloomStrengths;
uniform float blurUnnormalized;
uniform sampler3D lut;
uniform float lutSize;
uniform float useLut;
uniform float exposure;
uniform vec4 curveA;
uniform vec3 curveB;
varying vec2 vUv;

vec3 hable(vec3 x) {
  float A = curveA.x, B = curveA.y, C = curveA.z, D = curveA.w, E = curveB.x, F = curveB.y;
  return ((x * (A * x + C * B) + D * E) / (x * (A * x + B) + D * F)) - E / F;
}

vec3 toSrgb(vec3 c) {
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}

void main() {
  vec4 src = texture2D(tDiffuse, vUv);
  // (premultiplied where the frame is see-through, over a background video: graded unpremultiplied)
  float alpha = clamp(src.a, 0.0, 1.0);
  vec3 x = max(src.rgb / max(alpha, 1e-4) * exposure, 0.0);
  vec3 bloom = useBloom > 0.5 ? texture2D(tBloom, vUv).rgb : vec3(0.0);
  x = x * (1.0 - blurUnnormalized) + bloom * bloomStrengths.z + bloom * bloomStrengths.x;
  vec3 c = clamp(hable(x) / hable(vec3(curveB.z)), 0.0, 1.0);
  c = toSrgb(c);
  if (useBloom > 0.5) {
    vec3 screen = bloom * exposure;
    vec3 blend = clamp(screen / (screen + 0.187) * 1.035, 0.0, 1.0) * bloomStrengths.y;
    c = c + blend - c * blend;
  }
  if (useLut > 0.5) c = texture(lut, c * ((lutSize - 1.0) / lutSize) + 0.5 / lutSize).rgb;
  gl_FragColor = vec4(c * alpha, alpha);
}
`

/**
 * The game's look for an inspect map: the frame drawn in HDR, its bloom, then the map's tone curve and colour grade —
 * in place of the viewer's ACES.
 */
export class PostPipeline {
  private readonly composer: EffectComposer
  private readonly bloom: BloomPass | null
  private readonly grade: Pass & { material: THREE.ShaderMaterial }
  private lutTexture: THREE.Data3DTexture | null = null
  /** The map's exposure, and its tone curve's bias (× 2^bias). */
  private readonly mapExposure: number
  private readonly bias: number

  constructor(private readonly renderer: THREE.WebGLRenderer, readonly data: ScenePost, draw: () => void) {
    const size = renderer.getSize(new THREE.Vector2())
    const frame = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: 4 })
    this.composer = new EffectComposer(renderer, frame)
    this.composer.setPixelRatio(renderer.getPixelRatio())
    this.composer.addPass(new DrawPass(draw))
    const b = data.bloom
    /** The modes' strengths (older data: only their sum, taken as additive); the strongest scales the bloom, the grade weighs the modes by it. */
    const strengths = b ? new THREE.Vector3(b.add ?? (b.screen === undefined ? b.strength : 0), b.screen ?? 0, b.blur ?? 0) : new THREE.Vector3()
    const strongest = Math.max(strengths.x, strengths.y, strengths.z)
    this.bloom = b && strongest > 1e-5 ? new BloomPass(b, strongest) : null
    if (this.bloom) this.composer.addPass(this.bloom)
    const t = data.tonemap ?? { exposureBias: 0, shoulder: 0.15, linear: 0.5, linearAngle: 0.1, toe: 0.2, toeNum: 0.02, toeDenom: 0.3, whitePoint: 4 }
    const material = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        tBloom: { value: this.bloom?.output.texture ?? null },
        useBloom: { value: this.bloom ? 1 : 0 },
        bloomStrengths: { value: strongest > 1e-5 ? strengths.clone().divideScalar(strongest) : new THREE.Vector3() },
        blurUnnormalized: { value: this.bloom ? strengths.z : 0 },
        lut: { value: null },
        lutSize: { value: 32 },
        useLut: { value: 0 },
        exposure: { value: 1 },
        curveA: { value: new THREE.Vector4(t.shoulder, t.linear, t.linearAngle, t.toe) },
        curveB: { value: new THREE.Vector3(t.toeNum, t.toeDenom, t.whitePoint) },
      },
      vertexShader: VERTEX,
      fragmentShader: GRADE_SHADER,
    })
    const quad = new FullScreenQuad(material)
    const grade = new (class extends Pass {
      material = material
      render(r: THREE.WebGLRenderer, write: THREE.WebGLRenderTarget, read: THREE.WebGLRenderTarget): void {
        material.uniforms.tDiffuse.value = read.texture
        r.setRenderTarget(this.renderToScreen ? null : write)
        quad.render(r)
      }
    })()
    this.grade = grade
    this.composer.addPass(grade)
    this.mapExposure = data.exposure
    this.bias = Math.pow(2, t.exposureBias)
    this.setExposure(1)
  }

  /** Loads the colour grade. */
  async loadLut(dataBase: string): Promise<void> {
    const lut = this.data.lut
    if (!lut) return
    const bytes = new Uint8Array(await (await fetch(dataBase + lut.file)).arrayBuffer())
    if (bytes.length !== lut.size ** 3 * 4) return
    const texture = new THREE.Data3DTexture(bytes, lut.size, lut.size, lut.size)
    texture.minFilter = texture.magFilter = THREE.LinearFilter
    texture.wrapS = texture.wrapT = texture.wrapR = THREE.ClampToEdgeWrapping
    texture.needsUpdate = true
    this.lutTexture = texture
    const u = this.grade.material.uniforms
    u.lut.value = texture
    u.lutSize.value = lut.size
    u.useLut.value = 1
  }

  /** The viewer's exposure slider, on top of the map's own. */
  setExposure(value: number): void {
    const scalar = value * this.mapExposure
    this.grade.material.uniforms.exposure.value = scalar * this.bias
    this.bloom?.setExposure(scalar * this.bias, scalar)
  }

  setSize(w: number, h: number): void {
    this.composer.setPixelRatio(this.renderer.getPixelRatio())
    this.composer.setSize(w, h)
  }

  render(): void {
    this.composer.render()
  }

  dispose(): void {
    this.composer.dispose()
    this.bloom?.dispose()
    this.grade.material.dispose()
    this.lutTexture?.dispose()
  }
}
