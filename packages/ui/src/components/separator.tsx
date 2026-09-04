import { Separator as SeparatorPrimitive } from '@base-ui/react/separator'
import { cn } from '@tamery/ui/lib/utils'

const Separator = ({
  className,
  orientation = 'horizontal',
  ...props
}: SeparatorPrimitive.Props) => (
  <SeparatorPrimitive
    data-slot="separator"
    orientation={orientation}
    className={cn(
      `bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px`,
      className
    )}
    {...props}
  />
)

export { Separator }
