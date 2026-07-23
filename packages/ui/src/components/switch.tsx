import { Switch as SwitchPrimitive } from '@base-ui/react/switch'
import { cn } from '@tamery/ui/lib/utils'

function Switch({
  className,
  size = 'default',
  ...props
}: SwitchPrimitive.Root.Props & {
  size?: 'sm' | 'default'
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        `
          peer group/switch relative inline-flex shrink-0 items-center
          rounded-2xl border-2 transition-all outline-none
          after:absolute after:-inset-x-3 after:-inset-y-2
          focus-visible:border-ring focus-visible:ring-3
          focus-visible:ring-ring/30
          aria-invalid:border-destructive/60 aria-invalid:ring-3
          aria-invalid:ring-destructive/30
          data-[size=default]:h-5 data-[size=default]:w-8
          data-[size=sm]:h-4 data-[size=sm]:w-6
          data-checked:border-primary data-checked:bg-primary
          data-unchecked:border-transparent data-unchecked:bg-muted
          data-disabled:cursor-not-allowed data-disabled:opacity-50
        `,
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="
          pointer-events-none block rounded-2xl bg-white bg-clip-padding
          shadow-sm ring-0
          transition-transform
          group-data-[size=default]/switch:size-4
          group-data-[size=sm]/switch:size-3
          data-checked:translate-x-[calc(100%-4px)]
          data-unchecked:translate-x-0
        "
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
