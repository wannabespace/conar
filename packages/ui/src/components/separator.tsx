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
      `bg-border shrink-0 data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch`,
      className
    )}
    {...props}
  />
)

export { Separator }
