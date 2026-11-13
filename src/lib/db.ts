interface DbRecord { market_hash_name?: string; image?: string; image_akamaihd?: string; rarity?: number }
export interface DbData {
  weapons?: Record<string, { paints?: Record<string, DbRecord> }>
  stickers?: Record<string, DbRecord>
  keychains?: Record<string, DbRecord>
  agents?: Record<string, DbRecord>
  pins?: Record<string, DbRecord>
  patches?: Record<string, DbRecord>
}

export interface DbEntry {
  image?: string
  rarity?: number
  name?: string
}

export interface DbLookups {
  skin: (defindex: number | undefined, paintIndex: number | undefined) => DbEntry
  sticker: (index: number) => DbEntry
  charm: (index: number) => DbEntry
  agent: (index: number) => DbEntry
  pin: (index: number) => DbEntry
  patch: (id: number) => DbEntry
}

export interface Db extends DbLookups {
  ready: boolean
  error: string | null
}

const sized = (url: string | undefined) => (url && url.includes('/economy/image/') && !/\/\d+fx\d+f$/.test(url) ? `${url}/256fx192f` : url)

const rarityOf = (value: number | undefined) => (typeof value === 'number' && value > 0 ? value : undefined)

const NOTHING: DbEntry = Object.freeze({})

/**
 * The lookups over db.json's data (all empty without it).
 * @param resize false: the images as the db has them (pins 404 with a size suffix)
 */
function lookup(table: Record<string, DbRecord> | undefined, resize = true) {
  return (key: number | string | undefined): DbEntry => {
    const record = key === undefined ? undefined : table?.[key]
    if (!record) return NOTHING
    const image = record.image_akamaihd ?? (resize ? sized(record.image) : record.image)
    return { image, rarity: rarityOf(record.rarity), name: record.market_hash_name }
  }
}

export function createDbLookups(data: DbData | null): DbLookups {
  return {
    skin: (defindex, paintIndex) => (defindex === undefined || paintIndex === undefined ? NOTHING : lookup(data?.weapons?.[defindex]?.paints)(paintIndex)),
    sticker: lookup(data?.stickers),
    charm: lookup(data?.keychains),
    agent: lookup(data?.agents),
    pin: lookup(data?.pins, false),
    patch: lookup(data?.patches),
  }
}
