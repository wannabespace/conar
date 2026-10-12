import { Radio as RadioPrimitive } from '@base-ui/react/radio'
import { RadioGroup as RadioGroupPrimitive } from '@base-ui/react/radio-group'
import { cn } from '@tamery/ui/lib/utils'

const RadioGroup = <Value,>({
  className,
  ...props
}: RadioGroupPrimitive.Props<Value>) => (
  <RadioGroupPrimitive
    data-slot="radio-group"
    className={cn('grid w-full gap-3', className)}
    {...props}
  />
)

const RadioGroupItem = ({ className, ...props }: RadioPrimitive.Root.Props) => (
  <RadioPrimitive.Root
    data-slot="radio-group-item"
    className={cn(
      `peer bg-foreground/10 ring-foreground/4 hover:ring-foreground/12 focus-visible:focus-ring aria-invalid:invalid-ring data-checked:bg-primary relative flex size-4 shrink-0 items-center justify-center rounded-full border border-transparent shadow-xs ring transition-[background-color,box-shadow] outline-none after:absolute after:-inset-x-3 after:-inset-y-2 disabled:cursor-not-allowed disabled:opacity-50`,
      className
    )}
    {...props}
  >
    <RadioPrimitive.Indicator
      data-slot="radio-group-indicator"
      className="flex items-center justify-center"
    >
      <span className="bg-primary-foreground size-1.5 rounded-full" />
    </RadioPrimitive.Indicator>
  </RadioPrimitive.Root>
)

export { RadioGroup, RadioGroupItem }
