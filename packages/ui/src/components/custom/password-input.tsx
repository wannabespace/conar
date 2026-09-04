import { ViewIcon, ViewOffSlashIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
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
import type { ComponentProps } from 'react'
import { useState } from 'react'

export const PasswordInput = (
  props: Omit<ComponentProps<typeof InputGroupInput>, 'type'>
) => {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <InputGroup className="relative">
      <InputGroupInput type={showPassword ? 'text' : 'password'} {...props} />
      <InputGroupAddon align="inline-end">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
              />
            }
          >
            <HugeiconsIcon
              icon={showPassword ? ViewOffSlashIcon : ViewIcon}
              strokeWidth={2}
              className="size-4"
              aria-hidden="true"
            />
          </TooltipTrigger>
          <TooltipContent side="top">
            {showPassword ? 'Hide password' : 'Show password'}
          </TooltipContent>
        </Tooltip>
      </InputGroupAddon>
    </InputGroup>
  )
}
