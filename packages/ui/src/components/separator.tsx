import { Separator as SeparatorPrimitive } from '@base-ui/react/separator'
import { cn } from '@conar/ui/lib/utils'

function Separator({
  className,
  orientation = 'horizontal',
  ...props
}: SeparatorPrimitive.Props) {
  return (
    <SeparatorPrimitive
      className={cn(
        `
          shrink-0 bg-border
          data-[orientation=horizontal]:h-(--border-hairline)
          data-[orientation=horizontal]:w-full
          data-[orientation=vertical]:w-(--border-hairline)
          data-[orientation=vertical]:not-[[class^='h-']]:not-[[class*='_h-']]:self-stretch
        `,
        className,
      )}
      data-slot="separator"
      orientation={orientation}
      {...props}
    />
  )
}

export { Separator }
