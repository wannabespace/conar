import type { ComponentProps } from 'react'
import { RiEyeLine, RiEyeOffLine } from '@remixicon/react'
import { Button } from '@tamery/ui/components/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@tamery/ui/components/input-group'
import { useState } from 'react'

export function PasswordInput(props: Omit<ComponentProps<typeof InputGroupInput>, 'type'>) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <InputGroup className="relative">
      <InputGroupInput
        type={showPassword ? 'text' : 'password'}
        {...props}
      />
      <InputGroupAddon align="inline-end">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword
            ? <RiEyeOffLine className="size-4" aria-hidden="true" />
            : <RiEyeLine className="size-4" aria-hidden="true" />}
          <span className="sr-only">
            {showPassword ? 'Hide password' : 'Show password'}
          </span>
        </Button>
      </InputGroupAddon>
    </InputGroup>
  )
}
