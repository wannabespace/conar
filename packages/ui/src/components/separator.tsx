import { Separator as SeparatorPrimitive } from '@base-ui/react/separator'
import { cn } from '@conar/ui/lib/utils'
import { motion } from 'motion/react'

export const MotionSeparator = motion.create(Separator)

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
          data-[orientation=horizontal]:h-px
          data-[orientation=horizontal]:w-full
          data-[orientation=vertical]:w-px
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
