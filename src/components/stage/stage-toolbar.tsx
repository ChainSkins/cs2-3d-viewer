import { Camera, Crosshair, Eye, Hand, HandMetal, RotateCw, ScanSearch } from 'lucide-react'
import type { ReactNode } from 'react'
import { AttackMenu } from '@/components/stage/attack-menu'
import { PillSwitch } from '@/components/stage/pill-switch'
import { ToolButton } from '@/components/stage/tool-button'
import type { AttackInfo } from '@/lib/data/attacks'
import type { KnifePose } from '@/lib/viewer/skin-viewer'
import { cn } from '@/lib/utils'

export interface StageToolbarProps {
  spin: boolean
  isWeapon: boolean
  isGlove: boolean
  firstPerson: boolean
  palmUp: boolean
  canInspect: boolean
  canInspectGloves: boolean
  attacks: AttackInfo[]
  stats: ReactNode
  showingBack: boolean
  onSide: (back: boolean) => void
  knifePose: KnifePose | null
  onKnifePose: (pose: KnifePose) => void
  onToggleSpin: () => void
  onToggleFirstPerson: () => void
  onTogglePalmUp: () => void
  onInspect: () => void
  onInspectGloves: () => void
  onAttack: (name?: string) => void
  onScreenshot: () => void
}

const DIVIDER = <span aria-hidden className="mx-0.5 hidden h-5 w-px shrink-0 bg-white/10 sm:block" />

export function StageToolbar({ spin, isWeapon, isGlove, firstPerson, palmUp, canInspect, canInspectGloves, attacks, stats, showingBack, onSide, knifePose, onKnifePose, onToggleSpin, onToggleFirstPerson, onTogglePalmUp, onInspect, onInspectGloves, onAttack, onScreenshot }: StageToolbarProps) {
  const inFirstPerson = firstPerson && isWeapon
  const hint = inFirstPerson
    ? (canInspect ? 'Move the mouse to sway · F to inspect' : 'Move the mouse to sway') + (attacks.length ? ' · click or Space to fire' : '')
    : 'Drag to rotate · scroll to zoom'
  return (
    <div className="grid w-full grid-cols-1 items-end gap-2 lg:grid-cols-[1fr_auto_1fr]">
      <div className="hidden min-w-0 flex-wrap items-center gap-x-4 gap-y-1 lg:flex">{stats}</div>

      <div className="glass-panel pointer-events-auto flex max-w-full flex-wrap items-center justify-center gap-1 justify-self-center rounded-xl p-1">
        <PillSwitch
          label="Front / Back"
          options={[{ value: 'front', label: 'Front' }, { value: 'back', label: 'Back' }]}
          value={showingBack ? 'back' : 'front'}
          onChange={(v) => onSide(v === 'back')}
        />
        {knifePose && (
          <PillSwitch
            label="Knife pose"
            options={[{ value: 'vertical', label: 'Vertical' }, { value: 'horizontal', label: 'Flat' }, { value: 'tilted', label: 'Tilted' }]}
            value={knifePose}
            onChange={onKnifePose}
          />
        )}
        {DIVIDER}
        <ToolButton icon={RotateCw} label="Auto-rotate" pressed={spin} disabled={inFirstPerson} iconClassName={cn(spin && !inFirstPerson && 'animate-spin [animation-duration:3s]')} onClick={onToggleSpin} />
        {isWeapon && <ToolButton icon={Eye} label="First person (V)" pressed={firstPerson} onClick={onToggleFirstPerson} />}
        {inFirstPerson && canInspect && <ToolButton icon={ScanSearch} label="Inspect (F)" onClick={onInspect} />}
        {inFirstPerson && attacks.length > 0 && <ToolButton icon={Crosshair} label="Fire (click · Space)" onClick={() => onAttack()} />}
        {inFirstPerson && attacks.length > 1 && <AttackMenu attacks={attacks} onAttack={onAttack} />}
        {((inFirstPerson && canInspectGloves) || isGlove) && <ToolButton icon={HandMetal} label="Look at gloves (G)" onClick={onInspectGloves} />}
        {isGlove && <ToolButton icon={Hand} label="Right glove palm-up" pressed={palmUp} onClick={onTogglePalmUp} />}
        {DIVIDER}
        <ToolButton icon={Camera} label="Save screenshot" onClick={onScreenshot} />
      </div>

      <span className="hidden justify-self-end text-right text-[11.5px] text-muted-foreground lg:block">{hint}</span>
    </div>
  )
}
