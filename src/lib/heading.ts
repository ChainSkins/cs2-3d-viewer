import type { AgentIndex } from '@/lib/data/agents'
import type { PinIndex } from '@/lib/data/pins'
import type { AttachmentIndex } from '@/lib/data/attachments'
import type { CatalogSkin } from '@/lib/data/catalog'
import type { Item } from '@/lib/data/items'
import type { CatalogIndex } from '@/lib/data/catalog'
import type { DbImages } from '@/context/db-context'
import { STICKER_KIND, stickerKindOf, variantName } from '@/lib/picker'
import { rarityColor } from '@/lib/rarity'
import type { Selection } from '@/lib/selection'
import { STYLE_LABEL } from '@/lib/wear'

export interface Heading {
  over: string
  title: string
  chips: string[]
  color: string
}

/**
 * The title block of the current selection.
 * @param selection what is shown
 * @param item the loaded skin, if any
 * @param skin the selection's catalog entry, if any
 * @param attachments the sticker and charm index
 * @param catalog the catalog index (for the skin's defindex)
 * @param images the db, for the in-game rarity
 * @param agents the agents index (agent selections)
 * @param pins the pins index (pin selections)
 */
export function headingFor(selection: Selection, item: Item | null, skin: CatalogSkin | undefined, attachments: AttachmentIndex | null, catalog: CatalogIndex | null, images: DbImages, agents: AgentIndex | null = null, pins: PinIndex | null = null): Heading {
  if (selection.kind === 'sticker') {
    const sticker = attachments?.sticker.get(selection.id)
    const color = sticker ? rarityColor(images.stickerRarity(sticker.index), sticker.rarity, '#e4ae39') : '#e4ae39'
    return { over: 'Sticker', title: sticker?.name ?? selection.id, chips: [(sticker && STICKER_KIND[stickerKindOf(sticker)]) ?? 'Sticker', 'csgo_weapon_sticker'], color }
  }
  if (selection.kind === 'charm') {
    const charm = attachments?.charm.get(selection.id)
    const color = charm ? rarityColor(images.charmRarity(charm.index), charm.rarity, '#8847ff') : '#8847ff'
    return { over: 'Charm', title: charm?.name ?? selection.id, chips: ['Keychain', 'Pattern 0–100000'], color }
  }
  if (selection.kind === 'pin') {
    const pin = pins?.pin.get(selection.id)
    const color = pin ? rarityColor(images.pinRarity(pin.index), undefined, '#b0c3d9') : '#b0c3d9'
    return { over: 'Collectible', title: (pin?.name ?? selection.id).replace(/ Pin$/, ''), chips: ['Pin'], color }
  }
  if (selection.kind === 'agent') {
    const agent = agents?.agent.get(selection.id)
    const [title, faction] = (agent?.name ?? selection.id).split(' | ')
    const color = agent ? rarityColor(images.agentRarity(agent.index), agent.rarity, '#b0c3d9') : '#b0c3d9'
    return { over: faction ?? 'Agent', title, chips: [agent?.team === 't' ? 'Terrorist' : 'Counter-Terrorist', 'Agent'], color }
  }
  const color = rarityColor(skin ? images.skinRarity(catalog?.items[skin.item]?.defindex, skin.paintIndex) : undefined, skin?.rarity, '#71717a')
  if (!item) return { over: skin ? '' : selection.item, title: skin ? variantName(skin) : selection.kit, chips: [], color }
  const [weapon, baseFinish = ''] = item.title.split(' | ')
  const subtitle = item.subtitle.split(' · ')
  return {
    over: weapon,
    title: skin ? variantName(skin) : baseFinish,
    chips: [subtitle[0], item.style === 'bare' ? item.styleName + ' · not ported yet' : subtitle[1] ?? STYLE_LABEL[item.style]],
    color,
  }
}
