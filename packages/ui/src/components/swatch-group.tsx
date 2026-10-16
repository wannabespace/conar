import { Toggle as TogglePrimitive } from '@base-ui/react/toggle'
import { ToggleGroup as ToggleGroupPrimitive } from '@base-ui/react/toggle-group'
import { cn } from '@tamery/ui/lib/utils'

const SwatchGroup = ({ className, ...props }: ToggleGroupPrimitive.Props) => (
  <ToggleGroupPrimitive
    data-slot="swatch-group"
    className={cn(
      'has-aria-invalid:invalid-ring inline-flex w-fit items-center gap-2.5',
      className
    )}
    {...props}
  />
)

const SwatchGroupItem = ({ className, ...props }: TogglePrimitive.Props) => (
  <TogglePrimitive
    data-slot="swatch-group-item"
    className={cn(
      `focus-visible:focus-ring ring-offset-background data-pressed:ring-foreground/40 inline-flex size-5 items-center justify-center rounded-full transition-all outline-none hover:scale-110 disabled:pointer-events-none disabled:opacity-50 data-pressed:ring-2 data-pressed:ring-offset-2`,
      className
    )}
    {...props}
  />
)

export { SwatchGroup, SwatchGroupItem }
