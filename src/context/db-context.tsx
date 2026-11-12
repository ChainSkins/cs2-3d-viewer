import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { cachedJson } from '@/lib/cached-json'
import { DB_URL } from '@/lib/config'
import { createDbLookups, type Db, type DbData } from '@/lib/db'

const DB_MAX_AGE = 3 * 60 * 60 * 1000

const DbContext = createContext<Db>({ ...createDbLookups(null), ready: false, error: null })

type Load = { data: DbData | null; error: string | null }

export function DbProvider({ children }: { children: ReactNode }) {
  const [load, setLoad] = useState<Load>({ data: null, error: null })

  useEffect(() => {
    let cancelled = false
    cachedJson<DbData>(DB_URL, DB_MAX_AGE)
      .then((data) => { if (!cancelled) setLoad({ data, error: null }) })
      .catch((e: Error) => {
        if (cancelled) return
        console.warn('db.json:', e.message)
        setLoad({ data: null, error: e.message })
      })
    return () => { cancelled = true }
  }, [])

  const db = useMemo<Db>(() => ({ ...createDbLookups(load.data), ready: !!load.data, error: load.error }), [load])
  return <DbContext.Provider value={db}>{children}</DbContext.Provider>
}

export function useDb(): Db {
  return useContext(DbContext)
}
