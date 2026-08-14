import { RiLoaderLine } from '@remixicon/react'
import { cn } from '@tamery/ui/lib/utils'
import type { ComponentProps } from 'react'

const Spinner = ({
  className,
  ...props
}: ComponentProps<typeof RiLoaderLine>) => (
  <output data-slot="spinner" aria-label="Loading" className="inline-flex">
    <RiLoaderLine className={cn(`size-4 animate-spin`, className)} {...props} />
  </output>
)

export { Spinner }
