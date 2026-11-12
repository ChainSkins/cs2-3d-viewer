import { useCallback, useMemo } from 'react'
import { useLocalStorage } from '@/hooks/common/use-local-storage'
import type { PickerCard } from '@/lib/picker'

const RECENT_MAX = 40
const FAVORITES_MAX = 300


export function usePickerShelf() {
  const [recent, setRecent] = useLocalStorage<PickerCard[]>('picker-recent', [])
  const [favorites, setFavorites] = useLocalStorage<PickerCard[]>('picker-favorites', [])
  const favoriteKeys = useMemo(() => new Set(favorites.map((c) => c.key)), [favorites])

  const addRecent = useCallback((card: PickerCard) => {
    setRecent((prev) => [card, ...prev.filter((c) => c.key !== card.key)].slice(0, RECENT_MAX))
  }, [setRecent])
  const clearRecent = useCallback(() => setRecent([]), [setRecent])
  const toggleFavorite = useCallback((card: PickerCard) => {
    setFavorites((prev) => (prev.some((c) => c.key === card.key) ? prev.filter((c) => c.key !== card.key) : [card, ...prev].slice(0, FAVORITES_MAX)))
  }, [setFavorites])
  const isFavorite = useCallback((key: string) => favoriteKeys.has(key), [favoriteKeys])

  return { recent, favorites, addRecent, clearRecent, toggleFavorite, isFavorite }
}
