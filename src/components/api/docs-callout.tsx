import { Info } from 'lucide-react'
import type { ReactNode } from 'react'

export function Callout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <blockquote className="mt-4 flex gap-3 rounded-xs border-l-[3px] border-[#4472d0] bg-[#4472d0]/15 p-5">
      <Info className="mt-0.5 size-4.5 shrink-0 text-[#7ea2ee]" />
      <p><strong className="font-semibold">{title}</strong> - {children}</p>
    </blockquote>
  )
}
