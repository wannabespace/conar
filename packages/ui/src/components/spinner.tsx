import { RiLoaderLine } from '@remixicon/react'
import { cn } from '@tamery/ui/lib/utils'
import type { ComponentProps } from 'react'

function Spinner({ className, ...props }: ComponentProps<typeof RiLoaderLine>) {
  return (
    <RiLoaderLine
      data-slot="spinner"
      role="status"
      aria-label="Loading"
      className={cn(`size-4 animate-spin`, className)}
      {...props}
    />
  )
}

export { Spinner }
