import { Cancel01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@tamery/ui/components/input-group'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import type * as React from 'react'

import { Button } from '../button'

export const SearchInput = ({
  className,
  value,
  onClear,
  ...props
}: React.ComponentProps<'input'> & {
  onClear: () => void
}) => {
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
                  className="text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
                  onClick={onClear}
                />
              }
            >
              <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
            </TooltipTrigger>
            <TooltipContent side="top">Clear</TooltipContent>
          </Tooltip>
        </InputGroupAddon>
      )}
    </InputGroup>
  )
}
