import { Slider as SliderPrimitive } from '@base-ui/react/slider'
import { cn } from '@tamery/ui/lib/utils'

const Slider = ({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: SliderPrimitive.Root.Props) => {
  let values = [min, max]
  if (Array.isArray(value)) {
    values = value
  } else if (Array.isArray(defaultValue)) {
    values = defaultValue
  }

  return (
    <SliderPrimitive.Root
      className={cn(`data-horizontal:w-full data-vertical:h-full`, className)}
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      thumbAlignment="edge"
      {...props}
    >
      <SliderPrimitive.Control className="relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col">
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="bg-input/90 relative grow overflow-hidden rounded-2xl select-none data-horizontal:h-1 data-horizontal:w-full data-vertical:h-full data-vertical:w-1"
        >
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className="bg-primary select-none data-horizontal:h-full data-vertical:w-full"
          />
        </SliderPrimitive.Track>
        {Array.from({ length: values.length }, (_, index) => (
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            key={index}
            className="hover:ring-ring/30 focus-visible:ring-ring/30 block size-4 shrink-0 rounded-2xl bg-white bg-clip-padding shadow-md ring-1 ring-black/10 transition-[color,box-shadow] duration-200 select-none hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
          />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  )
}

export { Slider }
