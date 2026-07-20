import { Checkbox as CheckboxPrimitive } from '@base-ui/react/checkbox'
import { RiCheckLine } from '@remixicon/react'
import { cn } from '@tamery/ui/lib/utils'

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        `
          peer relative flex size-4 shrink-0 items-center justify-center
          rounded-md border border-transparent bg-input/90 transition-shadow
          outline-none
          group-has-disabled/field:opacity-50
          after:absolute after:-inset-x-3 after:-inset-y-2
          focus-visible:border-ring focus-visible:ring-3
          focus-visible:ring-ring/30
          disabled:cursor-not-allowed disabled:opacity-50
          aria-invalid:border-destructive/60 aria-invalid:ring-3
          aria-invalid:ring-destructive/30
          aria-invalid:aria-checked:border-primary
          data-checked:border-primary data-checked:bg-primary
          data-checked:text-primary-foreground
        `,
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="
          grid place-content-center text-current transition-none
          [&>svg]:size-3.5
        "
      >
        <RiCheckLine />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
