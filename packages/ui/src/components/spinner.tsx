import { Loading03Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { HugeiconsIconProps } from '@hugeicons/react'
import { cn } from '@tamery/ui/lib/utils'

const Spinner = ({ className, ...props }: Omit<HugeiconsIconProps, 'icon'>) => (
  <output data-slot="spinner" aria-label="Loading" className="inline-flex">
    <HugeiconsIcon
      icon={Loading03Icon}
      strokeWidth={2}
      className={cn(`size-4 animate-spin`, className)}
      {...props}
    />
  </output>
)

export { Spinner }
