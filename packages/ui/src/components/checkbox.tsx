import { Checkbox as CheckboxPrimitive } from '@base-ui/react/checkbox'
import { Tick02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { cn } from '@tamery/ui/lib/utils'

const Checkbox = ({ className, ...props }: CheckboxPrimitive.Root.Props) => (
  <CheckboxPrimitive.Root
    data-slot="checkbox"
    className={cn(
      `peer bg-input/90 ring-foreground/20 hover:ring-foreground/35 focus-visible:focus-ring data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground aria-invalid:invalid-ring relative flex size-4 shrink-0 items-center justify-center rounded-md border border-transparent shadow-xs ring transition-[color,background-color,border-color,box-shadow] outline-none group-has-disabled/field:opacity-50 after:absolute after:-inset-x-3 after:-inset-y-2 disabled:cursor-not-allowed disabled:opacity-50`,
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      data-slot="checkbox-indicator"
      className="grid place-content-center text-current transition-none [&>svg]:size-3.5"
    >
      <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
)

export { Checkbox }
