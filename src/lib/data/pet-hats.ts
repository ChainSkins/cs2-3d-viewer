import type { DrawCall } from '@/lib/data/catalog'
import { VIEWER_DATA } from '@/lib/data/catalog'

/** A hat of the photo booth (build_pet_hats.py): its model and materials, and which point of the pet's head it hangs on. */
export interface PetHat { id: number; name: string; label: string; glb: string; attach: 'head_attach' | 'eyewear_attach'; drawCalls: DrawCall[] }

/** A point of a pet's model (its vmdl attachments): the bone it follows, and its rotation (xyzw) and offset in that bone's space. */
export interface HatAttachment { bone: string; rot: number[]; pos: number[] }

export interface PetHats {
  hats: PetHat[]
  /** By pet model (models/chicken/chicken.vmdl…): its head_attach and eyewear_attach. */
  attach: Record<string, Partial<Record<PetHat['attach'], HatAttachment | null>>>
  /** The hat's size on a pet of each growth stage (the booth's headwearScale). */
  scale: { chick: number; pullet: number; hen: number }
}

const loaded = new Map<string, Promise<PetHats>>()

/** The photo booth's hats and where the pets wear them; loaded once per asset root. */
export function loadPetHats(base: string): Promise<PetHats> {
  let p = loaded.get(base)
  if (!p) {
    p = fetch(base + VIEWER_DATA + 'pet_hats.json').then((r) => r.json() as Promise<PetHats>)
    p.catch(() => loaded.delete(base))
    loaded.set(base, p)
  }
  return p
}
