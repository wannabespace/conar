import { cn } from '@conar/ui/lib/utils'
import { RiLoader4Line } from '@remixicon/react'
import type * as React from 'react'

export function Spinner({
  className,
  ...props
}: React.ComponentProps<typeof RiLoader4Line>): React.ReactElement {
  return (
    <RiLoader4Line
      aria-label="Loading"
      className={cn('animate-spin', className)}
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- this is an SVG icon component, not swappable for a semantic `<output>` element
      role="status"
      {...props}
    />
  )
}
