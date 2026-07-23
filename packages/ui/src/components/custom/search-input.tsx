import { RiCloseLine } from '@remixicon/react'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@tamery/ui/components/input-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@tamery/ui/components/tooltip'
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
    <InputGroup className={className}>
      <InputGroupInput value={value} {...props} />
      {hasValue && (
        <InputGroupAddon align="inline-end">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Clear"
                  className="
                    text-muted-foreground
                    hover:bg-foreground/10 hover:text-foreground
                  "
                  onClick={onClear}
                />
              }
            >
              <RiCloseLine />
            </TooltipTrigger>
            <TooltipContent side="top">Clear</TooltipContent>
          </Tooltip>
        </InputGroupAddon>
      )}
    </InputGroup>
  )
}
