import { cn } from '@tamery/ui/lib/utils'
import type { VariantProps } from 'class-variance-authority'

import { kbdVariants } from './kbd.utils'

const Kbd = ({
  className,
  size,
  ...props
}: React.ComponentProps<'kbd'> & VariantProps<typeof kbdVariants>) => (
  <kbd
    data-slot="kbd"
    className={cn(kbdVariants({ size }), className)}
    {...props}
  />
)

const KbdGroup = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <kbd
    data-slot="kbd-group"
    className={cn('inline-flex items-center gap-1', className)}
    {...props}
  />
)

export { Kbd, KbdGroup }
