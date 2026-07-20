import { Radio as RadioPrimitive } from '@base-ui/react/radio'
import { RadioGroup as RadioGroupPrimitive } from '@base-ui/react/radio-group'
import { cn } from '@tamery/ui/lib/utils'

function RadioGroup({ className, ...props }: RadioGroupPrimitive.Props) {
  return (
    <RadioGroupPrimitive
      data-slot="radio-group"
      className={cn('grid w-full gap-3', className)}
      {...props}
    />
  )
}

function RadioGroupItem({ className, ...props }: RadioPrimitive.Root.Props) {
  return (
    <RadioPrimitive.Root
      data-slot="radio-group-item"
      className={cn(
        `
          group/radio-group-item peer relative flex aspect-square size-4
          shrink-0 rounded-2xl border border-transparent bg-input/90
          outline-none
          after:absolute after:-inset-x-3 after:-inset-y-2
          focus-visible:border-ring focus-visible:ring-3
          focus-visible:ring-ring/30
          disabled:cursor-not-allowed disabled:opacity-50
          aria-invalid:border-destructive/60 aria-invalid:ring-3
          aria-invalid:ring-destructive/30
          data-checked:bg-primary data-checked:text-primary-foreground
        `,
        className,
      )}
      {...props}
    >
      <RadioPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="flex size-4 items-center justify-center"
      >
        <span
          className="
          absolute top-1/2 left-1/2 size-2 -translate-1/2 rounded-full
          bg-primary-foreground
        "
        />
      </RadioPrimitive.Indicator>
    </RadioPrimitive.Root>
  )
}

export { RadioGroup, RadioGroupItem }
