import type { ReactNode } from 'react'

export function FieldGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11.5px] font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}
