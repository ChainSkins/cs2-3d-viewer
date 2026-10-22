import { useEffect } from 'react'

/**
 * Runs `action` when `key` is pressed (no Ctrl / Cmd / Alt), while `enabled`, unless the user is typing in a field.
 * @param key the key, lower case ('f', 'g'…)
 */
export function useKeyShortcut(key: string, enabled: boolean, action: () => void): void {
  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (e.key.toLowerCase() !== key || e.ctrlKey || e.metaKey || e.altKey || target?.closest('input, textarea, [contenteditable]')) return
      action()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [key, enabled, action])
}
