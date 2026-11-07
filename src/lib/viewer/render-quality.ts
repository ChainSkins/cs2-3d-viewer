import type { SkinViewer } from '@/lib/viewer/skin-viewer'
import { type RenderQuality } from '@/lib/viewer/viewer-options'

/** How finely it draws: the resolution, and the adaptive scale that follows the frame rate. */

/** Changes how finely it draws (antialiasing is fixed for the canvas: see `antialias` in the options). */
export function setQuality(v: SkinViewer, quality: RenderQuality): void {
  if (quality.resolution !== v.quality.resolution || !quality.adaptive) v.adaptiveScale = 1
  v.quality = { ...quality }
  v.map.setPostEnabled(quality.post)
  v.applyPixelRatio()
}

export function applyPixelRatio(v: SkinViewer): void {
  const ratio = v.pixelRatio
  if (Math.abs(ratio - v.renderer.getPixelRatio()) < 1e-3) return
  v.renderer.setPixelRatio(ratio)
  v.resize()
}

/**
 * The adaptive resolution: under ~30 fps (smoothed, over two seconds at least) it draws 20% fewer pixels a side,
 * down to 0.75×; over ~55 fps for a while it goes back up. Only with 'auto' resolution.
 */
export function adapt(v: SkinViewer, time: number): void {
  const dt = v.lastTick ? time - v.lastTick : 16
  v.lastTick = time
  // (a hidden tab or a long load stall isn't a slow frame)
  if (dt > 250) return
  v.frameMs += (dt - v.frameMs) * 0.05
  if (!v.quality.adaptive || v.quality.resolution !== 'auto' || time - v.lastAdapt < 2000) return
  const auto = Math.min(devicePixelRatio, 2)
  if (v.frameMs > 34 && auto * v.adaptiveScale > 0.75) {
    v.adaptiveScale = Math.max(0.75 / auto, v.adaptiveScale * 0.8)
  } else if (v.frameMs < 18 && v.adaptiveScale < 1 && time - v.lastAdapt > 6000) {
    v.adaptiveScale = Math.min(1, v.adaptiveScale / 0.8)
  } else return
  v.lastAdapt = time
  v.applyPixelRatio()
}
