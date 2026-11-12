import { Slider as SliderPrimitive } from '@base-ui/react/slider'
import { useSliderDraft } from '@/hooks/common/use-slider-draft'
import { cn } from '@/lib/utils'

interface ColorBarSliderProps {
  value: number
  min: number
  max: number
  step: number
  background: string
  label: string
  className?: string
  onChange: (value: number) => void
}

export function ColorBarSlider({ value, min, max, step, background, label, className, onChange }: ColorBarSliderProps) {
  const slider = useSliderDraft(value, onChange)
  return (
    <SliderPrimitive.Root
      aria-label={label}
      min={min}
      max={max}
      step={step}
      value={[slider.value]}
      onValueChange={slider.onValueChange}
      onValueCommitted={slider.onValueCommitted}
      thumbAlignment="edge"
      className={cn('w-full', className)}
    >
      <SliderPrimitive.Control className="flex h-6 w-full touch-none items-center select-none">
        <SliderPrimitive.Track className="relative h-2 w-full rounded-full" style={{ background }}>
          <SliderPrimitive.Thumb className="block size-4 rounded-full bg-white shadow-[0_1px_3px_rgb(0_0_0/0.5),0_0_0_1px_rgb(0_0_0/0.3)] outline-none transition-shadow hover:shadow-[0_1px_3px_rgb(0_0_0/0.5),0_0_0_4px_rgb(255_255_255/0.16)] focus-visible:ring-3 focus-visible:ring-ring/60" />
        </SliderPrimitive.Track>
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  )
}
