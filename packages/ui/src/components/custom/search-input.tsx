import { RiCloseLine } from '@remixicon/react'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@tamery/ui/components/input-group'
import { cn } from '@tamery/ui/lib/utils'
import type * as React from 'react'

import { Button } from '../button'

export function SearchInput({
  className,
  value,
  onClear,
  ...props
}: React.ComponentProps<'input'> & {
  onClear: () => void
}) {
  const hasValue = typeof value === 'string' ? value.length > 0 : Boolean(value)

  return (
    <InputGroup className={cn(className)}>
      <InputGroupInput value={value} {...props} />
      {hasValue && (
        <InputGroupAddon align="inline-end">
          <Button variant="ghost" size="icon-xs" onClick={onClear}>
            <RiCloseLine />
          </Button>
        </InputGroupAddon>
      )}
    </InputGroup>
  )
}
