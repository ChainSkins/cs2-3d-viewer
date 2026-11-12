import { useCallback, useEffect, useState } from 'react'
import { useLocalStorage } from '@/hooks/common/use-local-storage'

export type ThemeChoice = 'system' | 'light' | 'dark'

const DARK_QUERY = '(prefers-color-scheme: dark)'
const systemDark = () => typeof matchMedia === 'function' && matchMedia(DARK_QUERY).matches

function apply(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#111110' : '#f1f0ef')
}

export function useTheme() {
  const [choice, setChoice] = useLocalStorage<ThemeChoice>('theme', 'system')
  const [system, setSystem] = useState(systemDark)
  const dark = choice === 'system' ? system : choice === 'dark'

  useEffect(() => {
    if (typeof matchMedia !== 'function') return
    const query = matchMedia(DARK_QUERY)
    const onChange = () => setSystem(query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  useEffect(() => { apply(dark) }, [dark])

  const toggle = useCallback(() => setChoice(dark ? 'light' : 'dark'), [dark, setChoice])
  return { choice, dark, setChoice, toggle }
}
