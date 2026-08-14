import { Checkbox as CheckboxPrimitive } from '@base-ui/react/checkbox'
import { RiCheckLine } from '@remixicon/react'
import { cn } from '@tamery/ui/lib/utils'

const Checkbox = ({ className, ...props }: CheckboxPrimitive.Root.Props) => (
  <CheckboxPrimitive.Root
    data-slot="checkbox"
    className={cn(
      `peer bg-input/90 focus-visible:border-ring focus-visible:ring-ring/30 aria-invalid:border-destructive/60 aria-invalid:ring-destructive/30 aria-invalid:aria-checked:border-primary data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground relative flex size-4 shrink-0 items-center justify-center rounded-md border border-transparent transition-shadow outline-none group-has-disabled/field:opacity-50 after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-3`,
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      data-slot="checkbox-indicator"
      className="grid place-content-center text-current transition-none [&>svg]:size-3.5"
    >
      <RiCheckLine />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
)

export { Checkbox }
