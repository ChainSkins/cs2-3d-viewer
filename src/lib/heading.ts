import type { AgentIndex } from '@/lib/data/agents'
import type { PatchIndex } from '@/lib/data/patches'
import type { PetIndex } from '@/lib/data/pets'
import type { PinIndex } from '@/lib/data/pins'
import type { AttachmentIndex } from '@/lib/data/attachments'
import type { CatalogSkin } from '@/lib/data/catalog'
import type { Item } from '@/lib/data/items'
import type { CatalogIndex } from '@/lib/data/catalog'
import type { Db } from '@/lib/db'
import { ASSET_BASE } from '@/lib/config'
import { VIEWER_DATA } from '@/lib/data/catalog'
import { STICKER_KIND, stickerKindOf, variantName } from '@/lib/picker'
import { rarityColor } from '@/lib/rarity'
import type { Selection } from '@/lib/selection'
import { STYLE_LABEL } from '@/lib/wear'

export interface Heading {
  over: string
  title: string
  chips: string[]
  color: string
  /** Its market image, when the db has one. */
  icon?: string
}

/**
 * The title block of the current selection.
 * @param selection what is shown
 * @param item the loaded skin, if any
 * @param skin the selection's catalog entry, if any
 * @param attachments the sticker and charm index
 * @param catalog the catalog index (for the skin's defindex)
 * @param db the db, for the in-game rarity
 * @param agents the agents index (agent selections)
 * @param pins the pins index (pin selections)
 * @param patches the patches index (patch selections)
 */
export function headingFor(selection: Selection, item: Item | null, skin: CatalogSkin | undefined, attachments: AttachmentIndex | null, catalog: CatalogIndex | null, db: Db, agents: AgentIndex | null = null, pins: PinIndex | null = null, patches: PatchIndex | null = null, pets: PetIndex | null = null): Heading {
  if (selection.kind === 'sticker') {
    const sticker = attachments?.sticker.get(selection.id)
    const color = sticker ? rarityColor(db.sticker(sticker.index).rarity, sticker.rarity, '#e4ae39') : '#e4ae39'
    return { over: 'Sticker', title: sticker?.name ?? selection.id, chips: [(sticker && STICKER_KIND[stickerKindOf(sticker)]) ?? 'Sticker', 'csgo_weapon_sticker'], color, icon: sticker ? db.sticker(sticker.index).image : undefined }
  }
  if (selection.kind === 'charm') {
    const charm = attachments?.charm.get(selection.id)
    const color = charm ? rarityColor(db.charm(charm.index).rarity, charm.rarity, '#8847ff') : '#8847ff'
    return { over: 'Charm', title: charm?.name ?? selection.id, chips: ['Keychain', 'Pattern 0–100000'], color, icon: charm ? db.charm(charm.index).image : undefined }
  }
  if (selection.kind === 'patch') {
    const patch = patches?.patch.get(selection.id)
    const color = rarityColor(db.patch(patch?.index ?? 0).rarity ?? patch?.rarity ?? undefined, undefined, '#b0c3d9')
    return { over: 'Agent patch', title: patch?.name ?? selection.id, chips: ['Patch'], color, icon: patch ? db.patch(patch.index).image : undefined }
  }
  if (selection.kind === 'pet') {
    const pet = pets?.pet.get(selection.id)
    return { over: 'Pet', title: pet?.name ?? selection.id, chips: ['Pet'], color: '#e4ae39', icon: petThumb(selection.id, selection.variant ?? 0) }
  }
  if (selection.kind === 'pin') {
    const pin = pins?.pin.get(selection.id)
    const color = pin ? rarityColor(db.pin(pin.index).rarity, undefined, '#b0c3d9') : '#b0c3d9'
    return { over: 'Collectible', title: (pin?.name ?? selection.id).replace(/ Pin$/, ''), chips: ['Pin'], color, icon: pin ? db.pin(pin.index).image : undefined }
  }
  if (selection.kind === 'agent') {
    const agent = agents?.agent.get(selection.id)
    const [title, faction] = (agent?.name ?? selection.id).split(' | ')
    const color = agent ? rarityColor(db.agent(agent.index).rarity, agent.rarity, '#b0c3d9') : '#b0c3d9'
    return { over: faction ?? 'Agent', title, chips: [agent?.team === 't' ? 'Terrorist' : 'Counter-Terrorist', 'Agent'], color, icon: agent ? db.agent(agent.index).image : undefined }
  }
  const color = rarityColor(skin ? db.skin(catalog?.items[skin.item]?.defindex, skin.paintIndex).rarity : undefined, skin?.rarity, '#71717a')
  const icon = skin ? db.skin(catalog?.items[skin.item]?.defindex, skin.paintIndex).image : undefined
  if (!item) return { over: skin ? '' : selection.item, title: skin ? variantName(skin) : selection.kit, chips: [], color, icon }
  const [weapon, baseFinish = ''] = item.title.split(' | ')
  const subtitle = item.subtitle.split(' · ')
  return {
    over: weapon,
    title: skin ? variantName(skin) : baseFinish,
    chips: [subtitle[0], item.style === 'bare' ? item.styleName + ' · not ported yet' : subtitle[1] ?? STYLE_LABEL[item.style]],
    color,
    icon,
  }
}

/** A pet colour's picture (pets/thumbs, one per colour of its model). */
export const petThumb = (id: string, variant: number) => `${ASSET_BASE}${VIEWER_DATA}pets/thumbs/pet_${id}_${variant}.webp`
