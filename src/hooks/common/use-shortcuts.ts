import { useEffect } from 'react'

const within = (e: KeyboardEvent, selector: string) => !!(e.target as HTMLElement | null)?.closest(selector)

/** The key is being typed into a field: no shortcut should take it. */
export const isTyping = (e: KeyboardEvent) => within(e, 'input, textarea, select, [contenteditable]')

/** The key lands on a focused control that acts on it itself (Space presses a button). */
export const isOnControl = (e: KeyboardEvent) => within(e, 'button, a, [role=button]')

const hasModifier = (e: KeyboardEvent) => e.ctrlKey || e.metaKey || e.altKey

/** @param key lower case ('f', 'g', ' ') */
export function useKeyShortcut(key: string, enabled: boolean, action: () => void): void {
  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== key || hasModifier(e) || isTyping(e)) return
      // Space: no page scroll, and not on top of a focused button's own click.
      if (key === ' ') {
        if (isOnControl(e)) return
        e.preventDefault()
      }
      action()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [key, enabled, action])
}

/** Opens the picker on "/" (unless typing in a field) or Ctrl+K / ⌘K, while `enabled`. */
export function useOpenPickerShortcut(enabled: boolean, open: () => void): void {
  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => {
      const slash = e.key === '/' && !hasModifier(e) && !isTyping(e)
      const k = e.key.toLowerCase() === 'k' && (e.ctrlKey || e.metaKey) && !e.altKey
      if (!slash && !k) return
      e.preventDefault()
      open()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enabled, open])
}
